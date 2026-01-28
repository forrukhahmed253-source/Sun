const twilio = require('twilio');
const axios = require('axios');

// Twilio client (for international SMS)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

// Bangladeshi SMS Gateway (Example using SSL Wireless)
const sendViaSSLWireless = async (phone, message) => {
  try {
    const response = await axios.post('https://smsplus.sslwireless.com/api/v3/send-sms', {
      api_token: process.env.SSL_API_TOKEN,
      sid: process.env.SSL_SID,
      msisdn: phone,
      sms: message,
      csms_id: `SB${Date.now()}`
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    return response.data;
  } catch (error) {
    console.error('SSL Wireless SMS error:', error.response?.data || error.message);
    throw error;
  }
};

// Bangladeshi SMS Gateway (Example using Banglalink)
const sendViaBanglalink = async (phone, message) => {
  try {
    const response = await axios.post('https://vas.banglalink.net/api/v1/send-sms', {
      userID: process.env.BANGLALINK_USER_ID,
      passwd: process.env.BANGLALINK_PASSWORD,
      sender: 'SunBank',
      msisdn: phone,
      message: message,
      reference: `SB${Date.now()}`
    });

    return response.data;
  } catch (error) {
    console.error('Banglalink SMS error:', error.response?.data || error.message);
    throw error;
  }
};

// Main SMS sending function
const sendSMS = async (phone, message, provider = 'ssl') => {
  try {
    // Clean phone number
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Add Bangladesh country code if missing
    if (!cleanPhone.startsWith('880')) {
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '880' + cleanPhone.substring(1);
      } else if (cleanPhone.startsWith('1')) {
        cleanPhone = '880' + cleanPhone;
      }
    }

    // Truncate message if too long
    const maxLength = 160;
    const truncatedMessage = message.length > maxLength 
      ? message.substring(0, maxLength - 3) + '...' 
      : message;

    let result;
    
    if (cleanPhone.startsWith('880')) {
      // Bangladeshi number
      switch (provider.toLowerCase()) {
        case 'ssl':
          result = await sendViaSSLWireless(cleanPhone, truncatedMessage);
          break;
        case 'banglalink':
          result = await sendViaBanglalink(cleanPhone, truncatedMessage);
          break;
        default:
          throw new Error(`Unsupported SMS provider: ${provider}`);
      }
    } else {
      // International number (use Twilio)
      if (!twilioClient) {
        throw new Error('Twilio not configured for international SMS');
      }
      
      result = await twilioClient.messages.create({
        body: truncatedMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: `+${cleanPhone}`
      });
    }

    console.log(`SMS sent to ${phone}: ${truncatedMessage.substring(0, 50)}...`);
    return result;
  } catch (error) {
    console.error('Failed to send SMS:', error);
    
    // Fallback: Log to database for manual sending
    try {
      const SMSLog = require('../models/SMSLog');
      await SMSLog.create({
        phone,
        message,
        status: 'failed',
        error: error.message,
        provider
      });
    } catch (logError) {
      console.error('Failed to log SMS error:', logError);
    }
    
    throw error;
  }
};

// Send bulk SMS
const sendBulkSMS = async (phones, message, provider = 'ssl') => {
  try {
    const results = await Promise.allSettled(
      phones.map(phone => sendSMS(phone, message, provider))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Bulk SMS sent: ${successful} successful, ${failed} failed`);
    
    return {
      successful,
      failed,
      results: results.map((r, i) => ({
        phone: phones[i],
        status: r.status,
        value: r.value,
        reason: r.reason
      }))
    };
  } catch (error) {
    console.error('Error sending bulk SMS:', error);
    throw error;
  }
};

// OTP sending function
const sendOTP = async (phone, otp) => {
  const message = `Your Sun Bank verification code is: ${otp}. Valid for 10 minutes.`;
  return sendSMS(phone, message);
};

// Transaction notification
const sendTransactionNotification = async (phone, type, amount, balance) => {
  const messages = {
    deposit: `Deposit successful! ${amount}৳ added to your account. New balance: ${balance}৳`,
    withdrawal: `Withdrawal successful! ${amount}৳ sent from your account. New balance: ${balance}৳`,
    profit: `Profit added! ${amount}৳ profit added to your account. New balance: ${balance}৳`,
    investment: `Investment successful! ${amount}৳ invested in package.`
  };

  const message = messages[type] || `Transaction: ${amount}৳. New balance: ${balance}৳`;
  return sendSMS(phone, message);
};

module.exports = sendSMS;
module.exports.sendBulkSMS = sendBulkSMS;
module.exports.sendOTP = sendOTP;
module.exports.sendTransactionNotification = sendTransactionNotification;
