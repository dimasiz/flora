// ========================================
// ENCYCLOPEDIA PAGE JAVASCRIPT
// ========================================

// ========================================
// МЕДИА ДЛЯ ЭНЦИКЛОПЕДИИ
// ========================================
const encyclopediaMedia = {
    // === МЛЕКОПИТАЮЩИЕ ===
    fox: {
        image: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2022/03/10/audio_b4bd4170ab.mp3' // лиса
    },
    hedgehog: {
        image: 'https://images.unsplash.com/photo-1551799473-1b4a9e953ff7?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2021/08/04/audio_bb630a9586.mp3' // ёжик пыхтит
    },
    squirrel: {
        image: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2022/10/30/audio_414a213328.mp3' // белка
    },
    rabbit: {
        image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400&h=400&fit=crop',
        sound: null
    },
    bear: {
        image: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2022/03/15/audio_115b1a4ed8.mp3' // медведь рычит
    },
    
    // === ПТИЦЫ ===
    owl: {
        image: 'https://images.unsplash.com/photo-1543549790-8b5f4a028cfb?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2022/03/24/audio_d5d776ef57.mp3' // сова ухает
    },
    stork: {
        image: 'https://images.unsplash.com/photo-1562831695-5e6a59e5a0a0?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2021/08/04/audio_12b0c7443c.mp3' // лебедь
    },
    duck: {
        image: 'https://images.unsplash.com/photo-1459682687441-7761439a709d?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3' // утка крякает
    },
    sparrow: {
        image: 'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2022/03/09/audio_c610232cca.mp3' // воробей чирикает
    },
    woodpecker: {
        image: 'https://images.unsplash.com/photo-1552727131-5fc6af16796d?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2022/08/04/audio_a86bde447e.mp3' // дятел стучит
    },
    
    // === РЫБЫ И РЕПТИЛИИ ===
    pike: {
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2021/08/04/audio_c518b61f13.mp3' // вода/плеск
    },
    carp: {
        image: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2021/08/04/audio_c518b61f13.mp3' // вода/плеск
    },
    perch: {
        image: 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=400&h=400&fit=crop',
        sound: null
    },
    
    // === НАСЕКОМЫЕ ===
    butterfly: {
        image: 'https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=400&h=400&fit=crop',
        sound: null
    },
    bee: {
        image: 'https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2022/03/10/audio_febc508520.mp3' // пчела жужжит
    },
    ladybug: {
        image: 'https://images.unsplash.com/photo-1504700610630-fec5af0a9363?w=400&h=400&fit=crop',
        sound: null
    },
    dragonfly: {
        image: 'https://images.unsplash.com/photo-1517423440428-a5a00ad493e8?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2022/10/18/audio_69884da99a.mp3' // муха жужжит
    },
    ant: {
        image: 'https://images.unsplash.com/photo-1518882605630-8996a190b162?w=400&h=400&fit=crop',
        sound: null
    },
    
    // === ДЕРЕВЬЯ ===
    oak: {
        image: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2022/03/12/audio_b4ae2c9359.mp3' // шелест листьев
    },
    pine: {
        image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2022/01/18/audio_d0c84dce52.mp3' // ветер в соснах
    },
    
    // === ЦВЕТЫ ===
    chamomile: {
        image: 'https://images.unsplash.com/photo-1568702846914-96b305d2ebb7?w=400&h=400&fit=crop',
        sound: null
    },
    sunflower: {
        image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=400&h=400&fit=crop',
        sound: null
    },
    lily: {
        image: 'https://images.unsplash.com/photo-1501973801540-537f08ccae7b?w=400&h=400&fit=crop',
        sound: null
    },
    
    // === ТРАВЫ ===
    clover: {
        image: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=400&h=400&fit=crop',
        sound: null
    },
    reed: {
        image: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=400&fit=crop',
        sound: 'https://cdn.pixabay.com/audio/2022/03/15/audio_80a8ee49df.mp3' // камыш шуршит
    },
    nettle: {
        image: 'https://images.unsplash.com/photo-1582593189887-fc02786c5ed3?w=400&h=400&fit=crop',
        sound: null
    },
    mint: {
        image: 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=400&h=400&fit=crop',
        sound: null
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const encyclopedia = new Encyclopedia();
    encyclopedia.init();
});

