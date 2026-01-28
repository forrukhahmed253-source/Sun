const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const templates = {
  welcome: {
    subject: 'Welcome to Sun Bank',
    template: 'welcome.html'
  },
  deposit: {
    subject: 'Deposit Confirmation',
    template: 'deposit.html'
  },
  withdrawal: {
    subject: 'Withdrawal Request',
    template: 'withdrawal.html'
  },
  profit: {
    subject: 'Profit Added to Your Account',
    template: 'profit.html'
  },
  resetPassword: {
    subject: 'Password Reset Request',
    template: 'reset-password.html'
  },
  verifyEmail: {
    subject: 'Verify Your Email',
    template: 'verify-email.html'
  }
};

// Load template function
async function loadTemplate(templateName, context) {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', 'emails', templateName);
    let html = await fs.readFile(templatePath, 'utf8');
    
    // Replace placeholders
    Object.keys(context).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, context[key]);
    });
    
    return html;
  } catch (error) {
    console.error('Error loading email template:', error);
    // Return basic HTML as fallback
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>${context.subject || 'Notification'}</h2>
        <p>${context.message || 'This is an automated message from Sun Bank.'}</p>
        ${context.additionalInfo ? `<p>${context.additionalInfo}</p>` : ''}
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;
  }
}

// Send email function
const sendEmail = async (options) => {
  try {
    const template = templates[options.template] || {};
    const html = await loadTemplate(template.template || 'default.html', options.context);

    const mailOptions = {
      from: `"Sun Bank" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: options.email,
      subject: options.subject || template.subject || 'Notification from Sun Bank',
      html,
      ...(options.text && { text: options.text })
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Send bulk emails (for notifications)
const sendBulkEmail = async (emails, templateName, context) => {
  try {
    const template = templates[templateName];
    const html = await loadTemplate(template.template, context);

    const promises = emails.map(email =>
      transporter.sendMail({
        from: `"Sun Bank" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: template.subject,
        html
      })
    );

    const results = await Promise.allSettled(promises);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Bulk email sent: ${successful} successful, ${failed} failed`);
    
    return { successful, failed, results };
  } catch (error) {
    console.error('Error sending bulk email:', error);
    throw error;
  }
};

module.exports = sendEmail;
module.exports.sendBulkEmail = sendBulkEmail;
