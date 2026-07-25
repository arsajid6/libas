const sendEmail = async (to, subject, htmlContent) => {
  if (!to) return;
  console.log(`\n==================================================`);
  console.log(`📧 MOCK EMAIL SENT`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`--------------------------------------------------`);
  console.log(htmlContent);
  console.log(`==================================================\n`);
  return true;
};

const sendOrderConfirmationEmail = async (order) => {
  const subject = `Order Confirmation - #${order.id}`;
  const htmlContent = `
    Hello ${order.customer_name},

    Thank you for your order!
    Order Number: ${order.id}
    Order Date: ${new Date(order.created_at || Date.now()).toLocaleDateString()}
    Total Amount: Rs. ${order.total_amount}
    Payment Method: ${order.payment_method}
    
    Tracking Token: ${order.tracking_token}
    
    You can track your order at: http://localhost:5173/track-order
  `;
  return sendEmail(order.email, subject, htmlContent);
};

const sendShipmentUpdateEmail = async (order) => {
  let subject = `Shipment Update for Order #${order.id}`;
  if (order.shipment_status === 'Delivered') {
    subject = `Your Order Has Been Delivered - #${order.id}`;
  }

  let htmlContent = `
    Hello ${order.customer_name},

    Your order #${order.id} shipment status has been updated to: ${order.shipment_status}.
  `;

  if (order.courier_name || order.tracking_number) {
    htmlContent += `
    Courier Name: ${order.courier_name || 'N/A'}
    Tracking Number: ${order.tracking_number || 'N/A'}
    Tracking URL: ${order.tracking_url || 'N/A'}
    `;
  }

  if (order.shipment_status === 'Delivered') {
    htmlContent += `\n    Delivery Date: ${new Date().toLocaleDateString()}`;
  }

  return sendEmail(order.email, subject, htmlContent);
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendShipmentUpdateEmail
};
