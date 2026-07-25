class LeopardsAdapter {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.base_url || (config.environment === 'Production' ? 'https://api.leopardscourier.com/v1' : 'https://sandbox.leopardscourier.com/v1');
  }

  async testConnection() {
    // Mock API Call
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.config.api_key && this.config.secret_key) {
          resolve({ success: true, message: 'Leopards API connection successful!' });
        } else {
          resolve({ success: false, message: 'Invalid Leopards credentials.' });
        }
      }, 500);
    });
  }

  async createShipment(order) {
    // Mock Create Shipment
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          tracking_number: 'LEO' + Math.floor(Math.random() * 1000000000),
          tracking_url: 'https://leopardscourier.com/tracking?no='
        });
      }, 500);
    });
  }

  async trackShipment(trackingNumber) {
    // Mock Track Shipment
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          status: 'In Transit',
          details: 'Shipment has left origin facility.'
        });
      }, 500);
    });
  }
}

module.exports = LeopardsAdapter;
