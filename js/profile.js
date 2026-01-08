// ========================================
// PROFILE PAGE HANDLER
// ========================================

// Store unsubscribe function for cleanup
let progressUnsubscribe = null;

// Game names mapping
const gameNames = {
    findMe: { name: 'Найди меня', icon: '🔍', totalLevels: 2 },
    whoEats: { name: 'Кто что ест?', icon: '🍎', totalLevels: 2 },
    puzzle: { name: 'Пазл', icon: '🧩', totalLevels: 6 },
    whoLives: { name: 'Кто где живёт?', icon: '🏠', totalLevels: 2 },
    truthMyth: { name: 'Правда или миф', icon: '❓', totalLevels: 2 }
};

// Achievements definition
const achievements = [
    {
        id: 'first_game',
        name: 'Первая игра',
        description: 'Сыграй в первую игру',
        icon: '🎮',
        condition: (stats) => stats.gamesPlayed >= 1
    },
    {
        id: 'five_levels',
        name: 'Пять уровней',
        description: 'Пройди 5 уровней',
        icon: '⭐',
        condition: (stats) => stats.levelsCompleted >= 5
    },
    {
        id: 'ten_levels',
        name: 'Десять уровней',
        description: 'Пройди 10 уровней',
        icon: '🌟',
        condition: (stats) => stats.levelsCompleted >= 10
    },
    {
        id: 'hundred_points',
        name: 'Сто баллов',
        description: 'Набери 100 баллов',
        icon: '💯',
        condition: (stats) => stats.totalScore >= 100
    },
    {
        id: 'five_hundred_points',
        name: '500 баллов',
        description: 'Набери 500 баллов',
        icon: '🏆',
        condition: (stats) => stats.totalScore >= 500
    },
    {
        id: 'find_me_master',
        name: 'Мастер поиска',
        description: 'Пройди все уровни "Найди меня"',
        icon: '🔍',
        condition: (stats) => {
            const game = stats.games?.findMe;
            return game && game.completedLevels && game.completedLevels.length >= 2;
        }
    },
    {
        id: 'puzzle_master',
        name: 'Мастер пазлов',
        description: 'Пройди все уровни "Пазл"',
        icon: '🧩',
        condition: (stats) => {
            const game = stats.games?.puzzle;
            return game && game.completedLevels && game.completedLevels.length >= 6;
        }
    },
    {
        id: 'truth_seeker',
        name: 'Искатель правды',
        description: 'Пройди все уровни "Правда или миф"',
        icon: '🔮',
        condition: (stats) => {
            const game = stats.games?.truthMyth;
            return game && game.completedLevels && game.completedLevels.length >= 2;
        }
    },
    {
        id: 'animal_expert',
        name: 'Знаток животных',
        description: 'Пройди все уровни "Кто что ест?" и "Кто где живёт?"',
        icon: '🦊',
        condition: (stats) => {
            const whoEats = stats.games?.whoEats;
            const whoLives = stats.games?.whoLives;
            return whoEats && whoEats.completedLevels && whoEats.completedLevels.length >= 2 &&
                   whoLives && whoLives.completedLevels && whoLives.completedLevels.length >= 2;
        }
    },
    {
        id: 'completionist',
        name: 'Всё пройдено!',
        description: 'Пройди все игры',
        icon: '👑',
        condition: (stats) => stats.levelsCompleted >= 14
    },
    {
        id: 'speed_demon',
        name: 'Скоростной демон',
        description: 'Набери 50 баллов в одной игре',
        icon: '⚡',
        condition: (stats) => {
            const games = stats.games || {};
            return Object.values(games).some(game => {
                if (!game.highScores) return false;
                return Object.values(game.highScores).some(score => score >= 50);
            });
        }
    },
    {
        id: 'persistent_player',
        name: 'Настойчивый игрок',
        description: 'Сыграй 10 раз',
        icon: '🎯',
        condition: (stats) => stats.gamesPlayed >= 10
    }
];

// Store unlocked achievements to avoid showing notifications twice
let unlockedAchievements = new Set();

// Check if new achievements were unlocked
function checkForNewAchievements(stats, userId) {
    const currentUnlocked = new Set();
    let newAchievements = [];
    
    achievements.forEach(achievement => {
        if (achievement.condition(stats)) {
            currentUnlocked.add(achievement.id);
            if (!unlockedAchievements.has(achievement.id)) {
                newAchievements.push(achievement);
            }
        }
    });
    
    // Update unlocked achievements set
    unlockedAchievements = currentUnlocked;
    
    // Save unlocked achievements to database
    if (userId && newAchievements.length > 0) {
        saveUnlockedAchievements(Array.from(currentUnlocked), userId);
        // Show notification for new achievements
        showAchievementNotifications(newAchievements);
    }
    
    return newAchievements;
}

