// ========================================
// DEBUG FUNCTIONS FOR ACHIEVEMENTS
// ========================================

// Add debug functions to window for testing achievements
window.debugAchievements = {
    // Simulate playing a game to test achievements
    async simulateGameProgress(gameName, level, score = 10) {
        console.log(`🎮 Симуляция игры: ${gameName}, уровень ${level}, счет ${score}`);
        
        // Call saveGameProgress
        if (typeof saveGameProgress === 'function') {
            await saveGameProgress(gameName, level, score, true);
        }
        
        // Check achievements
        const user = getCurrentUser();
        if (user && typeof checkForNewAchievements === 'function') {
            const stats = await getAllProgressStats();
            checkForNewAchievements(stats, user.uid);
        }
    },
    
    // Add specific achievements for testing
    async unlockSpecificAchievements(achievementIds) {
        const user = getCurrentUser();
        if (!user) {
            console.log('❌ Нужно войти в аккаунт для тестирования достижений');
            return;
        }
        
        // Load current unlocked achievements
        const currentAchievements = await loadUnlockedAchievements(user.uid);
        const newAchievements = [...new Set([...currentAchievements, ...achievementIds])];
        
        // Save to database
        await saveUnlockedAchievements(newAchievements, user.uid);
        
        // Force update UI
        const stats = await getAllProgressStats();
        updateAchievements(stats);
        
        console.log('✅ Достижения добавлены:', achievementIds);
    },
    
    // Reset all achievements for testing
    async resetAchievements() {
        const user = getCurrentUser();
        if (!user) {
            console.log('❌ Нужно войти в аккаунт для сброса достижений');
            return;
        }
        
        await saveUnlockedAchievements([], user.uid);
        console.log('✅ Все достижения сброшены');
    },
    
    // Show current stats
    async showCurrentStats() {
        const user = getCurrentUser();
        if (!user) {
            console.log('❌ Нужно войти в аккаунт для просмотра статистики');
            return;
        }
        
        const stats = await getAllProgressStats();
        console.log('📊 Текущая статистика:', stats);
        
        // Check each achievement
        console.log('🏆 Проверка достижений:');
        achievements.forEach(achievement => {
            const isUnlocked = achievement.condition(stats);
            console.log(`${isUnlocked ? '✅' : '❌'} ${achievement.name}: ${isUnlocked ? 'разблокировано' : 'заблокировано'}`);
        });
    }
};

// Console instructions
console.log(`
🎮 Система достижений инициализирована!

📝 Доступные команды для тестирования:
- window.debugAchievements.showCurrentStats() - показать текущую статистику
- window.debugAchievements.simulateGameProgress('findMe', 1, 20) - симулировать игру
- window.debugAchievements.unlockSpecificAchievements(['first_game']) - разблокировать достижение
- window.debugAchievements.resetAchievements() - сбросить все достижения

🏆 Доступные ID достижений:
${achievements.map(a => `- ${a.id}: ${a.name}`).join('\n')}
`);