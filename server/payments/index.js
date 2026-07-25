const MockAdapter = require('./mock');

class PaymentEngine {
  static getAdapter(providerName, config) {
    const provider = providerName.toLowerCase();
    
    // In a real-world scenario, you would have separate adapter files
    // for each provider (e.g., jazzcash.js, easypaisa.js, stripe.js).
    // For now, we route all of them to the MockAdapter so they can be
    // integrated and tested from the admin panel safely.
    
    switch (provider) {
      case 'jazzcash':
      case 'easypaisa':
      case 'stripe':
      case 'payfast':
      case 'safepay':
      case 'paypal':
      case 'hbl':
      case 'bank alfalah':
      case 'meezan bank':
      default:
        return new MockAdapter(config);
    }
  }
}

module.exports = PaymentEngine;