class Encyclopedia {
    constructor() {
        this.allItems = [];
        this.filteredItems = [];
        this.currentSound = null;
        this.currentFilters = {
            category: 'all',
            type: 'all',
            habitat: 'all'
        };
        
        this.elements = {
            searchInput: document.getElementById('search-input'),
            searchBtn: document.getElementById('search-btn'),
            searchSuggestions: document.getElementById('search-suggestions'),
            cardsGrid: document.getElementById('cards-grid'),
            noResults: document.getElementById('no-results'),
            modal: document.getElementById('card-modal'),
            modalClose: document.getElementById('modal-close'),
            modalImg: document.getElementById('modal-img'),
            modalTitle: document.getElementById('modal-title'),
            modalCategory: document.getElementById('modal-category'),
            modalFacts: document.getElementById('modal-facts'),
            typeFilter: document.getElementById('type-filter'),
            habitatFilter: document.getElementById('habitat-filter')
        };
    }
    
    getMedia(itemId) {
        const media = encyclopediaMedia[itemId] || { image: null, sound: null };
        // Пустые строки считаем как null
        return {
            image: media.image && media.image.length > 0 ? media.image : null,
            sound: media.sound && media.sound.length > 0 ? media.sound : null
        };
    }
    
    async init() {
        // Load data
        await this.loadData();
        
        // Render initial cards
        this.renderCards(this.allItems);
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    async loadData() {
        this.allItems = await db.getEncyclopedia();
        this.filteredItems = [...this.allItems];
    }
    
    setupEventListeners() {
        // Search input
        this.elements.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });
        
