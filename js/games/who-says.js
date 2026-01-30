// ========================================
// WHO SAYS GAME (Кто так говорит?)
// ========================================

class WhoSaysGame {
    constructor() {
        this.currentLevel = 1;
        this.currentRound = 0;
        this.score = 0;
        this.attempts = 0;
        this.rounds = [];
        this.currentSound = null;
        
        this.registerWhenReady();
    }
    
    registerWhenReady() {
        if (typeof gameManager !== 'undefined') {
            gameManager.registerGame('who-says', this);
        } else {
            setTimeout(() => this.registerWhenReady(), 100);
        }
    }
    
    async start(level) {
        this.currentLevel = level;
        this.currentRound = 0;
        this.score = 0;
        this.attempts = 0;
        
        // Load game data
        const gameData = await db.getGameData('whoSays');
        const levelData = gameData.levels.find(l => l.level === level);
        
        if (!levelData) {
            console.error('Level not found:', level);
            return;
        }
        
        this.rounds = levelData.rounds;
        
        // Set instruction
        gameManager.setInstruction('Послушай звук и найди животное, которое его издаёт!');
        
        this.showRound();
    }
    
    showRound() {
        if (this.currentRound >= this.rounds.length) {
            // Game complete
            gameManager.showResult(true, this.score);
            return;
        }
        
        const round = this.rounds[this.currentRound];
        const gameArea = gameManager.getGameArea();
        this.attempts = 0;
        
        gameArea.innerHTML = `
            <div class="who-says-container">
                <div class="progress-indicator">
                    ${this.rounds.map((_, i) => `
                        <div class="progress-dot ${i < this.currentRound ? 'completed' : ''} ${i === this.currentRound ? 'active' : ''}"></div>
                    `).join('')}
                </div>
                
                <div class="sound-player">
                    <button class="play-sound-btn" id="play-sound">
                        <span class="sound-icon">🔊</span>
                        <span class="sound-text">Послушать звук</span>
                    </button>
                    <p class="sound-hint">Нажми, чтобы услышать, кто это говорит!</p>
                </div>
                
                <div class="animals-grid who-says-grid">
                    ${round.options.map((animal, index) => `
                        <button class="animal-option" data-animal="${animal.id}" data-index="${index}">
                            <img src="${animal.image}" alt="${animal.name}" class="animal-image">
                            <span class="animal-name">${animal.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
        
        // Add event listeners
        const playBtn = document.getElementById('play-sound');
        playBtn.addEventListener('click', () => this.playSound(round.soundUrl));
        
        const options = document.querySelectorAll('.animal-option');
        options.forEach(option => {
            option.addEventListener('click', () => this.checkAnswer(option, round.correctAnimal));
        });
        
        // Auto-play sound after a short delay
        setTimeout(() => this.playSound(round.soundUrl), 500);
    }
    
    playSound(soundUrl) {
        // Stop previous sound if playing
        if (this.currentSound) {
            this.currentSound.pause();
            this.currentSound.currentTime = 0;
        }
        
        if (!soundUrl) {
            console.log('Звук не указан');
            return;
        }
        
        // Create and play new sound
        this.currentSound = new Audio(soundUrl);
        this.currentSound.volume = 0.8;
        this.currentSound.play().catch(e => {
            console.log('Не удалось воспроизвести звук:', e);
        });
        
        // Animate the button
        const playBtn = document.getElementById('play-sound');
        if (playBtn) {
            playBtn.classList.add('playing');
            setTimeout(() => playBtn.classList.remove('playing'), 1000);
        }
    }
    
    checkAnswer(selectedOption, correctAnimal) {
        const selectedAnimal = selectedOption.dataset.animal;
        this.attempts++;
        
        if (selectedAnimal === correctAnimal) {
            // Correct answer
            selectedOption.classList.add('correct');
            gameManager.playSound('correct');
            
            // Award points (2 points for first try)
            if (this.attempts === 1) {
                this.score += 2;
                gameManager.updateScore(this.score);
            }
            
            // Show praise animation
            this.showPraise(selectedOption);
            
            // Move to next round after delay
            setTimeout(() => {
                this.currentRound++;
                this.showRound();
            }, 1500);
        } else {
            // Wrong answer
            selectedOption.classList.add('wrong');
            gameManager.playSound('wrong');
            
            // Remove wrong class after animation
            setTimeout(() => {
                selectedOption.classList.remove('wrong');
            }, 500);
            
            showFeedback(gameManager.getGameArea(), 'Попробуй ещё раз! 🎧', false);
        }
    }
    
    showPraise(element) {
        const praises = ['Молодец! 🌟', 'Отлично! ⭐', 'Супер! 🎉', 'Верно! 👏', 'Умница! 💫'];
        const praise = praises[Math.floor(Math.random() * praises.length)];
        
        const praiseEl = document.createElement('div');
        praiseEl.className = 'praise-popup';
        praiseEl.textContent = praise;
        praiseEl.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #4CAF50, #8BC34A);
            color: white;
            padding: 15px 30px;
            border-radius: 20px;
            font-size: 1.5rem;
            font-weight: bold;
            animation: praisePopup 1.5s ease-out forwards;
            z-index: 100;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        `;
        
        element.style.position = 'relative';
        element.appendChild(praiseEl);
        
        setTimeout(() => praiseEl.remove(), 1500);
    }
}

// Add praise animation style
if (!document.getElementById('who-says-styles')) {
    const style = document.createElement('style');
    style.id = 'who-says-styles';
    style.textContent = `
        @keyframes praisePopup {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
            20% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
            40% { transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -100%) scale(1); }
        }
        
        .who-says-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 25px;
            width: 100%;
            max-width: 700px;
        }
        
        .sound-player {
            background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%);
            padding: 30px 40px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        
        .play-sound-btn {
            background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
            border: none;
            color: white;
            padding: 20px 40px;
            border-radius: 50px;
            font-size: 1.3rem;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 15px;
            transition: all 0.3s ease;
            font-family: inherit;
            box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
        }
        
        .play-sound-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(33, 150, 243, 0.5);
        }
        
        .play-sound-btn.playing {
            animation: pulse 0.5s ease-in-out infinite;
        }
        
        .play-sound-btn .sound-icon {
            font-size: 2rem;
        }
        
        .sound-hint {
            margin-top: 15px;
            color: #1565C0;
            font-size: 1rem;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .who-says-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 20px;
            width: 100%;
        }
        
        .animal-option {
            background: white;
            border: 4px solid #E0E0E0;
            border-radius: 15px;
            padding: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
        }
        
        .animal-option:hover {
            transform: scale(1.05);
            border-color: #2196F3;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        
        .animal-option .animal-image {
            width: 100px;
            height: 100px;
            object-fit: cover;
            border-radius: 10px;
        }
        
        .animal-option .animal-name {
            font-size: 1rem;
            font-weight: 600;
            color: #333;
        }
        
        .animal-option.correct {
            border-color: #4CAF50;
            background: #E8F5E9;
            animation: correctPulse 0.5s ease-out;
        }
        
        .animal-option.wrong {
            border-color: #F44336;
            background: #FFEBEE;
            animation: shake 0.5s ease-out;
        }
    `;
    document.head.appendChild(style);
}

// Initialize game
const whoSaysGame = new WhoSaysGame();

