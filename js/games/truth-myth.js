// ========================================
// TRUTH OR MYTH GAME (Правда или миф)
// ========================================

class TruthMythGame {
    constructor() {
        this.currentLevel = 1;
        this.currentQuestion = 0;
        this.score = 0;
        this.questions = [];
        this.firstAttempt = true;
        this.answeredQuestions = [];
        
        this.registerWhenReady();
    }
    
    registerWhenReady() {
        if (typeof gameManager !== 'undefined') {
            gameManager.registerGame('truth-myth', this);
        } else {
            setTimeout(() => this.registerWhenReady(), 100);
        }
    }
    
    async start(level) {
        this.currentLevel = level;
        this.currentQuestion = 0;
        this.score = 0;
        this.firstAttempt = true;
        this.answeredQuestions = [];
        
        // Load game data
        const gameData = await db.getGameData('truthMyth');
        const levelData = gameData.levels.find(l => l.level === level);
        
        if (!levelData) {
            console.error('Level not found:', level);
            return;
        }
        
        this.questions = levelData.questions;
        
        // Set instruction
        gameManager.setInstruction('А ну-ка проверим, как много ты знаешь о нашей планете! Выбирай: правда или миф!');
        
        this.showQuestion();
    }
    
    showQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            // All questions answered
            const passed = this.score >= this.questions.length; // At least answered all correctly once
            gameManager.showResult(true, this.score);
            return;
        }
        
        const question = this.questions[this.currentQuestion];
        const gameArea = gameManager.getGameArea();
        
        gameArea.innerHTML = `
            <div class="progress-indicator">
                ${this.questions.map((_, i) => {
                    let className = 'progress-dot';
                    if (i < this.currentQuestion) {
                        className += this.answeredQuestions[i] ? ' completed' : ' wrong-answer';
                    } else if (i === this.currentQuestion) {
                        className += ' active';
                    }
                    return `<div class="${className}"></div>`;
                }).join('')}
            </div>
            <div class="truth-myth-container">
                <div class="statement-card">
                    <button class="statement-sound" onclick="speakText('${question.statement}')" title="Озвучить">
                        🔊
                    </button>
                    <div class="statement-icon">${question.emoji}</div>
                    <p class="statement-text">${question.statement}</p>
                </div>
                <div class="truth-myth-buttons">
                    <button class="answer-btn btn-truth" data-answer="true">
                        ✓ Правда
                    </button>
                    <button class="answer-btn btn-myth" data-answer="false">
                        ✗ Миф
                    </button>
                </div>
            </div>
            <div id="feedback-area"></div>
        `;
        
        // Add click handlers
        const buttons = gameArea.querySelectorAll('.answer-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => this.handleAnswer(btn, question.answer));
        });
        
        this.firstAttempt = true;
    }
    
    handleAnswer(button, correctAnswer) {
        const userAnswer = button.dataset.answer === 'true';
        const isCorrect = userAnswer === correctAnswer;
        
        if (isCorrect) {
            // Correct answer
            button.classList.add('correct');
            gameManager.playSound('correct');
            
            // Add points only on first attempt
            if (this.firstAttempt) {
                this.score += 2;
                gameManager.updateScore(2);
                this.answeredQuestions.push(true);
            } else {
                this.answeredQuestions.push(false);
            }
            
            showFeedback(document.getElementById('feedback-area'), '✓ Правильно! Молодец!', true);
            
            // Disable buttons
            document.querySelectorAll('.answer-btn').forEach(btn => {
                btn.disabled = true;
            });
            
            // Wait and move to next question
            setTimeout(() => {
                this.currentQuestion++;
                this.showQuestion();
            }, 1500);
        } else {
            // Wrong answer
            button.classList.add('wrong');
            gameManager.playSound('wrong');
            this.firstAttempt = false;
            
            showFeedback(document.getElementById('feedback-area'), 'Не совсем так. Попробуй ещё раз!', false);
            
            // Remove wrong class after animation
            setTimeout(() => {
                button.classList.remove('wrong');
            }, 500);
        }
    }
}

// Initialize game
const truthMythGame = new TruthMythGame();