// Save unlocked achievements to database
async function saveUnlockedAchievements(achievementIds, userId) {
    if (!window.firebaseMethods || !userId) {
        // Save to localStorage as backup
        localStorage.setItem(`achievements_${userId}`, JSON.stringify(achievementIds));
        return;
    }
    
    try {
        const { ref, set } = window.firebaseMethods;
        await set(ref(firebaseDatabase, `users/${userId}/unlockedAchievements`), achievementIds);
        console.log('✅ Достижения сохранены в Firebase');
    } catch (error) {
        console.error('❌ Ошибка сохранения достижений:', error);
        // Fallback to localStorage
        localStorage.setItem(`achievements_${userId}`, JSON.stringify(achievementIds));
    }
}

// Load unlocked achievements from database
async function loadUnlockedAchievements(userId) {
    if (window.firebaseMethods && userId) {
        try {
            const { ref, get } = window.firebaseMethods;
            const snapshot = await get(ref(firebaseDatabase, `users/${userId}/unlockedAchievements`));
            if (snapshot.exists()) {
                return snapshot.val() || [];
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки достижений:', error);
        }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem(`achievements_${userId}`);
    return stored ? JSON.parse(stored) : [];
}

// Show achievement notification
function showAchievementNotification(achievement) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-notification-content">
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-text">
                <div class="achievement-title">🏆 Достижение получено!</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
            </div>
            <button class="achievement-close">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideAchievementNotification(notification);
    }, 5000);
    
    // Add close button functionality
    notification.querySelector('.achievement-close').addEventListener('click', () => {
        hideAchievementNotification(notification);
    });
    
    // Play achievement sound
    playAchievementSound();
}

// Hide achievement notification
function hideAchievementNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Show multiple achievement notifications
function showAchievementNotifications(achievements) {
    achievements.forEach((achievement, index) => {
        setTimeout(() => {
            showAchievementNotification(achievement);
        }, index * 800); // Stagger notifications by 800ms
    });
}

// Play achievement sound
function playAchievementSound() {
    const audio = new Audio();
    // Create a simple success sound using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Не удалось воспроизвести звук достижения:', error);
    }
}

// ========================================
// PROFILE PAGE INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth state to be determined
    checkAuthAndLoadProfile();
});

async function checkAuthAndLoadProfile() {
    // Wait a bit for Firebase to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = getCurrentUser();
    const notLoggedIn = document.getElementById('not-logged-in');
    const profileContent = document.getElementById('profile-content');
    
    if (user) {
        // User is logged in
        if (notLoggedIn) notLoggedIn.style.display = 'none';
        if (profileContent) profileContent.style.display = 'block';
        
        loadProfileData(user);
    } else {
        // User is not logged in
        if (notLoggedIn) notLoggedIn.style.display = 'flex';
        if (profileContent) profileContent.style.display = 'none';
    }
}

// Listen for auth state changes
window.addEventListener('authStateChanged', (e) => {
    const { isLoggedIn, user } = e.detail;
    const notLoggedIn = document.getElementById('not-logged-in');
    const profileContent = document.getElementById('profile-content');
    
    // Clean up previous listener
    cleanupProgressListener();
    
    if (isLoggedIn && user) {
        if (notLoggedIn) notLoggedIn.style.display = 'none';
        if (profileContent) profileContent.style.display = 'block';
        loadProfileData(user);
    } else {
        if (notLoggedIn) notLoggedIn.style.display = 'flex';
        if (profileContent) profileContent.style.display = 'none';
    }
});

// ========================================
// LOAD PROFILE DATA
// ========================================

async function loadProfileData(user) {
    // Load user profile
    const profile = await getUserProfile(user.uid);
    
    // Update profile header
    updateProfileHeader(user, profile);
    
    // Load unlocked achievements first
    const userAchievements = await loadUnlockedAchievements(user.uid);
    unlockedAchievements = new Set(userAchievements);
    
    // Load and display stats
    const stats = await getAllProgressStats();
    updateStats(stats);
    
    // Update games progress
    updateGamesProgress(stats);
    
    // Update achievements
    updateAchievements(stats);
    
    // Check for new achievements and show notifications
    checkForNewAchievements(stats, user.uid);
    
    // Set up real-time listener for progress updates
    if (typeof listenToProgressUpdates === 'function') {
        progressUnsubscribe = listenToProgressUpdates(user.uid, (updatedStats) => {
            console.log('📊 Обновление статистики профиля в реальном времени');
            updateStats(updatedStats);
            updateGamesProgress(updatedStats);
            updateAchievements(updatedStats);
            // Check for new achievements on every update
            checkForNewAchievements(updatedStats, user.uid);
        });
    }
}

