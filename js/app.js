// ========================================
// MAIN APPLICATION JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize animations
    initScrollAnimations();
    
    // Add active nav link highlighting
    highlightActiveNav();
});

// ========================================
// MOBILE MENU
// ========================================
function initMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navList = document.querySelector('.nav-list');
    
    if (mobileMenuBtn && navList) {
        mobileMenuBtn.addEventListener('click', function() {
            navList.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });
        
        // Close menu when clicking on a link
        const navLinks = navList.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navList.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!mobileMenuBtn.contains(e.target) && !navList.contains(e.target)) {
                navList.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });
    }
}

// ========================================
// SCROLL ANIMATIONS
// ========================================
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .fact-card, .game-card');
    animateElements.forEach(el => observer.observe(el));
}

// ========================================
// ACTIVE NAV HIGHLIGHTING
// ========================================
function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// ========================================
// SOUND MANAGER
// ========================================
class SoundManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
    }
    
    load(name, src) {
        const audio = new Audio(src);
        audio.volume = this.volume;
        this.sounds[name] = audio;
    }
    
    play(name) {
        if (!this.enabled || !this.sounds[name]) return;
        
        const sound = this.sounds[name];
        sound.currentTime = 0;
        sound.play().catch(e => console.log('Sound play failed:', e));
    }
    
    setVolume(volume) {
        this.volume = volume;
        Object.values(this.sounds).forEach(sound => {
            sound.volume = volume;
        });
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Global sound manager
const soundManager = new SoundManager();

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Shuffle array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Create element with classes
function createElement(tag, classes = [], content = '') {
    const element = document.createElement(tag);
    if (classes.length) {
        element.classList.add(...classes);
    }
    if (content) {
        element.innerHTML = content;
    }
    return element;
}

// Show feedback message
function showFeedback(container, message, isSuccess) {
    // Remove existing feedback
    const existing = container.querySelector('.feedback-message');
    if (existing) existing.remove();
    
    const feedback = createElement('div', ['feedback-message', isSuccess ? 'success' : 'error'], message);
    container.appendChild(feedback);
    
    // Remove after delay
    setTimeout(() => {
        feedback.remove();
    }, 2000);
}

// Animate element
function animateElement(element, animationClass) {
    element.classList.add(animationClass);
    element.addEventListener('animationend', () => {
        element.classList.remove(animationClass);
    }, { once: true });
}

// Wait for specified time
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Format score
function formatScore(score) {
    return score.toString().padStart(2, '0');
}

// Create confetti effect
function createConfetti(container) {
    const confettiColors = ['#FFD54F', '#4CAF50', '#42A5F5', '#FF8A65', '#AB47BC'];
    const confettiCount = 50;
    
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: absolute;
            width: 10px;
            height: 10px;
            background: ${confettiColors[Math.floor(Math.random() * confettiColors.length)]};
            left: ${Math.random() * 100}%;
            top: -10px;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            animation: confettiFall ${2 + Math.random() * 2}s linear forwards;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        container.appendChild(confetti);
    }
    
    // Clean up after animation
    setTimeout(() => {
        const confettiElements = container.querySelectorAll('[style*="confettiFall"]');
        confettiElements.forEach(el => el.remove());
    }, 4000);
}

