// ==============================================
// FORM-VALIDATION.JS - Form Validation Functions
// Website P4 Jakarta
// ==============================================

document.addEventListener('DOMContentLoaded', function() {
    initFormValidation();
    initPasswordToggle();
    initFileUploadValidation();
});

// ==============================================
// FORM VALIDATION
// ==============================================
function initFormValidation() {
    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            if (!validateLoginForm(this)) {
                e.preventDefault();
            }
        });
    }
    
    // Register Peserta Form
    const registerPesertaForm = document.getElementById('registerPesertaForm');
    if (registerPesertaForm) {
        registerPesertaForm.addEventListener('submit', function(e) {
            if (!validateRegisterPesertaForm(this)) {
                e.preventDefault();
            }
        });
    }
    
    // Register Guru Form
    const registerGuruForm = document.getElementById('registerGuruForm');
    if (registerGuruForm) {
        registerGuruForm.addEventListener('submit', function(e) {
            if (!validateRegisterGuruForm(this)) {
                e.preventDefault();
            }
        });
    }
    
    // Generic form validation
    document.querySelectorAll('form[data-validate]').forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateGenericForm(this)) {
                e.preventDefault();
            }
        });
    });
    
    // Real-time validation
    document.querySelectorAll('input[data-validate]').forEach(input => {
        input.addEventListener('blur', function() {
            validateInput(this);
        });
    });
}

// ==============================================
// LOGIN VALIDATION
// ==============================================
function validateLoginForm(form) {
    clearErrors(form);
    let isValid = true;
    
    const email = form.querySelector('#email');
    const password = form.querySelector('#password');
    
    if (!email.value.trim()) {
        showError(email, 'Email wajib diisi');
        isValid = false;
    } else if (!isValidEmail(email.value)) {
        showError(email, 'Format email tidak valid');
        isValid = false;
    }
    
    if (!password.value) {
        showError(password, 'Password wajib diisi');
        isValid = false;
    } else if (password.value.length < 6) {
        showError(password, 'Password minimal 6 karakter');
        isValid = false;
    }
    
    return isValid;
}

// ==============================================
// REGISTER PESERTA VALIDATION
// ==============================================
function validateRegisterPesertaForm(form) {
    clearErrors(form);
    let isValid = true;
    
    // Required fields
    const requiredFields = [
        { id: 'nama', message: 'Nama lengkap wajib diisi' },
        { id: 'nik', message: 'NIK wajib diisi' },
        { id: 'email', message: 'Email wajib diisi' },
        { id: 'password', message: 'Password wajib diisi' },
        { id: 'no_hp', message: 'No HP wajib diisi' },
        { id: 'sekolah_asal', message: 'Sekolah asal wajib diisi' }
    ];
    
    requiredFields.forEach(field => {
        const input = form.querySelector(`#${field.id}`);
        if (input && !input.value.trim()) {
            showError(input, field.message);
            isValid = false;
        }
    });
    
    // Email validation
    const email = form.querySelector('#email');
    if (email && email.value && !isValidEmail(email.value)) {
        showError(email, 'Format email tidak valid');
        isValid = false;
    }
    
    // NIK validation (16 digits)
    const nik = form.querySelector('#nik');
    if (nik && nik.value && !isValidNIK(nik.value)) {
        showError(nik, 'NIK harus 16 digit angka');
        isValid = false;
    }
    
    // Phone validation
    const noHp = form.querySelector('#no_hp');
    if (noHp && noHp.value && !isValidPhone(noHp.value)) {
        showError(noHp, 'Format nomor HP tidak valid');
        isValid = false;
    }
    
    // Password validation
    const password = form.querySelector('#password');
    if (password && password.value && password.value.length < 6) {
        showError(password, 'Password minimal 6 karakter');
        isValid = false;
    }
    
    // Confirm password
    const confirmPassword = form.querySelector('#confirm_password');
    if (confirmPassword && password && confirmPassword.value !== password.value) {
        showError(confirmPassword, 'Konfirmasi password tidak cocok');
        isValid = false;
    }
    
    return isValid;
}

// ==============================================
// REGISTER GURU VALIDATION
// ==============================================
function validateRegisterGuruForm(form) {
    clearErrors(form);
    let isValid = true;
    
    // Required fields
    const requiredFields = [
        { id: 'nama', message: 'Nama lengkap wajib diisi' },
        { id: 'email', message: 'Email wajib diisi' },
        { id: 'password', message: 'Password wajib diisi' },
        { id: 'sekolah_asal', message: 'Sekolah asal wajib diisi' },
        { id: 'mata_pelajaran', message: 'Mata pelajaran wajib diisi' }
    ];
    
    requiredFields.forEach(field => {
        const input = form.querySelector(`#${field.id}`);
        if (input && !input.value.trim()) {
            showError(input, field.message);
            isValid = false;
        }
    });
    
    // Email validation
    const email = form.querySelector('#email');
    if (email && email.value && !isValidEmail(email.value)) {
        showError(email, 'Format email tidak valid');
        isValid = false;
    }
    
    // Password validation
    const password = form.querySelector('#password');
    if (password && password.value && password.value.length < 6) {
        showError(password, 'Password minimal 6 karakter');
        isValid = false;
    }
    
    // Confirm password
    const confirmPassword = form.querySelector('#confirm_password');
    if (confirmPassword && password && confirmPassword.value !== password.value) {
        showError(confirmPassword, 'Konfirmasi password tidak cocok');
        isValid = false;
    }
    
    return isValid;
}

