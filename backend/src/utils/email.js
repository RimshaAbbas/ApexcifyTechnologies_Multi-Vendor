const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

/**
 * @param {object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 */
async function sendEmail({ to, subject, html }) {
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
}

const templates = {
  welcome: (name) => ({
    subject: 'Welcome to MultiVendor Store',
    html: `<p>Hi ${name}, thanks for registering!</p>`,
  }),
  vendorApproved: (storeName) => ({
    subject: 'Your vendor account has been approved',
    html: `<p>Congratulations! <strong>${storeName}</strong> is now live on the platform.</p>`,
  }),
  orderConfirmed: (orderId) => ({
    subject: `Order Confirmed — #${orderId}`,
    html: `<p>Your order <strong>#${orderId}</strong> has been confirmed and is being processed.</p>`,
  }),
  orderShipped: (orderId) => ({
    subject: `Order Shipped — #${orderId}`,
    html: `<p>Your order <strong>#${orderId}</strong> is on its way!</p>`,
  }),
};

module.exports = { sendEmail, templates };
