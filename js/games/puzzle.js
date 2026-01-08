// ========================================
// PUZZLE GAME (Пазл)
// ========================================

class PuzzleGame {
    constructor() {
        this.currentLevel = 1;
        this.gridSize = 3;
        this.pieces = [];
        this.placedPieces = new Set();
        this.image = '';
        this.imageName = '';
        
        this.registerWhenReady();
    }
    
    registerWhenReady() {
        if (typeof gameManager !== 'undefined') {
            gameManager.registerGame('puzzle', this);
        } else {
            setTimeout(() => this.registerWhenReady(), 100);
        }
    }
    
    async start(level) {
        this.currentLevel = level;
        this.placedPieces = new Set();
        
        // Load game data
        const gameData = await db.getGameData('puzzle');
        const levelData = gameData.levels.find(l => l.level === level);
        
        if (!levelData) {
            console.error('Level not found:', level);
            return;
        }
        
        this.image = levelData.image;
        this.imageName = levelData.name;
        this.gridSize = levelData.gridSize;
        
        // Create puzzle pieces (numbered 0-8 for 3x3)
        this.pieces = Array.from({ length: this.gridSize * this.gridSize }, (_, i) => i);
        
        // Set instruction
        gameManager.setInstruction(`Картинка разбилась на кусочки! Собери ${this.imageName}, чтобы увидеть картинку целиком.`);
        
        this.render();
    }
    
    render() {
        const gameArea = gameManager.getGameArea();
        const shuffledPieces = shuffleArray(this.pieces.filter(p => !this.placedPieces.has(p)));
        
        const pieceSize = 100 / this.gridSize; // Size in percentage
        const pieceSizePx = this.gridSize === 3 ? 80 : 70; // Size in pixels for display
        
        gameArea.innerHTML = `
            <div class="puzzle-container">
                <div class="puzzle-pieces">
                    <h4 style="width: 100%; text-align: center; margin-bottom: 10px;">Кусочки:</h4>
                    ${shuffledPieces.map(pieceIndex => {
                        const row = Math.floor(pieceIndex / this.gridSize);
                        const col = pieceIndex % this.gridSize;
                        return `
                            <div class="puzzle-piece" 
                                 data-piece="${pieceIndex}"
                                 data-id="piece-${pieceIndex}"
                                 draggable="true"
                                 style="
                                     width: ${pieceSizePx}px;
                                     height: ${pieceSizePx}px;
                                     background-image: url('${this.image}');
                                     background-size: ${this.gridSize * 100}% ${this.gridSize * 100}%;
                                     background-position: ${col * pieceSize}% ${row * pieceSize}%;
                                 ">
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="puzzle-board-container">
                    <h4 style="text-align: center; margin-bottom: 10px;">Собери картинку:</h4>
                    <div class="puzzle-board grid-${this.gridSize}">
                        ${this.pieces.map(index => {
                            const isPlaced = this.placedPieces.has(index);
                            const row = Math.floor(index / this.gridSize);
                            const col = index % this.gridSize;
                            return `
                                <div class="puzzle-slot ${isPlaced ? 'filled correct' : ''}" 
                                     data-slot="${index}"
                                     style="${isPlaced ? `
                                         background-image: url('${this.image}');
                                         background-size: ${this.gridSize * 100}% ${this.gridSize * 100}%;
                                         background-position: ${col * pieceSize}% ${row * pieceSize}%;
                                     ` : 'background: rgba(255,255,255,0.3);'}">
                                    ${!isPlaced ? (index + 1) : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div style="text-align: center; margin-top: 15px;">
                        <p style="font-weight: bold; font-size: 1.2rem; margin-bottom: 5px;">${this.imageName}</p>
                        <img src="${this.image}" alt="${this.imageName}" 
                             style="max-width: 200px; height: auto; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
                    </div>
                </div>
            </div>
        `;
        
        this.initDragDrop();
    }
    
    initDragDrop() {
        const pieces = document.querySelectorAll('.puzzle-piece');
        const slots = document.querySelectorAll('.puzzle-slot:not(.filled)');
        
        pieces.forEach(piece => {
            // Mouse drag
            piece.addEventListener('dragstart', (e) => {
                piece.classList.add('dragging');
                e.dataTransfer.setData('text/plain', piece.dataset.piece);
            });
            
            piece.addEventListener('dragend', () => {
                piece.classList.remove('dragging');
            });
            
            // Touch support
            let touchOffset = { x: 0, y: 0 };
            
            piece.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                const rect = piece.getBoundingClientRect();
                touchOffset.x = touch.clientX - rect.left;
                touchOffset.y = touch.clientY - rect.top;
                piece.classList.add('dragging');
            }, { passive: true });
            
            piece.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                piece.style.position = 'fixed';
                piece.style.left = (touch.clientX - touchOffset.x) + 'px';
                piece.style.top = (touch.clientY - touchOffset.y) + 'px';
                piece.style.zIndex = '1000';
                
                slots.forEach(slot => {
                    const rect = slot.getBoundingClientRect();
                    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                        slot.classList.add('highlight');
                    } else {
                        slot.classList.remove('highlight');
                    }
                });
            });
            
            piece.addEventListener('touchend', (e) => {
                const touch = e.changedTouches[0];
                
                slots.forEach(slot => {
                    const rect = slot.getBoundingClientRect();
                    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                        this.handleDrop(parseInt(piece.dataset.piece), parseInt(slot.dataset.slot));
                    }
                    slot.classList.remove('highlight');
                });
                
                piece.style.position = '';
                piece.style.left = '';
                piece.style.top = '';
                piece.style.zIndex = '';
                piece.classList.remove('dragging');
            });
        });
        
        slots.forEach(slot => {
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                slot.classList.add('highlight');
            });
            
            slot.addEventListener('dragleave', () => {
                slot.classList.remove('highlight');
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                slot.classList.remove('highlight');
                const pieceIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const slotIndex = parseInt(slot.dataset.slot);
                this.handleDrop(pieceIndex, slotIndex);
            });
        });
    }
    
    handleDrop(pieceIndex, slotIndex) {
        if (pieceIndex === slotIndex) {
            // Correct placement
            this.placedPieces.add(pieceIndex);
            gameManager.playSound('correct');
            
            // Check if puzzle is complete
            if (this.placedPieces.size === this.pieces.length) {
                setTimeout(() => {
                    gameManager.showResult(true);
                }, 500);
            } else {
                // Re-render to update board
                this.render();
            }
        } else {
            // Wrong placement
            gameManager.playSound('wrong');
            showFeedback(gameManager.getGameArea(), 'Попробуй другой кусочек!', false);
        }
    }
}

// Initialize game
const puzzleGame = new PuzzleGame();


