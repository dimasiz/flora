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
    window.unlockedAchievements = new Set(userAchievements);
    
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
    const unlockedCount = achievements.filter(a => a.condition(stats)).length;
    if (achievementsCount) {
        animateNumber(achievementsCount, unlockedCount);
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
