const { getStripe, isStripeConfigured } = require('../config/stripe');
const { PLANS, getPlan } = require('../config/plans');
const Organization = require('../models/Organization');
const OrganizationMembership = require('../models/OrganizationMembership');
const Subscription = require('../models/Subscription');
const { logActivity } = require('../utils/auditLogger');

/**
 * Get billing overview, subscription state, and available plans
 */
const getBillingOverview = async (req, res, next) => {
  try {
    const organization = req.organization;
    const subscription = await Subscription.findOne({
      organizationId: organization._id,
    });

    const memberCount = await OrganizationMembership.countDocuments({
      organizationId: organization._id,
    });

    const currentPlanConfig = getPlan(organization.plan);

    res.json({
      success: true,
      currentPlan: {
        id: organization.plan,
        name: currentPlanConfig.name,
        priceMonthly: currentPlanConfig.priceMonthly,
        maxMembers: currentPlanConfig.maxMembers,
        features: currentPlanConfig.features,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            seatsIncluded: subscription.seatsIncluded,
            stripeCustomerId: subscription.stripeCustomerId,
          }
        : null,
      seats: {
        total: currentPlanConfig.maxMembers,
        used: memberCount,
        available: Math.max(0, currentPlanConfig.maxMembers - memberCount),
      },
      plans: Object.values(PLANS),
      stripeConfigured: isStripeConfigured(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a Stripe Checkout session or process upgrade
 */
const createCheckoutSession = async (req, res, next) => {
  try {
    const { targetPlan } = req.body;
    const organization = req.organization;

    if (!['free', 'pro', 'business'].includes(targetPlan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected.',
      });
    }

    if (targetPlan === organization.plan) {
      return res.status(400).json({
        success: false,
        message: `Your organization is already on the ${targetPlan.toUpperCase()} plan.`,
      });
    }

    const planConfig = getPlan(targetPlan);
    const stripe = getStripe();

    // If Stripe is configured with live/test API keys, create Checkout Session
    if (stripe) {
      const appUrl = process.env.CLIENT_URL || 'http://localhost:5173';

      let customerId = organization.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: req.user.email,
          name: organization.name,
          metadata: {
            organizationId: organization._id.toString(),
            userId: req.user._id.toString(),
          },
        });
        customerId = customer.id;
        organization.stripeCustomerId = customerId;
        await organization.save();
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${planConfig.name} Plan - SaaS Platform`,
                description: planConfig.description,
              },
              unit_amount: planConfig.priceMonthly * 100,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${appUrl}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${appUrl}/billing?canceled=true`,
        metadata: {
          organizationId: organization._id.toString(),
          targetPlan,
        },
      });

      return res.json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id,
      });
    }

    // Stripe keys not configured: inform user or handle simulator mode
    return res.status(501).json({
      success: false,
      message:
        'Stripe is not configured. Please supply STRIPE_SECRET_KEY in backend/.env, or use the Test Mode Upgrade button.',
      testModeAvailable: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Direct Test Mode plan change (for rapid testing & evaluation)
 */
const testModeChangePlan = async (req, res, next) => {
  try {
    const { targetPlan } = req.body;
    const organization = req.organization;

    if (!['free', 'pro', 'business'].includes(targetPlan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan selected.',
      });
    }

    const previousPlan = organization.plan;
    const planConfig = getPlan(targetPlan);

    // If downgrading, check if existing member count exceeds new plan's limit
    const memberCount = await OrganizationMembership.countDocuments({
      organizationId: organization._id,
    });

    if (memberCount > planConfig.maxMembers) {
      return res.status(400).json({
        success: false,
        message: `Cannot downgrade to ${planConfig.name}: Organization currently has ${memberCount} members, but the ${planConfig.name} plan only supports ${planConfig.maxMembers} members. Remove members before downgrading.`,
      });
    }

    organization.plan = targetPlan;
    await organization.save();

    await Subscription.findOneAndUpdate(
      { organizationId: organization._id },
      {
        planId: targetPlan,
        status: 'active',
        seatsIncluded: planConfig.maxMembers,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
      },
      { upsert: true, new: true }
    );

    await logActivity({
      organizationId: organization._id,
      userId: req.user._id,
      action: 'subscription.updated',
      details: {
        fromPlan: previousPlan,
        toPlan: targetPlan,
        mode: 'test_mode',
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `Organization subscription successfully updated to ${planConfig.name} plan.`,
      plan: targetPlan,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancel organization subscription
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const organization = req.organization;
    const subscription = await Subscription.findOne({
      organizationId: organization._id,
    });

    if (!subscription || organization.plan === 'free') {
      return res.status(400).json({
        success: false,
        message: 'No active paid subscription found to cancel.',
      });
    }

    const stripe = getStripe();
    if (stripe && subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }

    subscription.cancelAtPeriodEnd = true;
    await subscription.save();

    await logActivity({
      organizationId: organization._id,
      userId: req.user._id,
      action: 'subscription.cancelled',
      details: {
        plan: organization.plan,
        cancelAtPeriodEnd: true,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Subscription will remain active until the end of the billing period.',
      subscription,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle incoming Stripe webhooks
 */
const handleStripeWebhook = async (req, res) => {
  const stripe = getStripe();
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (stripe && endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      event = req.body;
    }
  } catch (err) {
    console.error(`[Stripe Webhook Error] ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const orgId = session.metadata?.organizationId;
        const targetPlan = session.metadata?.targetPlan;

        if (orgId && targetPlan) {
          const planConfig = getPlan(targetPlan);
          await Organization.findByIdAndUpdate(orgId, {
            plan: targetPlan,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
            subscriptionStatus: 'active',
          });

          await Subscription.findOneAndUpdate(
            { organizationId: orgId },
            {
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              planId: targetPlan,
              status: 'active',
              seatsIncluded: planConfig.maxMembers,
            },
            { upsert: true }
          );

          await logActivity({
            organizationId: orgId,
            action: 'subscription.webhook_activated',
            details: { plan: targetPlan, customerId: session.customer },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const org = await Organization.findOne({ stripeSubscriptionId: sub.id });
        if (org) {
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: sub.id },
            {
              status: sub.status,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            }
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const org = await Organization.findOne({ stripeSubscriptionId: sub.id });
        if (org) {
          org.plan = 'free';
          org.subscriptionStatus = 'canceled';
          await org.save();

          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: sub.id },
            {
              planId: 'free',
              status: 'canceled',
              seatsIncluded: 3,
            }
          );

          await logActivity({
            organizationId: org._id,
            action: 'subscription.downgraded_to_free',
            details: { reason: 'stripe_subscription_deleted' },
          });
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`[Stripe Webhook Handler Error] ${err.message}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

module.exports = {
  getBillingOverview,
  createCheckoutSession,
  testModeChangePlan,
  cancelSubscription,
  handleStripeWebhook,
};
