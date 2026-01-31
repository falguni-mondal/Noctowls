// Helper for consistent email styling
const wrapEmail = (content) => `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    <div style="background-color: #000000; padding: 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Noctowls</h1>
    </div>
    
    <div style="padding: 30px; color: #333333; line-height: 1.6;">
      ${content}
    </div>

    <div style="background-color: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0;">© ${new Date().getFullYear()} Noctowls. All rights reserved.</p>
      <p style="margin: 5px 0 0;">Need help? Contact <a href="mailto:help.noctowls@gmail.com" style="color: #d32f2f; text-decoration: none;">help.noctowls@gmail.com</a></p>
    </div>
  </div>
`;

// ==================== CUSTOMER EMAILS ====================

export const getOrderConfirmationEmail = (order) => {
  const itemsList = order.items.map(item => 
    `<li style="margin-bottom: 5px;">${item.productName} (x${item.quantity}) - Size: ${item.size.label}</li>`
  ).join("");

  return wrapEmail(`
    <h2 style="color: #000; margin-top: 0;">Order Confirmed!</h2>
    <p>Hi ${order.customerName},</p>
    <p>Thank you for shopping with Noctowls. Your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px; font-size: 16px;">Order Summary</h3>
      <ul style="padding-left: 20px; margin: 0;">
        ${itemsList}
      </ul>
      <p style="margin-top: 10px; font-weight: bold;">Total: ₹${order.pricing.finalTotal}</p>
    </div>

    <p>We will notify you once your items are shipped.</p>
    <a href="${process.env.CLIENT_URL}/orders/${order._id}" style="display: inline-block; background-color: #d32f2f; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px;">Track Order</a>
  `);
};

export const getOrderCancellationEmail = (order, reason) => {
  return wrapEmail(`
    <h2 style="color: #d32f2f; margin-top: 0;">Order Cancelled</h2>
    <p>Hi ${order.customerName},</p>
    <p>Your order <strong>#${order.orderNumber}</strong> has been cancelled as requested.</p>
    
    <p><strong>Reason:</strong> ${reason}</p>
    
    ${order.payment.status === 'completed' 
      ? `<p style="background-color: #e8f5e9; padding: 10px; border-radius: 4px; color: #2e7d32;">
           <strong>Refund Status:</strong> Your refund of ₹${order.cancellation.refundAmount} has been initiated and will reflect in your source account within 5-7 business days.
         </p>` 
      : ''}
  `);
};

export const getReturnRequestedEmail = (orderNumber, customerName) => {
  return wrapEmail(`
    <h2 style="color: #000; margin-top: 0;">Return Request Received</h2>
    <p>Hi ${customerName},</p>
    <p>We have received your return/exchange request for Order <strong>#${orderNumber}</strong>.</p>
    <p>Our team will review your request and the provided proofs within 24-48 hours. You will receive another email once the request is approved or if we need more information.</p>
  `);
};

export const getReturnStatusUpdateEmail = (orderNumber, customerName, status, extraInfo = "") => {
  let title = "Return Update";
  let color = "#000";
  let message = "";

  switch (status) {
    case "approved":
      title = "Return Approved";
      color = "#2e7d32"; // Green
      message = "Your return request has been approved. Our courier partner will attempt pickup within 1-2 business days. Please keep the item ready with original tags and packaging.";
      break;
    case "rejected":
      title = "Return Request Rejected";
      color = "#d32f2f"; // Red
      message = `Your return request was not approved. <br/><strong>Reason:</strong> ${extraInfo}`;
      break;
    case "refund_processed":
      title = "Refund Initiated";
      color = "#2e7d32";
      message = `We have initiated a refund of <strong>₹${extraInfo}</strong>. It should reflect in your account within 5-7 business days.`;
      break;
    case "exchange_shipped":
      title = "Replacement Shipped";
      color = "#1976d2"; // Blue
      message = "Your replacement item has been dispatched. You will receive tracking details shortly.";
      break;
    default:
      message = `The status of your return for order #${orderNumber} has been updated to: <strong>${status}</strong>.`;
  }

  return wrapEmail(`
    <h2 style="color: ${color}; margin-top: 0;">${title}</h2>
    <p>Hi ${customerName},</p>
    <p>${message}</p>
  `);
};

// ==================== ADMIN EMAILS ====================

export const getAdminAlertEmail = (type, orderNumber, details) => {
  return wrapEmail(`
    <h2 style="color: #d32f2f; margin-top: 0;">[Admin Alert] ${type}</h2>
    <p><strong>Order:</strong> #${orderNumber}</p>
    <p><strong>Details:</strong> ${details}</p>
    <br/>
    <a href="${process.env.ADMIN_DASHBOARD_URL}/orders/${orderNumber}" style="display: inline-block; background-color: #333; color: #fff; padding: 10px 15px; text-decoration: none; border-radius: 4px;">View in Admin Panel</a>
  `);
};