function updateProfileHeader(user, profile) {
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileDate = document.getElementById('profile-date');
    const profileAvatar = document.getElementById('profile-avatar');
    
    if (profileName) {
        profileName.textContent = user.displayName || profile?.profile?.displayName || 'Пользователь';
    }
    
    if (profileEmail) {
        profileEmail.textContent = user.email;
    }
    
    if (profileDate && profile?.profile?.createdAt) {
        const date = new Date(profile.profile.createdAt);
        profileDate.textContent = date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }
    
    if (profileAvatar && profile?.profile?.avatar) {
        profileAvatar.textContent = profile.profile.avatar;
    }
    
    // Update header avatar too
    const headerAvatars = document.querySelectorAll('.user-avatar');
    if (profile?.profile?.avatar) {
        headerAvatars.forEach(el => el.textContent = profile.profile.avatar);
    }
}

function updateStats(stats) {
    const totalScore = document.getElementById('total-score');
    const levelsCompleted = document.getElementById('levels-completed');
    const gamesPlayed = document.getElementById('games-played');
    const achievementsCount = document.getElementById('achievements-count');
    
    if (totalScore) {
        animateNumber(totalScore, stats.totalScore || 0);
    }
    
    if (levelsCompleted) {
        animateNumber(levelsCompleted, stats.levelsCompleted || 0);
    }
    
    if (gamesPlayed) {
        animateNumber(gamesPlayed, stats.gamesPlayed || 0);
    }
    
    // Count unlocked achievements
    const unlockedAchievements = achievements.filter(a => a.condition(stats)).length;
    if (achievementsCount) {
        animateNumber(achievementsCount, unlockedAchievements);
    }
}

function animateNumber(element, target) {
    // Clear any existing animation timer on this element
    if (element.animationTimer) {
        clearInterval(element.animationTimer);
    }
    
    const duration = 1000;
    const start = parseInt(element.textContent) || 0;
    
    // If already at target, no need to animate
    if (start === target) {
        return;
    }
    
    const increment = (target - start) / (duration / 16);
    let current = start;
    
    element.animationTimer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            element.textContent = target;
            clearInterval(element.animationTimer);
            element.animationTimer = null;
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

function updateGamesProgress(stats) {
    const container = document.getElementById('games-progress');
    if (!container) return;
    
    container.innerHTML = '';
    
    Object.entries(gameNames).forEach(([gameId, gameInfo]) => {
        const gameStats = stats.games?.[gameId] || { completedLevels: [], highScores: {} };
        const completedCount = gameStats.completedLevels?.length || 0;
        const totalLevels = gameInfo.totalLevels;
        const progressPercent = (completedCount / totalLevels) * 100;
        
        // Calculate total score for this game
        let gameScore = 0;
        if (gameStats.highScores) {
            Object.values(gameStats.highScores).forEach(score => {
                gameScore += score;
            });
        }
        
        const card = document.createElement('div');
        card.className = 'game-progress-card';
        card.innerHTML = `
            <div class="game-progress-header">
                <span class="game-progress-icon">${gameInfo.icon}</span>
                <span class="game-progress-name">${gameInfo.name}</span>
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${progressPercent}%"></div>
            </div>
            <div class="progress-stats">
                <span class="progress-levels">${completedCount}/${totalLevels} уровней</span>
                <span class="progress-score">${gameScore} баллов</span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function updateAchievements(stats) {
    const container = document.getElementById('achievements-grid');
    if (!container) return;
    
    container.innerHTML = '';
    
    achievements.forEach(achievement => {
        const isUnlocked = achievement.condition(stats);
        
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? '' : 'locked'}`;
        card.innerHTML = `
            <span class="achievement-icon">${achievement.icon}</span>
            <div class="achievement-name">${achievement.name}</div>
            <div class="achievement-desc">${achievement.description}</div>
        `;
        
        container.appendChild(card);
    });
}

// ========================================
// CLEANUP FUNCTIONS
// ========================================

function cleanupProgressListener() {
    if (progressUnsubscribe && typeof stopListeningToProgress === 'function') {
        stopListeningToProgress(progressUnsubscribe);
        progressUnsubscribe = null;
    }
}

// Clean up listener when leaving the page
window.addEventListener('beforeunload', () => {
    cleanupProgressListener();
});

// Clean up listener when navigating away (for SPA-like navigation)
window.addEventListener('hashchange', () => {
    if (window.location.hash && !window.location.hash.includes('profile')) {
        cleanupProgressListener();
    }
});

// ========================================
// EXPORT FUNCTIONS FOR GLOBAL USE
// ========================================

window.loadProfileData = loadProfileData;
window.updateStats = updateStats;
window.cleanupProgressListener = cleanupProgressListener;
window.checkForNewAchievements = checkForNewAchievements;






