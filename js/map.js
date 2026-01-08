// ========================================
// MAP PAGE JAVASCRIPT
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const mapPage = new MapPage();
    mapPage.init();
});

class MapPage {
    constructor() {
        this.markers = [];
        this.selectedMarker = null;
        
        this.elements = {
            mapMarkers: document.getElementById('map-markers'),
            infoPanel: document.getElementById('info-panel'),
            mapImage: document.getElementById('map-image'),
            fallbackSvg: document.getElementById('fallback-svg'),
            regionOverlays: document.getElementById('region-overlays')
        };
    }
    
    async init() {
        // Setup map display (image or SVG fallback)
        this.setupMapDisplay();
        
        // Load markers data
        await this.loadMarkers();
        
        // Render markers on map
        this.renderMarkers();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Add decorative elements
        this.addDecorations();
    }
    
    setupMapDisplay() {
        // Check if map image exists
        if (this.elements.mapImage) {
            this.elements.mapImage.onload = () => {
                this.elements.mapImage.classList.add('loaded');
                if (this.elements.regionOverlays) {
                    this.elements.regionOverlays.style.display = 'block';
                }
            };
            
            this.elements.mapImage.onerror = () => {
                // Image failed to load, show SVG fallback
                console.log('Map image not found, using SVG fallback');
                if (this.elements.fallbackSvg) {
                    this.elements.fallbackSvg.style.display = 'block';
                }
            };
        }
    }
    
    async loadMarkers() {
        this.markers = await db.getMapMarkers();
    }
    
    renderMarkers() {
        this.elements.mapMarkers.innerHTML = this.markers.map(marker => `
            <div class="map-marker ${marker.type}" 
                 data-id="${marker.id}"
                 style="left: ${marker.position.x}%; top: ${marker.position.y}%;">
                <span class="marker-icon">${marker.emoji}</span>
                <div class="marker-tooltip">${marker.name}</div>
            </div>
        `).join('');
        
        // Add click handlers
        this.elements.mapMarkers.querySelectorAll('.map-marker').forEach(markerEl => {
            markerEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = markerEl.dataset.id;
                this.selectMarker(id, markerEl);
            });
        });
    }
    
    addDecorations() {
        // Add floating decorations to the map
        const decorations = [
            { emoji: '🌲', class: 'tree-1' },
            { emoji: '🌳', class: 'tree-2' },
            { emoji: '☁️', class: 'cloud-1' },
            { emoji: '🦅', class: 'bird-1' }
        ];
        
        const mapContainer = document.querySelector('.belarus-map');
        if (mapContainer) {
            decorations.forEach(dec => {
                const el = document.createElement('div');
                el.className = `map-decoration ${dec.class}`;
                el.textContent = dec.emoji;
                mapContainer.appendChild(el);
            });
        }
    }
    
    setupEventListeners() {
        // Close info panel when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.map-marker') && 
                !e.target.closest('.info-panel')) {
                this.deselectMarker();
            }
        });
        
        // Add hover effects to SVG regions
        if (this.elements.fallbackSvg) {
            const regions = this.elements.fallbackSvg.querySelectorAll('.region');
            regions.forEach(region => {
                region.addEventListener('mouseenter', () => {
                    region.style.filter = 'brightness(1.1)';
                });
                region.addEventListener('mouseleave', () => {
                    region.style.filter = '';
                });
            });
        }
    }
    
    selectMarker(id, element) {
        // Deselect previous
        if (this.selectedMarker) {
            this.selectedMarker.classList.remove('active');
        }
        
        // Select new
        element.classList.add('active');
        this.selectedMarker = element;
        
        // Find marker data
        const marker = this.markers.find(m => m.id === id);
        if (marker) {
            this.showInfo(marker);
            
            // Play sound effect
            this.playSelectSound();
        }
    }
    
    deselectMarker() {
        if (this.selectedMarker) {
            this.selectedMarker.classList.remove('active');
            this.selectedMarker = null;
        }
        this.hideInfo();
    }
    
    showInfo(marker) {
        const categoryClass = marker.type === 'animal' ? 'animal' : 'plant';
        const categoryText = marker.type === 'animal' ? '🐾 Животное' : '🌱 Растение';
        
        this.elements.infoPanel.querySelector('.info-panel-content').innerHTML = `
            <div class="info-content">
                <div class="info-image">${marker.emoji}</div>
                <div class="info-details">
                    <h3 class="info-title">
                        ${marker.name}
                        <span class="info-category ${categoryClass}">${categoryText}</span>
                    </h3>
                    <div class="info-facts">
                        ${marker.facts.map(fact => `<p>${fact}</p>`).join('')}
                    </div>
                    <div class="info-habitat">
                        <span>📍 ${marker.habitat}</span>
                    </div>
                </div>
            </div>
        `;
        
        this.elements.infoPanel.classList.add('active');
        
        // Scroll to info panel on mobile
        if (window.innerWidth <= 768) {
            this.elements.infoPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    hideInfo() {
        this.elements.infoPanel.querySelector('.info-panel-content').innerHTML = `
            <div class="info-placeholder">
                <div class="placeholder-icon">👆</div>
                <p>Нажми на любую иконку на карте, чтобы узнать интересные факты!</p>
            </div>
        `;
        this.elements.infoPanel.classList.remove('active');
    }
    
    playSelectSound() {
        // Simple click sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
            // Audio not supported, ignore
        }
    }
}
