class PaymentMockAdapter {
  constructor(config) {
    this.config = config;
  }

  async testConnection() {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.config.api_key && this.config.secret_key) {
          resolve({ success: true, message: 'Connection successful. Valid credentials.' });
        } else {
          resolve({ success: false, message: 'Invalid credentials. Missing API Key or Secret Key.' });
        }
      }, 1000);
    });
  }

  async createPaymentRequest(order) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          transaction_id: `TXN-${Date.now()}`,
          redirect_url: `https://mockgateway.com/pay/${order.id}`,
          message: 'Payment request generated successfully.'
        });
      }, 500);
    });
  }
}

module.exports = PaymentMockAdapter;
