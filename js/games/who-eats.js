// ========================================
// WHO EATS WHAT GAME (Кто что ест?)
// ========================================

class WhoEatsGame {
    constructor() {
        this.currentLevel = 1;
        this.pairs = [];
        this.fedAnimals = new Set();
        
        this.registerWhenReady();
    }
    
    registerWhenReady() {
        if (typeof gameManager !== 'undefined') {
            gameManager.registerGame('who-eats', this);
        } else {
            setTimeout(() => this.registerWhenReady(), 100);
        }
    }
    
    async start(level) {
        this.currentLevel = level;
        this.fedAnimals = new Set();
        
        // Load game data
        const gameData = await db.getGameData('whoEats');
        const levelData = gameData.levels.find(l => l.level === level);
        
        if (!levelData) {
            console.error('Level not found:', level);
            return;
        }
        
        this.pairs = levelData.pairs;
        
        // Set instruction
        gameManager.setInstruction('Зверята проголодались. Накорми их! Перетащи еду к нужному животному.');
        
        this.render();
    }
    
    render() {
        const gameArea = gameManager.getGameArea();
        const shuffledFood = shuffleArray([...this.pairs]);
        
        gameArea.innerHTML = `
            <div class="who-eats-container">
                <div class="animals-column">
                    <h3 style="text-align: center; margin-bottom: 15px; color: var(--color-animals);">🐾 Животные</h3>
                    ${this.pairs.map((pair, index) => `
                        <div class="animal-item ${this.fedAnimals.has(index) ? 'fed' : ''}" 
                             data-index="${index}" 
                             data-food="${pair.food}">
                            <span class="emoji">${pair.animal}</span>
                            <span class="animal-name">${pair.animalName}</span>
                            ${this.fedAnimals.has(index) ? '<span class="fed-icon">✓</span>' : ''}
                        </div>
                    `).join('')}
                </div>
                <div class="food-column">
                    <h3 style="text-align: center; margin-bottom: 15px; color: var(--primary-green);">🍽️ Еда</h3>
                    ${shuffledFood.map((pair, index) => {
                        // Check if this food is already used
                        const isUsed = [...this.fedAnimals].some(i => this.pairs[i].food === pair.food);
                        if (isUsed) return '';
                        return `
                            <div class="food-item" 
                                 data-id="food-${index}"
                                 data-food="${pair.food}"
                                 draggable="true">
                                <span class="emoji">${pair.food}</span>
                                <span class="food-name">${pair.foodName}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="hint-container" id="hint-container"></div>
        `;
        
        this.initDragDrop();
    }
    
    initDragDrop() {
        const foodItems = document.querySelectorAll('.food-item');
        const animalItems = document.querySelectorAll('.animal-item:not(.fed)');
        
        foodItems.forEach(food => {
            // Mouse drag
            food.addEventListener('dragstart', (e) => {
                food.classList.add('dragging');
                e.dataTransfer.setData('text/plain', food.dataset.food);
            });
            
            food.addEventListener('dragend', () => {
                food.classList.remove('dragging');
            });
            
            // Touch support
            let touchStartX, touchStartY;
            
            food.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                touchStartX = touch.clientX - food.offsetLeft;
                touchStartY = touch.clientY - food.offsetTop;
                food.classList.add('dragging');
            }, { passive: true });
            
            food.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                food.style.position = 'fixed';
                food.style.left = (touch.clientX - touchStartX) + 'px';
                food.style.top = (touch.clientY - touchStartY) + 'px';
                food.style.zIndex = '1000';
                
                // Highlight potential drop targets
                animalItems.forEach(animal => {
                    const rect = animal.getBoundingClientRect();
                    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                        animal.classList.add('highlight');
                    } else {
                        animal.classList.remove('highlight');
                    }
                });
            });
            
            food.addEventListener('touchend', (e) => {
                const touch = e.changedTouches[0];
                
                animalItems.forEach(animal => {
                    const rect = animal.getBoundingClientRect();
                    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                        this.handleDrop(food.dataset.food, animal);
                    }
                    animal.classList.remove('highlight');
                });
                
                food.style.position = '';
                food.style.left = '';
                food.style.top = '';
                food.style.zIndex = '';
                food.classList.remove('dragging');
            });
        });
        
        animalItems.forEach(animal => {
            animal.addEventListener('dragover', (e) => {
                e.preventDefault();
                animal.classList.add('highlight');
            });
            
            animal.addEventListener('dragleave', () => {
                animal.classList.remove('highlight');
            });
            
            animal.addEventListener('drop', (e) => {
                e.preventDefault();
                animal.classList.remove('highlight');
                const foodEmoji = e.dataTransfer.getData('text/plain');
                this.handleDrop(foodEmoji, animal);
            });
        });
    }
    
    handleDrop(foodEmoji, animalElement) {
        const expectedFood = animalElement.dataset.food;
        const animalIndex = parseInt(animalElement.dataset.index);
        
        if (foodEmoji === expectedFood) {
            // Correct!
            this.fedAnimals.add(animalIndex);
            gameManager.playSound('correct');
            
            // Animate
            animalElement.classList.add('fed');
            showFeedback(gameManager.getGameArea(), '🍽️ Ням-ням! Вкусно!', true);
            
            // Check if all animals are fed
            if (this.fedAnimals.size === this.pairs.length) {
                setTimeout(() => {
                    gameManager.showResult(true);
                }, 1000);
            } else {
                // Re-render to remove used food
                setTimeout(() => this.render(), 500);
            }
        } else {
            // Wrong
            gameManager.playSound('wrong');
            animalElement.classList.add('wrong');
            showFeedback(gameManager.getGameArea(), 'Хм, это не его еда. Попробуй снова!', false);
            
            setTimeout(() => {
                animalElement.classList.remove('wrong');
            }, 500);
        }
    }
}

// Initialize game
const whoEatsGame = new WhoEatsGame();









