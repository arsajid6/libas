const LeopardsAdapter = require('./leopards');
const TCSAdapter = require('./tcs');

class CourierEngine {
  static getAdapter(providerName, config) {
    switch (providerName.toLowerCase()) {
      case 'leopards':
        return new LeopardsAdapter(config);
      case 'tcs':
        return new TCSAdapter(config);
      // Fallback or generic mock for others
      default:
        return {
          testConnection: async () => ({ success: true, message: `${providerName} connection successful (Mock)!` }),
          createShipment: async (order) => ({
            success: true,
            tracking_number: providerName.substring(0,3).toUpperCase() + Math.floor(Math.random() * 1000000000),
            tracking_url: `https://mock.com/track?no=`
          }),
          trackShipment: async (trackingNumber) => ({
            success: true,
            status: 'Pending',
            details: 'Shipment booked.'
          })
        };
    }
  }
}

module.exports = CourierEngine;