// Add confetti animation to stylesheet if not exists
if (!document.getElementById('confetti-styles')) {
    const style = document.createElement('style');
    style.id = 'confetti-styles';
    style.textContent = `
        @keyframes confettiFall {
            0% {
                transform: translateY(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translateY(100vh) rotate(720deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// TEXT-TO-SPEECH (for instruction reading)
// Очень милый детский голос 🧸
// ========================================
function speakText(text, lang = 'ru-RU') {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        
        // Настройки для очень детского голоса
        utterance.rate = 0.9;     // Немного быстрее - как ребёнок говорит
        utterance.pitch = 2.0;    // Максимально высокий тон - очень детский!
        utterance.volume = 1.0;   // Полная громкость
        
        // Попробуем найти женский/детский голос
        const voices = speechSynthesis.getVoices();
        const childVoice = voices.find(voice => 
            voice.lang.includes('ru') && 
            (voice.name.toLowerCase().includes('child') ||
             voice.name.toLowerCase().includes('kid') ||
             voice.name.toLowerCase().includes('female') || 
             voice.name.toLowerCase().includes('milena') ||
             voice.name.toLowerCase().includes('irina') ||
             voice.name.toLowerCase().includes('anna') ||
             voice.name.toLowerCase().includes('женский') ||
             voice.name.toLowerCase().includes('детский'))
        ) || voices.find(voice => voice.lang.includes('ru'));
        
        if (childVoice) {
            utterance.voice = childVoice;
        }
        
        speechSynthesis.speak(utterance);
    }
}

// Загружаем голоса заранее (они загружаются асинхронно)
if ('speechSynthesis' in window) {
    speechSynthesis.onvoiceschanged = () => {
        speechSynthesis.getVoices();
    };
}

// ========================================
// DRAG AND DROP HELPERS
// ========================================
function initDragAndDrop(draggableSelector, dropZoneSelector, onDrop) {
    const draggables = document.querySelectorAll(draggableSelector);
    const dropZones = document.querySelectorAll(dropZoneSelector);
    
    draggables.forEach(draggable => {
        draggable.setAttribute('draggable', 'true');
        
        draggable.addEventListener('dragstart', (e) => {
            draggable.classList.add('dragging');
            e.dataTransfer.setData('text/plain', draggable.dataset.id || draggable.id);
        });
        
        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
        });
    });
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('highlight');
        });
        
        zone.addEventListener('dragleave', () => {
            zone.classList.remove('highlight');
        });
        
        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('highlight');
            const draggedId = e.dataTransfer.getData('text/plain');
            const dragged = document.querySelector(`[data-id="${draggedId}"], #${draggedId}`);
            
            if (dragged && onDrop) {
                onDrop(dragged, zone);
            }
        });
    });
}

// Touch support for drag and drop
function initTouchDragAndDrop(draggableSelector, dropZoneSelector, onDrop) {
    const draggables = document.querySelectorAll(draggableSelector);
    let currentDragging = null;
    let touchOffset = { x: 0, y: 0 };
    
    draggables.forEach(draggable => {
        draggable.addEventListener('touchstart', (e) => {
            currentDragging = draggable;
            const touch = e.touches[0];
            const rect = draggable.getBoundingClientRect();
            touchOffset.x = touch.clientX - rect.left;
            touchOffset.y = touch.clientY - rect.top;
            draggable.classList.add('dragging');
        }, { passive: true });
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!currentDragging) return;
        
        const touch = e.touches[0];
        currentDragging.style.position = 'fixed';
        currentDragging.style.left = (touch.clientX - touchOffset.x) + 'px';
        currentDragging.style.top = (touch.clientY - touchOffset.y) + 'px';
        currentDragging.style.zIndex = '1000';
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
        if (!currentDragging) return;
        
        const touch = e.changedTouches[0];
        const dropZones = document.querySelectorAll(dropZoneSelector);
        
        dropZones.forEach(zone => {
            const rect = zone.getBoundingClientRect();
            if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                if (onDrop) {
                    onDrop(currentDragging, zone);
                }
            }
        });
        
        // Reset position
        currentDragging.style.position = '';
        currentDragging.style.left = '';
        currentDragging.style.top = '';
        currentDragging.style.zIndex = '';
        currentDragging.classList.remove('dragging');
        currentDragging = null;
    });
}

// ========================================
// LOCAL STORAGE HELPERS
// ========================================
const storage = {
    save(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Storage save error:', e);
        }
    },
    
    load(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage load error:', e);
            return defaultValue;
        }
    },
    
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Storage remove error:', e);
        }
    }
};

// ========================================
// GAME PROGRESS TRACKING
// ========================================
const gameProgress = {
    getProgress(gameName) {
        return storage.load(`game_${gameName}`, { completedLevels: [], highScores: {} });
    },
    
    saveProgress(gameName, level, score) {
        const progress = this.getProgress(gameName);
        
        if (!progress.completedLevels.includes(level)) {
            progress.completedLevels.push(level);
        }
        
        if (!progress.highScores[level] || score > progress.highScores[level]) {
            progress.highScores[level] = score;
        }
        
        storage.save(`game_${gameName}`, progress);
    },
    
    isLevelCompleted(gameName, level) {
        const progress = this.getProgress(gameName);
        return progress.completedLevels.includes(level);
    },
    
    getHighScore(gameName, level) {
        const progress = this.getProgress(gameName);
        return progress.highScores[level] || 0;
    }
};

