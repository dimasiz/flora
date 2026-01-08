// ========================================
// ACHIEVEMENTS SYSTEM
// ========================================

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
window.unlockedAchievements = new Set();

// Check if new achievements were unlocked
function checkForNewAchievements(stats, userId) {
    const currentUnlocked = new Set();
    let newAchievements = [];
    
    achievements.forEach(achievement => {
        if (achievement.condition(stats)) {
            currentUnlocked.add(achievement.id);
            if (!window.unlockedAchievements.has(achievement.id)) {
                newAchievements.push(achievement);
            }
        }
    });
    
    // Update unlocked achievements set
    window.unlockedAchievements = currentUnlocked;
    
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
        // firebaseDatabase should be available globally from firebase-config.js
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
            // firebaseDatabase should be available globally from firebase-config.js
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

// Add to window for access from other scripts
window.checkForNewAchievements = checkForNewAchievements;
window.loadUnlockedAchievements = loadUnlockedAchievements;
window.saveUnlockedAchievements = saveUnlockedAchievements;
window.achievements = achievements;