        this.elements.searchInput.addEventListener('focus', () => {
            if (this.elements.searchInput.value) {
                this.showSuggestions(this.elements.searchInput.value);
            }
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.elements.searchInput.contains(e.target) && 
                !this.elements.searchSuggestions.contains(e.target)) {
                this.hideSuggestions();
            }
        });
        
        // Search button
        this.elements.searchBtn.addEventListener('click', () => {
            this.performSearch(this.elements.searchInput.value);
        });
        
        // Enter key in search
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch(this.elements.searchInput.value);
                this.hideSuggestions();
            }
        });
        
        // Category filter buttons
        const categoryBtns = document.querySelectorAll('[data-filter="category"]');
        categoryBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilters.category = btn.dataset.value;
                this.applyFilters();
            });
        });
        
        // Type filter
        this.elements.typeFilter.addEventListener('change', (e) => {
            this.currentFilters.type = e.target.value;
            this.applyFilters();
        });
        
        // Habitat filter
        this.elements.habitatFilter.addEventListener('change', (e) => {
            this.currentFilters.habitat = e.target.value;
            this.applyFilters();
        });
        
        // Modal close
        this.elements.modalClose.addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close modal on overlay click
        this.elements.modal.querySelector('.modal-overlay').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close modal on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.modal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }
    
    handleSearch(query) {
        if (query.length > 0) {
            this.showSuggestions(query);
        } else {
            this.hideSuggestions();
            this.filteredItems = [...this.allItems];
            this.applyFilters();
        }
    }
    
    showSuggestions(query) {
        const matches = this.allItems.filter(item => 
            item.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);
        
        if (matches.length > 0) {
            this.elements.searchSuggestions.innerHTML = matches.map(item => `
                <div class="suggestion-item" data-id="${item.id}">
                    <span class="emoji">${item.emoji}</span>
                    <span class="name">${item.name}</span>
                    <span class="category">${item.category === 'animals' ? '🐾' : '🌱'}</span>
                </div>
            `).join('');
            
            this.elements.searchSuggestions.classList.add('active');
            
            // Add click handlers to suggestions
            this.elements.searchSuggestions.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.dataset.id;
                    const selectedItem = this.allItems.find(i => i.id === id);
                    if (selectedItem) {
                        this.elements.searchInput.value = selectedItem.name;
                        this.performSearch(selectedItem.name);
                        this.hideSuggestions();
                    }
                });
            });
        } else {
            this.hideSuggestions();
        }
    }
    
    hideSuggestions() {
        this.elements.searchSuggestions.classList.remove('active');
    }
    
    performSearch(query) {
        if (!query) {
            this.filteredItems = [...this.allItems];
        } else {
            this.filteredItems = this.allItems.filter(item =>
                item.name.toLowerCase().includes(query.toLowerCase())
            );
        }
        this.applyFilters();
    }
    
    applyFilters() {
        let items = [...this.filteredItems];
        
        // Apply category filter
        if (this.currentFilters.category !== 'all') {
            items = items.filter(item => item.category === this.currentFilters.category);
        }
        
        // Apply type filter
        if (this.currentFilters.type !== 'all') {
            items = items.filter(item => item.type === this.currentFilters.type);
        }
        
        // Apply habitat filter
        if (this.currentFilters.habitat !== 'all') {
            items = items.filter(item => item.habitat === this.currentFilters.habitat);
        }
        
        this.renderCards(items);
    }
    
    renderCards(items) {
        if (items.length === 0) {
            this.elements.cardsGrid.innerHTML = '';
            this.elements.noResults.style.display = 'block';
            return;
        }
        
        this.elements.noResults.style.display = 'none';
        
        this.elements.cardsGrid.innerHTML = items.map(item => {
            const media = this.getMedia(item.id);
            const hasImage = media.image;
            
            return `
                <div class="encyclopedia-card ${item.category === 'animals' ? 'animal-card' : 'plant-card'}" 
                     data-id="${item.id}">
                    <div class="card-image">
                        ${hasImage 
                            ? `<img src="${media.image}" alt="${item.name}" class="card-photo">`
                            : `<span class="emoji">${item.emoji}</span>`
                        }
                        <span class="card-category-badge">
                            ${item.category === 'animals' ? '🐾 Животное' : '🌱 Растение'}
                        </span>
                    </div>
                    <div class="card-info">
                        <h3 class="card-name">${item.name}</h3>
                        <p class="card-type">${item.typeName} • ${item.habitatName}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers to cards
        this.elements.cardsGrid.querySelectorAll('.encyclopedia-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.dataset.id;
                const item = this.allItems.find(i => i.id === id);
                if (item) {
                    this.openModal(item);
                }
            });
        });
    }
    
    openModal(item) {
        const media = this.getMedia(item.id);
        const hasImage = media.image;
        const hasSound = media.sound || media.soundText;
        
        // Set modal image
        const modalImg = document.getElementById('modal-img');
        if (modalImg) {
            if (hasImage) {
                modalImg.innerHTML = `<img src="${media.image}" alt="${item.name}" class="modal-photo">`;
            } else {
                modalImg.style.fontSize = '8rem';
                modalImg.innerHTML = item.emoji;
            }
        }
        
        this.elements.modalTitle.textContent = item.name;
        
        // Category info with sound button for animals
        this.elements.modalCategory.innerHTML = `
            <span class="category-type">${item.typeName}</span>
            <span class="category-habitat">📍 ${item.habitatName}</span>
            ${item.category === 'animals' && hasSound ? `
                <button class="play-animal-sound" data-sound="${media.sound || ''}" data-sound-text="${media.soundText || ''}" title="Послушать звук">
                    🔊 Послушать
                </button>
            ` : ''}
        `;
        
        // Facts with voiceover button
        this.elements.modalFacts.innerHTML = `
            <div class="facts-header">
                <h4>Интересные факты</h4>
                <button class="read-facts-btn" title="Озвучить факты">🔊 Озвучить</button>
            </div>
            <ul class="facts-list">
                ${item.facts.map((fact, index) => `
                    <li data-fact="${index}">${fact}</li>
                `).join('')}
            </ul>
        `;
        
        // Add sound button handler
        const soundBtn = this.elements.modalCategory.querySelector('.play-animal-sound');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => this.playAnimalSound(media));
        }
        
        // Add facts voiceover handler
        const readFactsBtn = this.elements.modalFacts.querySelector('.read-facts-btn');
        if (readFactsBtn) {
            readFactsBtn.addEventListener('click', () => this.readFacts(item.facts, item.name));
        }
        
        // Show modal
        this.elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    playAnimalSound(media) {
        // Stop previous sound
        if (this.currentSound) {
            this.currentSound.pause();
            this.currentSound.currentTime = 0;
        }
        
        if (media.sound) {
            this.currentSound = new Audio(media.sound);
            this.currentSound.volume = 0.8;
            this.currentSound.play().catch(e => {
                console.log('Не удалось воспроизвести звук:', e);
            });
        }
    }
    
    readFacts(facts, animalName) {
        // Cancel any ongoing speech
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        const introText = `Интересные факты о ${animalName}. `;
        const allFacts = facts.join('. ');
        speakText(introText + allFacts);
    }
    
    closeModal() {
        // Stop any playing sounds
        if (this.currentSound) {
            this.currentSound.pause();
            this.currentSound.currentTime = 0;
        }
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        
        this.elements.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

