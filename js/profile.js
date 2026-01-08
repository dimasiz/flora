// ========================================
// PROFILE PAGE HANDLER
// ========================================

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
    }
];

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
    
    // Load and display stats
    const stats = await getAllProgressStats();
    updateStats(stats);
    
    // Update games progress
    updateGamesProgress(stats);
    
    // Update achievements
    updateAchievements(stats);
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
    const duration = 1000;
    const start = parseInt(element.textContent) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
            element.textContent = target;
            clearInterval(timer);
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
// EXPORT FUNCTIONS FOR GLOBAL USE
// ========================================

window.loadProfileData = loadProfileData;
window.updateStats = updateStats;






