// ========================================
// ENCYCLOPEDIA PAGE JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const encyclopedia = new Encyclopedia();
    encyclopedia.init();
});

class Encyclopedia {
    constructor() {
        this.allItems = [];
        this.filteredItems = [];
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
        
        this.elements.cardsGrid.innerHTML = items.map(item => `
            <div class="encyclopedia-card ${item.category === 'animals' ? 'animal-card' : 'plant-card'}" 
                 data-id="${item.id}">
                <div class="card-image">
                    <span class="emoji">${item.emoji}</span>
                    <span class="card-category-badge">
                        ${item.category === 'animals' ? '🐾 Животное' : '🌱 Растение'}
                    </span>
                </div>
                <div class="card-info">
                    <h3 class="card-name">${item.name}</h3>
                    <p class="card-type">${item.typeName} • ${item.habitatName}</p>
                </div>
            </div>
        `).join('');
        
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
        // Set modal content - получаем элемент заново каждый раз
        const modalImg = document.getElementById('modal-img');
        if (modalImg) {
            modalImg.style.fontSize = '8rem';
            modalImg.innerHTML = item.emoji;
        }
        
        this.elements.modalTitle.textContent = item.name;
        
        this.elements.modalCategory.innerHTML = `
            <span class="category-type">${item.typeName}</span>
            <span class="category-habitat">📍 ${item.habitatName}</span>
        `;
        
        this.elements.modalFacts.innerHTML = `
            <h4>Интересные факты</h4>
            <ul class="facts-list">
                ${item.facts.map(fact => `<li>${fact}</li>`).join('')}
            </ul>
        `;
        
        // Show modal
        this.elements.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        this.elements.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

