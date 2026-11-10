import React, { useState, useEffect } from 'react';
import { useTenant } from '../context/TenantContext';
import api from '../services/api';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { PlanBadge } from '../components/Badge';
import {
  CreditCard,
  Check,
  Sparkles,
  Zap,
  Building,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Shield,
} from 'lucide-react';

export const Billing = () => {
  const { currentOrg, isOwner, refreshOrganization } = useTenant();
  const [billingData, setBillingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cancel dialog
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const fetchBilling = async () => {
    try {
      setLoading(true);
      const res = await api.get('/billing');
      setBillingData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) {
      fetchBilling();
    }
  }, [currentOrg]);

  const handleCheckout = async (targetPlan) => {
    if (!isOwner) {
      setError('Only the organization Owner can manage subscriptions.');
      return;
    }

    setProcessingPlan(targetPlan);
    setError('');
    setSuccess('');

    try {
      // First attempt standard Stripe Checkout session
      const res = await api.post('/billing/checkout', { targetPlan });
      if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    } catch (err) {
      // If Stripe keys are placeholder/not configured, prompt or offer Test Mode instant upgrade
      setError(
        `${err.message} You can use the "Test Mode Upgrade" button below to simulate plan changes instantly!`
      );
    } finally {
      setProcessingPlan('');
    }
  };

  const handleTestUpgrade = async (targetPlan) => {
    setProcessingPlan(targetPlan);
    setError('');
    setSuccess('');

    try {
      await api.post('/billing/test-upgrade', { targetPlan });
      setSuccess(`Workspace successfully updated to ${targetPlan.toUpperCase()} plan.`);
      await fetchBilling();
      await refreshOrganization();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingPlan('');
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      await api.post('/billing/cancel');
      setSuccess('Subscription set to cancel at end of billing period.');
      setIsCancelOpen(false);
      await fetchBilling();
      await refreshOrganization();
    } catch (err) {
      setError(err.message);
    } finally {
      setCanceling(false);
    }
  };

  const currentPlanId = billingData?.currentPlan?.id || currentOrg?.plan || 'free';

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Ideal for early prototypes and small teams.',
      features: [
        'Up to 3 workspace members',
        'Basic dashboard & project tracking',
        'Recent activity logs (last 10 events)',
        'Tenant data isolation guarantee',
      ],
      icon: Zap,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '$29',
      period: 'per month',
      popular: true,
      description: 'For growing businesses requiring analytics & scale.',
      features: [
        'Up to 10 workspace members',
        'Full chronological activity logs',
        'Advanced analytics & member growth',
        'Priority email support',
      ],
      icon: Sparkles,
    },
    {
      id: 'business',
      name: 'Business',
      price: '$99',
      period: 'per month',
      description: 'For organizations with custom branding and capacity.',
      features: [
        'Up to 25 workspace members',
        'Full activity audit trail',
        'Advanced analytics & reporting',
        'Custom workspace settings & branding',
        'Enterprise SSO / domain placeholder',
      ],
      icon: Building,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Billing & Subscription
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage payment methods, seat entitlements, and plan tier for{' '}
          <strong className="text-slate-800">{currentOrg?.name}</strong>.
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Current Subscription Card */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Current Plan
            </span>
            <div className="flex items-center space-x-3 mt-1">
              <h2 className="text-xl font-bold text-slate-900 capitalize">
                {billingData?.currentPlan?.name || currentOrg?.plan} Tier
              </h2>
              <PlanBadge plan={currentPlanId} />
            </div>
          </div>

          {currentPlanId !== 'free' && isOwner && (
            <button
              onClick={() => setIsCancelOpen(true)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Cancel Subscription
            </button>
          )}
        </div>

        {/* Seat Usage Progress */}
        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500">Seats Capacity:</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {billingData?.seats?.used || currentOrg?.memberCount || 1} /{' '}
              {billingData?.seats?.total || 3} used
            </p>
          </div>
          <div>
            <span className="text-slate-500">Billing Cycle:</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">Monthly</p>
          </div>
          <div>
            <span className="text-slate-500">Stripe Integration Status:</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5 flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  billingData?.stripeConfigured ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span>
                {billingData?.stripeConfigured
                  ? 'Stripe Test Mode Connected'
                  : 'Test Mode Simulation Ready'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Plan Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isCurrent = currentPlanId === p.id;
          const Icon = p.icon;

          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition shadow-xs relative ${
                p.popular
                  ? 'border-blue-600 ring-2 ring-blue-600/10'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl bg-slate-50 text-slate-800 border border-slate-200/60">
                    <Icon className="w-5 h-5 text-blue-600" />
                  </div>
                  {isCurrent && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      Active
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{p.description}</p>

                <div className="my-5 flex items-baseline space-x-1">
                  <span className="text-3xl font-extrabold text-slate-900">{p.price}</span>
                  <span className="text-xs text-slate-500">/{p.period}</span>
                </div>

                {/* Features List */}
                <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full py-2 px-3 bg-slate-100 text-slate-400 rounded-lg text-xs font-semibold cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={!isOwner || processingPlan === p.id}
                      onClick={() => handleCheckout(p.id)}
                      className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold text-white transition shadow-xs flex items-center justify-center space-x-1.5 ${
                        p.popular
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-slate-900 hover:bg-slate-800'
                      } disabled:opacity-50`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>
                        {processingPlan === p.id
                          ? 'Processing...'
                          : `Upgrade to ${p.name}`}
                      </span>
                    </button>

                    {/* Instant Test Mode Switcher */}
                    <button
                      type="button"
                      disabled={!isOwner || processingPlan === p.id}
                      onClick={() => handleTestUpgrade(p.id)}
                      className="w-full py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-medium transition"
                      title="Simulates plan change without requiring live Stripe keys"
                    >
                      Instant Test Switch ({p.name})
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cancel Subscription Dialog */}
      <ConfirmDialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onConfirm={handleCancelSubscription}
        loading={canceling}
        title="Cancel Organization Subscription"
        message="Are you sure you want to cancel your paid subscription? Your workspace will remain active until the end of the billing period, after which it will revert to the Free plan with a 3-member limit."
        confirmText="Cancel Subscription"
      />
    </div>
  );
};
