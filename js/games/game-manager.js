// ========================================
// GAME MANAGER
// ========================================

class GameManager {
    constructor() {
        this.currentGame = null;
        this.currentLevel = 1;
        this.score = 0;
        this.games = {};
        
        this.elements = {
            gamesMenu: document.getElementById('games-menu'),
            gameContainer: document.getElementById('game-container'),
            gameArea: document.getElementById('game-area'),
            gameTitle: document.getElementById('game-title'),
            gameScore: document.getElementById('game-score'),
            instructionText: document.getElementById('instruction-text'),
            resultOverlay: document.getElementById('result-overlay'),
            resultTitle: document.getElementById('result-title'),
            resultScore: document.getElementById('result-score'),
            resultAnimation: document.getElementById('result-animation')
        };
        
        this.init();
    }
    
    init() {
        // Initialize game card clicks
        const gameCards = document.querySelectorAll('.game-card');
        gameCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const gameName = card.dataset.game;
                const levelBtn = e.target.closest('.level');
                const level = levelBtn ? parseInt(levelBtn.dataset.level) : 1;
                this.startGame(gameName, level);
            });
        });
        
        // Back to menu button
        const backBtn = document.getElementById('back-to-menu');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.showMenu());
        }
        
        // Game control buttons
        document.getElementById('btn-menu')?.addEventListener('click', () => this.showMenu());
        document.getElementById('btn-restart')?.addEventListener('click', () => this.restartGame());
        document.getElementById('btn-next')?.addEventListener('click', () => this.nextLevel());
        
        // Result overlay buttons
        document.getElementById('result-menu')?.addEventListener('click', () => {
            this.hideResult();
            this.showMenu();
        });
        document.getElementById('result-restart')?.addEventListener('click', () => {
            this.hideResult();
            this.restartGame();
        });
        document.getElementById('result-next')?.addEventListener('click', () => {
            this.hideResult();
            this.nextLevel();
        });
        
        // Sound button
        document.getElementById('instruction-sound')?.addEventListener('click', () => {
            const text = this.elements.instructionText?.textContent;
            if (text) speakText(text);
        });
    }
    
    registerGame(name, gameInstance) {
        this.games[name] = gameInstance;
    }
    
    startGame(gameName, level = 1) {
        this.currentGame = gameName;
        this.currentLevel = level;
        this.score = 0;
        this.updateScore(0);
        
        // Hide menu, show game container
        this.elements.gamesMenu.style.display = 'none';
        this.elements.gameContainer.style.display = 'block';
        
        // Set game title
        const titles = {
            'find-me': 'Найди меня',
            'who-eats': 'Кто что ест?',
            'puzzle': 'Пазл',
            'who-lives': 'Кто где живёт?',
            'truth-myth': 'Правда или миф'
        };
        this.elements.gameTitle.textContent = titles[gameName] || gameName;
        
        // Show/hide score based on game
        const gamesWithScore = ['find-me', 'truth-myth'];
        this.elements.gameScore.style.display = gamesWithScore.includes(gameName) ? 'block' : 'none';
        
        // Enable/disable next button
        document.getElementById('btn-next').disabled = true;
        
        // Start the specific game
        if (this.games[gameName]) {
            this.games[gameName].start(level);
        }
    }
    
    showMenu() {
        this.elements.gameContainer.style.display = 'none';
        this.elements.gamesMenu.style.display = 'block';
        this.elements.gameArea.innerHTML = '';
        this.currentGame = null;
    }
    
    restartGame() {
        if (this.currentGame) {
            this.startGame(this.currentGame, this.currentLevel);
        }
    }
    
    nextLevel() {
        if (this.currentGame) {
            const nextLevel = this.currentLevel + 1;
            // Check if next level exists (varies by game)
            const maxLevels = {
                'find-me': 2,
                'who-eats': 2,
                'puzzle': 6,
                'who-lives': 2,
                'truth-myth': 2
            };
            const max = maxLevels[this.currentGame] || 2;
            
            if (nextLevel <= max) {
                this.startGame(this.currentGame, nextLevel);
            } else {
                this.showMenu();
            }
        }
    }
    
    updateScore(points) {
        this.score += points;
        const scoreSpan = this.elements.gameScore.querySelector('span');
        if (scoreSpan) {
            scoreSpan.textContent = this.score;
        }
    }
    
    setInstruction(text) {
        this.elements.instructionText.textContent = text;
    }
    
    showResult(isWin, score = null) {
        this.elements.resultOverlay.style.display = 'flex';
        
        if (isWin) {
            this.elements.resultTitle.textContent = 'Молодец!';
            this.elements.resultTitle.className = 'result-title success';
            this.elements.resultAnimation.textContent = '🎉';
            this.elements.resultScore.textContent = score !== null ? `Ты набрал ${score} баллов!` : 'Уровень пройден!';
            
            // Play win sound
            this.playSound('win');
            
            // Save progress to Firebase (and localStorage as backup)
            // Map game name to Firebase key
            const gameKey = this.getGameKey(this.currentGame);
            saveGameProgress(gameKey, this.currentLevel, score || 0, true);
            
            // Enable next button
            document.getElementById('btn-next').disabled = false;
            
            // Create confetti
            createConfetti(document.querySelector('.result-content'));
        } else {
            this.elements.resultTitle.textContent = 'Попробуй ещё раз!';
            this.elements.resultTitle.className = 'result-title fail';
            this.elements.resultAnimation.textContent = '😊';
            this.elements.resultScore.textContent = 'Ты справишься!';
        }
    }
    
    // Map game name to Firebase key
    getGameKey(gameName) {
        const mapping = {
            'find-me': 'findMe',
            'who-eats': 'whoEats',
            'puzzle': 'puzzle',
            'who-lives': 'whoLives',
            'truth-myth': 'truthMyth'
        };
        return mapping[gameName] || gameName;
    }
    
    hideResult() {
        this.elements.resultOverlay.style.display = 'none';
    }
    
    playSound(type) {
        const soundElement = document.getElementById(`sound-${type}`);
        if (soundElement) {
            soundElement.currentTime = 0;
            soundElement.play().catch(e => console.log('Sound error:', e));
        }
    }
    
    getGameArea() {
        return this.elements.gameArea;
    }
}

// Initialize game manager when DOM is ready
let gameManager;
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('games-menu')) {
        gameManager = new GameManager();
    }
});




