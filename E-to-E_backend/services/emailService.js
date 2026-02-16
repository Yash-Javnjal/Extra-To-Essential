const fs = require('fs');
const path = require('path');
const transporter = require('../utils/mailer');

// ─── Template Cache ──────────────────────────────────────────────
const templateCache = {};

/**
 * Load an HTML template from /templates/ and cache it.
 * Replaces all {{key}} placeholders with values from the data object.
 */
const loadTemplate = (templateName, data = {}) => {
  if (!templateCache[templateName]) {
    const filePath = path.join(__dirname, '..', 'templates', templateName);
    templateCache[templateName] = fs.readFileSync(filePath, 'utf-8');
    console.log(`[EMAIL] Template loaded & cached: ${templateName}`);
  }

  let html = templateCache[templateName];

  // Replace all {{key}} placeholders
  Object.entries(data).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value ?? '');
  });

  return html;
};

// ─── Core Send Function ──────────────────────────────────────────
/**
 * Send an email with the given options.
 * @param {Object} opts - { to, subject, html }
 * @returns {Promise<Object>} - { success, messageId? , error? }
 */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    console.log(`[EMAIL] ✅ Email sent — to: ${to}, subject: "${subject}", messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[EMAIL] ❌ Email failed — to: ${to}, subject: "${subject}", error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ─── Welcome Emails ──────────────────────────────────────────────

/**
 * Send welcome email to a newly registered Donor.
 */
const sendWelcomeDonor = async ({ to, userName, email, phone, organizationName }) => {
  const html = loadTemplate('welcomeDonor.html', {
    userName: userName || 'Donor',
    email: email || to,
    phone: phone || 'N/A',
    organizationName: organizationName || 'N/A',
    dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    supportEmail: process.env.EMAIL_USER || 'support@extratoessential.com',
  });

  return sendEmail({
    to,
    subject: '🌱 Welcome to Extra-To-Essential — Thank You for Joining!',
    html,
  });
};

/**
 * Send welcome email to a newly registered NGO.
 */
const sendWelcomeNGO = async ({ to, userName, email, phone, organizationName, contactPerson }) => {
  const html = loadTemplate('welcomeNGO.html', {
    userName: userName || 'NGO Admin',
    email: email || to,
    phone: phone || 'N/A',
    organizationName: organizationName || 'N/A',
    contactPerson: contactPerson || userName || 'N/A',
    dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    supportEmail: process.env.EMAIL_USER || 'support@extratoessential.com',
  });

  return sendEmail({
    to,
    subject: '🏢 Welcome to Extra-To-Essential — Your NGO is Registered!',
    html,
  });
};

// ─── Listing Created Email ───────────────────────────────────────

/**
 * Notify an NGO that a new food listing has been created nearby.
 */
const sendListingCreatedEmail = async ({
  to,
  ngoName,
  donorName,
  donorPhone,
  foodType,
  quantity,
  mealEquivalent,
  pickupAddress,
  expiryTime,
  distance,
}) => {
  const html = loadTemplate('listingCreated.html', {
    ngoName: ngoName || 'NGO',
    donorName: donorName || 'A Donor',
    donorPhone: donorPhone || 'N/A',
    foodType: foodType || 'Food',
    quantity: quantity || '0',
    mealEquivalent: mealEquivalent || '0',
    pickupAddress: pickupAddress || 'N/A',
    expiryTime: expiryTime || 'N/A',
    distance: distance || 'N/A',
    claimUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  });

  return sendEmail({
    to,
    subject: `🍽️ New Food Donation Available — ${quantity} kg of ${foodType}`,
    html,
  });
};

// ─── Claim Accepted Email ────────────────────────────────────────

/**
 * Notify a donor that their food listing has been claimed by an NGO.
 */
const sendClaimAcceptedEmail = async ({
  to,
  donorName,
  ngoName,
  ngoContact,
  ngoPhone,
  foodType,
  quantity,
  pickupAddress,
  pickupTime,
}) => {
  const html = loadTemplate('claimAccepted.html', {
    donorName: donorName || 'Donor',
    ngoName: ngoName || 'An NGO',
    ngoContact: ngoContact || 'N/A',
    ngoPhone: ngoPhone || 'N/A',
    foodType: foodType || 'Food',
    quantity: quantity || '0',
    pickupAddress: pickupAddress || 'N/A',
    pickupTime: pickupTime || 'To be scheduled',
    dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  });

  return sendEmail({
    to,
    subject: `🎉 Your ${foodType} Donation Has Been Claimed by ${ngoName}!`,
    html,
  });
};

// ─── Delivery Assigned Email ─────────────────────────────────────

/**
 * Notify a volunteer that they have been assigned a delivery.
 */
const sendDeliveryAssignedEmail = async ({
  to,
  volunteerName,
  ngoName,
  ngoPhone,
  donorName,
  donorPhone,
  foodType,
  quantity,
  pickupAddress,
  deliveryStatus,
}) => {
  const html = loadTemplate('deliveryAssigned.html', {
    volunteerName: volunteerName || 'Volunteer',
    ngoName: ngoName || 'NGO',
    ngoPhone: ngoPhone || 'N/A',
    donorName: donorName || 'Donor',
    donorPhone: donorPhone || 'N/A',
    foodType: foodType || 'Food',
    quantity: quantity || '0',
    pickupAddress: pickupAddress || 'N/A',
    deliveryStatus: deliveryStatus || 'Assigned',
    dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  });

  return sendEmail({
    to,
    subject: `🚚 Delivery Assigned — ${quantity} kg of ${foodType}`,
    html,
  });
};

// ─── Delivery Completed Email ────────────────────────────────────

/**
 * Notify donor and/or NGO that a delivery has been completed.
 */
const sendDeliveryCompletedEmail = async ({
  to,
  recipientName,
  donorName,
  donorPhone,
  ngoName,
  ngoPhone,
  volunteerName,
  foodType,
  quantity,
  mealEquivalent,
  pickupAddress,
  deliveryStatus,
  completedAt,
  co2Saved,
}) => {
  const html = loadTemplate('deliveryCompleted.html', {
    recipientName: recipientName || 'User',
    donorName: donorName || 'Donor',
    donorPhone: donorPhone || 'N/A',
    ngoName: ngoName || 'NGO',
    ngoPhone: ngoPhone || 'N/A',
    volunteerName: volunteerName || 'Volunteer',
    foodType: foodType || 'Food',
    quantity: quantity || '0',
    mealEquivalent: mealEquivalent || '0',
    pickupAddress: pickupAddress || 'N/A',
    deliveryStatus: deliveryStatus || 'Delivered',
    completedAt: completedAt || new Date().toLocaleString(),
    co2Saved: co2Saved || '0',
    dashboardUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  });

  return sendEmail({
    to,
    subject: `✨ Delivery Completed — ${quantity} kg of ${foodType} Successfully Delivered!`,
    html,
  });
};

// ─── Exports ─────────────────────────────────────────────────────
module.exports = {
  sendEmail,
  loadTemplate,
  sendWelcomeDonor,
  sendWelcomeNGO,
  sendListingCreatedEmail,
  sendClaimAcceptedEmail,
  sendDeliveryAssignedEmail,
  sendDeliveryCompletedEmail,
};
