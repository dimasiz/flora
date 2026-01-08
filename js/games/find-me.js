// ========================================
// FIND ME GAME (Найди меня)
// ========================================

class FindMeGame {
    constructor() {
        this.currentLevel = 1;
        this.currentRound = 0;
        this.score = 0;
        this.rounds = [];
        this.firstAttempt = true;
        
        // Register with game manager when it's ready
        this.registerWhenReady();
    }
    
    registerWhenReady() {
        if (typeof gameManager !== 'undefined') {
            gameManager.registerGame('find-me', this);
        } else {
            setTimeout(() => this.registerWhenReady(), 100);
        }
    }
    
    async start(level) {
        this.currentLevel = level;
        this.currentRound = 0;
        this.score = 0;
        this.firstAttempt = true;
        
        // Load game data
        const gameData = await db.getGameData('findMe');
        const levelData = gameData.levels.find(l => l.level === level);
        
        if (!levelData) {
            console.error('Level not found:', level);
            return;
        }
        
        this.rounds = levelData.rounds;
        
        // Set instruction
        gameManager.setInstruction('Посмотри внимательно! Найди нужное животное или растение среди других.');
        
        // Start first round
        this.showRound();
    }
    
    showRound() {
        if (this.currentRound >= this.rounds.length) {
            // All rounds completed
            gameManager.showResult(true, this.score);
            return;
        }
        
        const round = this.rounds[this.currentRound];
        const gameArea = gameManager.getGameArea();
        
        // Update instruction with target
        gameManager.setInstruction(`Найди ${round.targetName}! 🔍`);
        
        // Create grid with target and others
        const allItems = shuffleArray([round.target, ...round.others]);
        
        gameArea.innerHTML = `
            <div class="progress-indicator">
                ${this.rounds.map((_, i) => `
                    <div class="progress-dot ${i < this.currentRound ? 'completed' : ''} ${i === this.currentRound ? 'active' : ''}"></div>
                `).join('')}
            </div>
            <div class="find-me-grid">
                ${allItems.map((item, index) => `
                    <button class="find-me-item" data-item="${item}" data-index="${index}">
                        ${item}
                    </button>
                `).join('')}
            </div>
        `;
        
        // Add click handlers
        const items = gameArea.querySelectorAll('.find-me-item');
        items.forEach(item => {
            item.addEventListener('click', () => this.handleClick(item, round.target));
        });
        
        this.firstAttempt = true;
    }
    
    handleClick(element, target) {
        const selected = element.dataset.item;
        
        if (selected === target) {
            // Correct answer
            element.classList.add('correct');
            gameManager.playSound('correct');
            
            // Add points only on first attempt
            if (this.firstAttempt) {
                this.score += 2;
                gameManager.updateScore(2);
            }
            
            // Show feedback
            showFeedback(gameManager.getGameArea(), '✓ Правильно!', true);
            
            // Wait and move to next round
            setTimeout(() => {
                this.currentRound++;
                this.showRound();
            }, 1000);
        } else {
            // Wrong answer
            element.classList.add('wrong');
            gameManager.playSound('wrong');
            this.firstAttempt = false;
            
            // Show hint
            showFeedback(gameManager.getGameArea(), 'Ой, попробуй ещё раз!', false);
            
            // Remove wrong class after animation
            setTimeout(() => {
                element.classList.remove('wrong');
            }, 500);
        }
    }
}

// Initialize game
const findMeGame = new FindMeGame();









