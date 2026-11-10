const Stripe = require('stripe');

let stripeClient = null;

if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
  try {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
    console.log('[Stripe] Initialized with configured secret key');
  } catch (err) {
    console.warn('[Stripe] Failed to initialize client:', err.message);
  }
} else {
  console.log('[Stripe] No STRIPE_SECRET_KEY configured or placeholder used. Running in test-readiness mode.');
}

const getStripe = () => {
  return stripeClient;
};

const isStripeConfigured = () => {
  return Boolean(stripeClient);
};

module.exports = {
  getStripe,
  isStripeConfigured
};