// ==============================================
// GENERIC FORM VALIDATION
// ==============================================
function validateGenericForm(form) {
    clearErrors(form);
    let isValid = true;
    
    // Check all required inputs
    form.querySelectorAll('[required]').forEach(input => {
        if (!input.value.trim()) {
            const label = form.querySelector(`label[for="${input.id}"]`);
            const fieldName = label ? label.textContent : input.name;
            showError(input, `${fieldName} wajib diisi`);
            isValid = false;
        }
    });
    
    // Validate email fields
    form.querySelectorAll('input[type="email"]').forEach(input => {
        if (input.value && !isValidEmail(input.value)) {
            showError(input, 'Format email tidak valid');
            isValid = false;
        }
    });
    
    return isValid;
}

// ==============================================
// PASSWORD TOGGLE
// ==============================================
function initPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const passwordInput = document.getElementById(targetId);
            
            if (passwordInput) {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                
                // Toggle icon
                const icon = this.querySelector('i, svg');
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            }
        });
    });
}

// ==============================================
// FILE UPLOAD VALIDATION
// ==============================================
function initFileUploadValidation() {
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', function() {
            validateFileInput(this);
        });
    });
}

function validateFileInput(input) {
    const maxSize = parseInt(input.dataset.maxSize) || 5 * 1024 * 1024; // 5MB default
    const allowedTypes = (input.dataset.allowedTypes || 'image/*,application/pdf').split(',');
    
    const file = input.files[0];
    if (!file) return true;
    
    // Check file size
    if (file.size > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        showError(input, `Ukuran file maksimal ${maxSizeMB}MB`);
        input.value = '';
        return false;
    }
    
    // Check file type
    const fileType = file.type;
    const isAllowed = allowedTypes.some(type => {
        if (type.endsWith('/*')) {
            return fileType.startsWith(type.replace('/*', ''));
        }
        return fileType === type;
    });
    
    if (!isAllowed) {
        showError(input, 'Format file tidak diizinkan');
        input.value = '';
        return false;
    }
    
    clearError(input);
    return true;
}

// ==============================================
// INPUT VALIDATION
// ==============================================
function validateInput(input) {
    clearError(input);
    
    const validationType = input.dataset.validate;
    const value = input.value.trim();
    
    if (input.required && !value) {
        showError(input, 'Field ini wajib diisi');
        return false;
    }
    
    if (!value) return true;
    
    switch (validationType) {
        case 'email':
            if (!isValidEmail(value)) {
                showError(input, 'Format email tidak valid');
                return false;
            }
            break;
        case 'nik':
            if (!isValidNIK(value)) {
                showError(input, 'NIK harus 16 digit angka');
                return false;
            }
            break;
        case 'phone':
            if (!isValidPhone(value)) {
                showError(input, 'Format nomor HP tidak valid');
                return false;
            }
            break;
        case 'password':
            if (value.length < 6) {
                showError(input, 'Password minimal 6 karakter');
                return false;
            }
            break;
    }
    
    return true;
}

// ==============================================
// HELPER FUNCTIONS
// ==============================================
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function isValidNIK(nik) {
    return /^\d{16}$/.test(nik);
}

function isValidPhone(phone) {
    // Indonesian phone number format
    return /^(\+62|62|0)[0-9]{9,12}$/.test(phone.replace(/[-\s]/g, ''));
}

function showError(input, message) {
    input.classList.add('border-red-500', 'focus:ring-red-500');
    input.classList.remove('border-gray-300', 'focus:ring-blue-500');
    
    // Remove existing error
    const existingError = input.parentNode.querySelector('.error-message');
    if (existingError) existingError.remove();
    
    // Add error message
    const errorDiv = document.createElement('p');
    errorDiv.className = 'error-message text-red-500 text-sm mt-1';
    errorDiv.textContent = message;
    input.parentNode.appendChild(errorDiv);
}

function clearError(input) {
    input.classList.remove('border-red-500', 'focus:ring-red-500');
    input.classList.add('border-gray-300', 'focus:ring-blue-500');
    
    const errorMsg = input.parentNode.querySelector('.error-message');
    if (errorMsg) errorMsg.remove();
}

function clearErrors(form) {
    form.querySelectorAll('.error-message').forEach(el => el.remove());
    form.querySelectorAll('.border-red-500').forEach(el => {
        el.classList.remove('border-red-500', 'focus:ring-red-500');
        el.classList.add('border-gray-300', 'focus:ring-blue-500');
    });
}

console.log('Form-validation.js loaded');