// ========================================
// AUTHENTICATION UI HANDLER
// ========================================

// ========================================
// MODAL FUNCTIONS
// ========================================

// Open auth modal
function openAuthModal(type = 'login') {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'flex';
        switchAuthForm(type);
        document.body.style.overflow = 'hidden';
    }
}

// Close auth modal
function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        // Clear form errors
        clearFormErrors();
    }
}

// Switch between login and register forms
function switchAuthForm(type) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (type === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
    
    clearFormErrors();
}

// Clear form errors
function clearFormErrors() {
    const errors = document.querySelectorAll('.form-error');
    errors.forEach(error => {
        error.style.display = 'none';
        error.textContent = '';
    });
}

// Show form error
function showFormError(formId, message) {
    const errorDiv = document.getElementById(formId);
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.classList.add('show');
    }
}

// ========================================
// AUTH HANDLERS
// ========================================

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Clear previous errors
    clearFormErrors();
    
    // Validation
    if (!email || !password) {
        showFormError('login-error', 'Заполните все поля');
        return;
    }
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Загрузка...</span>';
    
    try {
        const result = await loginUser(email, password);
        
        if (result.success) {
            closeAuthModal();
            showNotification('Добро пожаловать! 🎉', 'success');
            // Reload page to update UI
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            showFormError('login-error', result.error);
        }
    } catch (error) {
        showFormError('login-error', 'Произошла ошибка. Попробуйте ещё раз.');
    }
    
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Войти</span><span class="btn-icon">🚀</span>';
}

// Handle register form submission
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const passwordConfirm = document.getElementById('register-password-confirm').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Clear previous errors
    clearFormErrors();
    
    // Validation
    if (!name || !email || !password || !passwordConfirm) {
        showFormError('register-error', 'Заполните все поля');
        return;
    }
    
    if (name.length < 2) {
        showFormError('register-error', 'Имя должно быть не менее 2 символов');
        return;
    }
    
    if (password.length < 6) {
        showFormError('register-error', 'Пароль должен быть не менее 6 символов');
        return;
    }
    
    if (password !== passwordConfirm) {
        showFormError('register-error', 'Пароли не совпадают');
        return;
    }
    
    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>Создание...</span>';
    
    try {
        const result = await registerUser(email, password, name);
        
        if (result.success) {
            closeAuthModal();
            showNotification('Аккаунт создан! Добро пожаловать! 🎉', 'success');
            // Reload page to update UI
            setTimeout(() => {
                window.location.reload();
            }, 500);
        } else {
            showFormError('register-error', result.error);
        }
    } catch (error) {
        showFormError('register-error', 'Произошла ошибка. Попробуйте ещё раз.');
    }
    
    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Создать аккаунт</span><span class="btn-icon">✨</span>';
}

// Handle logout
async function handleLogout() {
    try {
        // Clean up progress listener before logout
        if (typeof cleanupProgressListener === 'function') {
            cleanupProgressListener();
        }
        
        const result = await logoutUser();
        if (result.success) {
            showNotification('До свидания! 👋', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        }
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// ========================================
// NOTIFICATION
// ========================================

function showNotification(message, type = 'success') {
    // Remove existing notification
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✅' : '❌'}</span>
        <span class="notification-message">${message}</span>
    `;
    
    // Add styles if not exist
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                padding: 15px 25px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 10px;
                z-index: 3000;
                animation: notificationSlide 0.3s ease;
                font-weight: 600;
            }
            
            .notification.success {
                border-left: 4px solid #4CAF50;
            }
            
            .notification.error {
                border-left: 4px solid #e74c3c;
            }
            
            .notification-icon {
                font-size: 1.3rem;
            }
            
            @keyframes notificationSlide {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.animation = 'notificationSlide 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// AVATAR MODAL
// ========================================

const avatarOptions = [
    '🦊', '🐻', '🐰', '🦉', '🐿️', 
    '🦔', '🐸', '🦋', '🐝', '🦌',
    '🐺', '🦢', '🐟', '🐗', '🦫',
    '🐱', '🐶', '🐼', '🐨', '🦁'
];

function openAvatarModal() {
    const modal = document.getElementById('avatar-modal');
    const grid = document.getElementById('avatar-grid');
    
    if (modal && grid) {
        // Clear and populate grid
        grid.innerHTML = '';
        
        avatarOptions.forEach(avatar => {
            const option = document.createElement('button');
            option.className = 'avatar-option';
            option.textContent = avatar;
            option.onclick = () => selectAvatar(avatar);
            
            // Mark current avatar as selected
            const currentAvatar = document.getElementById('profile-avatar');
            if (currentAvatar && currentAvatar.textContent === avatar) {
                option.classList.add('selected');
            }
            
            grid.appendChild(option);
        });
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeAvatarModal() {
    const modal = document.getElementById('avatar-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

async function selectAvatar(avatar) {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update UI immediately
    const profileAvatar = document.getElementById('profile-avatar');
    const userAvatars = document.querySelectorAll('.user-avatar');
    
    if (profileAvatar) profileAvatar.textContent = avatar;
    userAvatars.forEach(el => el.textContent = avatar);
    
    // Save to Firebase
    try {
        await updateUserProfile(user.uid, { avatar: avatar });
        showNotification('Аватар обновлён! ' + avatar, 'success');
    } catch (error) {
        console.error('Error updating avatar:', error);
    }
    
    closeAvatarModal();
}

// ========================================
// KEYBOARD HANDLERS
// ========================================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAuthModal();
        closeAvatarModal();
    }
});

// ========================================
// INITIALIZE AUTH UI ON PAGE LOAD
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Listen for auth state changes
    window.addEventListener('authStateChanged', (e) => {
        const { isLoggedIn, user } = e.detail;
        
        // Update auth buttons visibility
        const authButtons = document.querySelectorAll('.auth-buttons');
        const userMenus = document.querySelectorAll('.user-menu');
        
        if (isLoggedIn && user) {
            authButtons.forEach(el => el.style.display = 'none');
            userMenus.forEach(el => el.style.display = 'flex');
        } else {
            authButtons.forEach(el => el.style.display = 'flex');
            userMenus.forEach(el => el.style.display = 'none');
        }
    });
});






