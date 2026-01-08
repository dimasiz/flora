// ========================================
// WHO LIVES WHERE GAME (Кто где живёт?)
// ========================================

class WhoLivesGame {
    constructor() {
        this.currentLevel = 1;
        this.animals = [];
        this.habitats = [];
        this.placedAnimals = {};
        
        this.registerWhenReady();
    }
    
    registerWhenReady() {
        if (typeof gameManager !== 'undefined') {
            gameManager.registerGame('who-lives', this);
        } else {
            setTimeout(() => this.registerWhenReady(), 100);
        }
    }
    
    async start(level) {
        this.currentLevel = level;
        this.placedAnimals = {};
        
        // Load game data
        const gameData = await db.getGameData('whoLives');
        const levelData = gameData.levels.find(l => l.level === level);
        
        if (!levelData) {
            console.error('Level not found:', level);
            return;
        }
        
        this.animals = [...levelData.animals];
        this.habitats = levelData.habitats;
        
        // Initialize placed animals tracking
        this.habitats.forEach(h => {
            this.placedAnimals[h.id] = [];
        });
        
        // Set instruction
        gameManager.setInstruction('Ой, зверята потерялись! Помоги каждому найти свой дом. Перетащи животное в нужное место.');
        
        this.render();
    }
    
    render() {
        const gameArea = gameManager.getGameArea();
        
        // Get remaining (not placed) animals
        const placedAnimalEmojis = Object.values(this.placedAnimals).flat().map(a => a.emoji);
        const remainingAnimals = this.animals.filter(a => !placedAnimalEmojis.includes(a.emoji));
        
        gameArea.innerHTML = `
            <div class="who-lives-container">
                <div class="animals-list">
                    <h3 style="text-align: center; margin-bottom: 15px; color: var(--color-animals);">🐾 Животные</h3>
                    ${remainingAnimals.length > 0 ? remainingAnimals.map((animal, index) => `
                        <div class="draggable-animal" 
                             data-id="animal-${index}"
                             data-emoji="${animal.emoji}"
                             data-habitat="${animal.habitat}"
                             draggable="true">
                            <span class="emoji">${animal.emoji}</span>
                            <span class="name">${animal.name}</span>
                        </div>
                    `).join('') : '<p style="text-align: center; color: var(--text-light);">Все расселены!</p>'}
                </div>
                <div class="habitats-list">
                    ${this.habitats.map(habitat => `
                        <div class="habitat-zone" data-habitat="${habitat.id}">
                            <span class="habitat-icon">${habitat.emoji}</span>
                            <span class="habitat-name">${habitat.name}</span>
                            <div class="placed-animals">
                                ${this.placedAnimals[habitat.id].map(animal => `
                                    <span class="placed-animal">${animal.emoji}</span>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        this.initDragDrop();
    }
    
    initDragDrop() {
        const animals = document.querySelectorAll('.draggable-animal');
        const habitats = document.querySelectorAll('.habitat-zone');
        
        animals.forEach(animal => {
            // Mouse drag
            animal.addEventListener('dragstart', (e) => {
                animal.classList.add('dragging');
                e.dataTransfer.setData('application/json', JSON.stringify({
                    emoji: animal.dataset.emoji,
                    habitat: animal.dataset.habitat,
                    name: animal.querySelector('.name').textContent
                }));
            });
            
            animal.addEventListener('dragend', () => {
                animal.classList.remove('dragging');
            });
            
            // Touch support
            let touchOffset = { x: 0, y: 0 };
            
            animal.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                const rect = animal.getBoundingClientRect();
                touchOffset.x = touch.clientX - rect.left;
                touchOffset.y = touch.clientY - rect.top;
                animal.classList.add('dragging');
            }, { passive: true });
            
            animal.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touch = e.touches[0];
                animal.style.position = 'fixed';
                animal.style.left = (touch.clientX - touchOffset.x) + 'px';
                animal.style.top = (touch.clientY - touchOffset.y) + 'px';
                animal.style.zIndex = '1000';
                
                habitats.forEach(habitat => {
                    const rect = habitat.getBoundingClientRect();
                    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                        habitat.classList.add('highlight');
                    } else {
                        habitat.classList.remove('highlight');
                    }
                });
            });
            
            animal.addEventListener('touchend', (e) => {
                const touch = e.changedTouches[0];
                
                habitats.forEach(habitat => {
                    const rect = habitat.getBoundingClientRect();
                    if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
                        touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
                        this.handleDrop({
                            emoji: animal.dataset.emoji,
                            habitat: animal.dataset.habitat,
                            name: animal.querySelector('.name').textContent
                        }, habitat.dataset.habitat);
                    }
                    habitat.classList.remove('highlight');
                });
                
                animal.style.position = '';
                animal.style.left = '';
                animal.style.top = '';
                animal.style.zIndex = '';
                animal.classList.remove('dragging');
            });
        });
        
        habitats.forEach(habitat => {
            habitat.addEventListener('dragover', (e) => {
                e.preventDefault();
                habitat.classList.add('highlight');
            });
            
            habitat.addEventListener('dragleave', () => {
                habitat.classList.remove('highlight');
            });
            
            habitat.addEventListener('drop', (e) => {
                e.preventDefault();
                habitat.classList.remove('highlight');
                const animalData = JSON.parse(e.dataTransfer.getData('application/json'));
                const targetHabitat = habitat.dataset.habitat;
                this.handleDrop(animalData, targetHabitat);
            });
        });
    }
    
    handleDrop(animalData, targetHabitat) {
        if (animalData.habitat === targetHabitat) {
            // Correct!
            this.placedAnimals[targetHabitat].push({
                emoji: animalData.emoji,
                name: animalData.name
            });
            
            gameManager.playSound('correct');
            showFeedback(gameManager.getGameArea(), '🏠 Теперь зверёк дома!', true);
            
            // Check if all animals are placed
            const totalPlaced = Object.values(this.placedAnimals).flat().length;
            if (totalPlaced === this.animals.length) {
                setTimeout(() => {
                    gameManager.showResult(true);
                }, 1000);
            } else {
                // Re-render
                setTimeout(() => this.render(), 500);
            }
        } else {
            // Wrong
            gameManager.playSound('wrong');
            showFeedback(gameManager.getGameArea(), 'Ой, это не его дом. Попробуй ещё раз!', false);
        }
    }
}

// Initialize game
const whoLivesGame = new WhoLivesGame();









