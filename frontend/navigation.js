/**
 * Navigation Manager - Handles all navigation-related functionality
 */
class NavigationManager {
    constructor() {
        this.pages = [
            { name: 'Home',        content: 'pages/home.html',       type: 'file', chipCount: 4, marqueeDx: 8 },
            { name: 'Product',     content: 'pages/product.html',    type: 'file', chipCount: 5, marqueeDx: -10 },
            { name: 'About',       content: 'pages/about.html',      type: 'file', chipCount: 4, marqueeDx: -16, rightGapExtra: 14, neighborRightExtra: 14 },
            { name: 'Contact',     content: 'pages/contact.html',    type: 'file', chipCount: 5, marqueeDx: -8 },
            { name: 'Gameplay',    content: 'pages/gameplay.html',   type: 'file', chipCount: 6, marqueeDx: -10 },
            { name: 'KickStarter', content: 'pages/kickstarter.html',type: 'file', chipCount: 6, marqueeDx: -28 }
        ];
        
        this.activeIndex = 0;
        this.isMobileMenuOpen = false;
        this.CHIP_SIZE = 18;
        
        this.initializeElements();
        this.setupEventListeners();
        this.render();
    }
    
    initializeElements() {
        this.mainContent = document.getElementById('main-content');
        this.desktopNavList = document.getElementById('desktop-nav-list');
        this.mobileNavList = document.getElementById('mobile-nav-list');
        this.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        this.mobileMenu = document.getElementById('mobile-menu');
        this.backdrop = document.getElementById('backdrop');
        this.navbar = document.getElementById('navbar');
        this.marqueeOverlay = document.getElementById('marquee-overlay');
    }
    
    setupEventListeners() {
        // Mobile menu toggle
        this.mobileMenuToggle?.addEventListener('click', () => this.toggleMobileMenu());
        this.backdrop?.addEventListener('click', () => this.closeMobileMenu());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
        
        // Responsive behavior
        window.addEventListener('resize', () => {
            this.updateLayout();
            if (window.innerWidth > 480 && this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
        
        // Initial layout update
        this.updateLayout();
    }
    
    createNavButton(page, index, isMobile = false) {
        const button = document.createElement('button');
        button.className = isMobile ? 'navbar__button mobile-menu__button' : 'navbar__button';
        button.type = 'button';
        button.dataset.index = index;
        button.textContent = page.name;
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', 'false');
        
        // Build exact chip row only for desktop buttons
        if (!isMobile) {
            const chipRow = document.createElement('div');
            chipRow.className = 'chip-row';
            for (let i = 0; i < (page.chipCount || 0); i++) {
                const chip = document.createElement('span');
                chip.className = 'chip';
                chipRow.appendChild(chip);
            }
            button.appendChild(chipRow);
        }
        
        button.addEventListener('click', () => {
            this.setActivePage(index, button);
            if (this.isMobileMenuOpen) {
                this.closeMobileMenu();
            }
        });
        
        return button;
    }
    
    render() {
        // Clear existing navigation
        if (this.desktopNavList) this.desktopNavList.innerHTML = '';
        if (this.mobileNavList) this.mobileNavList.innerHTML = '';
        
        // Render desktop navigation
        this.pages.forEach((page, index) => {
            if (this.desktopNavList) {
                const li = document.createElement('li');
                li.className = 'navbar__item';
                const button = this.createNavButton(page, index, false);
                li.appendChild(button);
                this.desktopNavList.appendChild(li);
            }
            
            if (this.mobileNavList) {
                const li = document.createElement('li');
                const button = this.createNavButton(page, index, true);
                li.appendChild(button);
                this.mobileNavList.appendChild(li);
            }
        });
        
        // Set initial active page
        this.setActivePage(0);
        this.updateLayout();
    }
    
    async setActivePage(index, clickedButton = null) {
        if (index < 0 || index >= this.pages.length) return;
        
        this.activeIndex = index;
        const page = this.pages[index];
        
        // Update content
        await this.updateContent(page);
        
        // Update active states
        this.updateActiveStates();
        
        // Add pop animation to clicked button
        if (clickedButton) {
            clickedButton.classList.remove('navbar__button--pop');
            // Force reflow to restart animation
            void clickedButton.offsetWidth;
            clickedButton.classList.add('navbar__button--pop');
        }
        
        this.updateLayout();
    }
    
    async updateContent(page) {
        if (!this.mainContent) return;
        
        if (page.type === 'file') {
            try {
                this.mainContent.innerHTML = '<div class="loading">Loading content</div>';
                const response = await fetch(page.content);
                
                if (response.ok) {
                    const html = await response.text();
                    // Extract body content if it's a full HTML document
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const bodyContent = doc.body.innerHTML || html;
                    
                    this.mainContent.innerHTML = `${bodyContent}`;

                    // After injecting content, run page-specific initializers
                    this.initializeInjectedPage(page);
                } else {
                    throw new Error(`Failed to load: ${response.status}`);
                }
            } catch (error) {
                console.error('Error loading page content:', error);
                this.mainContent.innerHTML = `
                    <h2>Welcome to ${page.name}</h2>
                    <p>Content could not be loaded at this time. Please try again later.</p>
                `;
            }
        } else {
            this.mainContent.innerHTML = `
                <h2>Welcome to ${page.name}</h2>
                <p>${page.content}</p>
            `;
        }
    }
    
    updateActiveStates() {
        const allButtons = document.querySelectorAll('.navbar__button');
        const allItems = document.querySelectorAll('.navbar__item');
        
        allButtons.forEach((button, index) => {
            const buttonIndex = parseInt(button.dataset.index);
            const isActive = buttonIndex === this.activeIndex;
            
            button.classList.toggle('navbar__button--active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
            
            if (isActive) {
                button.setAttribute('aria-current', 'page');
            } else {
                button.removeAttribute('aria-current');
            }
        });
        
        // Apply sliding animation to navigation items
        this.applySlidingAnimation();
    }
    
    applySlidingAnimation() {
        const items = Array.from(document.querySelectorAll('.navbar__item'));
        const buttons = Array.from(document.querySelectorAll('.navbar__button'));
        if (!items.length) return;
        
        // Measure active button width to set spacing dynamically
        const activeButton = buttons[this.activeIndex];
        const activeWidth = activeButton ? activeButton.getBoundingClientRect().width : 0;
        const baseGap = 14; // base visual spacing in px between items
        const separation = Math.max(16, Math.min(36, Math.round(activeWidth * 0.25)));
        
        const activeCfg = this.pages[this.activeIndex] || {};
        const rightGapExtra = activeCfg.rightGapExtra || 0;       // extra space on active's right side
        const neighborRightExtra = activeCfg.neighborRightExtra || 0; // extra space applied to the immediate right neighbor's left side
        
        items.forEach((item, idx) => {
            // clear inline CSS vars first
            item.style.removeProperty('--shift');
            item.style.removeProperty('--scale');
            item.style.removeProperty('--extra-left');
            item.style.removeProperty('--extra-right');
            
            item.classList.remove('navbar__item--slide-left', 'navbar__item--slide-right', 'navbar__item--active');
            
            if (idx === this.activeIndex) {
                item.classList.add('navbar__item--active');
                // give the active item a touch more presence
                item.style.setProperty('--scale', '1.06');
                // pull neighbors away by adding extra margins to both sides
                item.style.setProperty('--extra-left', `${separation / 2}px`);
                item.style.setProperty('--extra-right', `${(separation / 2) + rightGapExtra}px`);
            } else if (idx < this.activeIndex) {
                item.classList.add('navbar__item--slide-left');
                item.style.setProperty('--shift', `${-separation}px`);
                // ensure consistent spacing on the side away from the active
                item.style.setProperty('--extra-right', `${baseGap}px`);
            } else {
                item.classList.add('navbar__item--slide-right');
                item.style.setProperty('--shift', `${separation}px`);
                // if active defines extra spacing to the right, add it to the immediate right neighbor
                const extraLeft = (idx === this.activeIndex + 1) ? (baseGap + neighborRightExtra) : baseGap;
                item.style.setProperty('--extra-left', `${extraLeft}px`);
            }
        });
    }
    
    updateLayout() {
        // Update main content margin to account for navbar height
        if (this.navbar && this.mainContent) {
            const navbarHeight = this.navbar.offsetHeight;
            this.mainContent.style.marginTop = `${navbarHeight + 16}px`;
            this.mainContent.style.minHeight = `${Math.max(0, window.innerHeight - navbarHeight - 16)}px`;
        }
        
        // Update chip underline widths for desktop navigation
        this.updateChipWidths();
        
        // Position marquee overlay
        this.positionMarqueeOverlay();
    }
    
    updateChipWidths() {
        const buttons = document.querySelectorAll('.navbar__button:not(.mobile-menu__button)');
        buttons.forEach((button, index) => {
            const page = this.pages[index];
            if (page && page.chipCount) {
                const chipWidth = page.chipCount * this.CHIP_SIZE;
                button.style.setProperty('--chip-width', `${chipWidth}px`);
            }
        });
    }
    
    positionMarqueeOverlay(secondPass = false) {
        if (!this.marqueeOverlay) return;
        
        // Check if marquee image is available
        const computedStyle = getComputedStyle(this.marqueeOverlay);
        if (!computedStyle.backgroundImage || computedStyle.backgroundImage === 'none') {
            this.marqueeOverlay.style.display = 'none';
            return;
        }
        
        const desktopNav = document.querySelector('.navbar__nav');
        const activeButton = document.querySelector('.navbar__button--active:not(.mobile-menu__button)');
        const isDesktopNavHidden = desktopNav && getComputedStyle(desktopNav).display === 'none';
        
        if (!activeButton || !this.navbar || isDesktopNavHidden) {
            this.marqueeOverlay.style.display = 'none';
            return;
        }
        
        const navRect = this.navbar.getBoundingClientRect();
        const item = activeButton.closest('.navbar__item');
        const itemRect = (item || activeButton).getBoundingClientRect();
        const buttonRect = activeButton.getBoundingClientRect();
        
        const rootStyle = getComputedStyle(document.documentElement);
        const padRaw = rootStyle.getPropertyValue('--marquee-pad').trim();
        const PAD = padRaw.endsWith('px') ? parseFloat(padRaw) : parseFloat(padRaw) || 40;
        
        // Center overlay on the list item section (stable regardless of nav direction)
        const centerX = itemRect.left - navRect.left + itemRect.width / 2;
        const centerY = itemRect.top - navRect.top + itemRect.height / 2;
        const w = Math.ceil(buttonRect.width + PAD * 2);
        const h = Math.ceil(buttonRect.height + PAD * 2);
        const x = Math.round(centerX - w / 2);
        const y = Math.round(centerY - h / 2);
        
        this.marqueeOverlay.style.left = `${x}px`;
        this.marqueeOverlay.style.top = `${y}px`;
        this.marqueeOverlay.style.width = `${w}px`;
        this.marqueeOverlay.style.height = `${h}px`;
        this.marqueeOverlay.style.display = 'block';
        
        // Recalculate once after transforms settle to avoid drift during animations
        if (!secondPass) {
            requestAnimationFrame(() => this.positionMarqueeOverlay(true));
        }
    }
    
    toggleMobileMenu() {
        this.isMobileMenuOpen ? this.closeMobileMenu() : this.openMobileMenu();
    }
    
    openMobileMenu() {
        this.isMobileMenuOpen = true;
        this.mobileMenu?.classList.add('mobile-menu--open');
        this.backdrop?.classList.add('backdrop--visible');
        this.mobileMenuToggle?.setAttribute('aria-expanded', 'true');
        this.mobileMenu?.setAttribute('aria-hidden', 'false');
    }
    
    closeMobileMenu() {
        this.isMobileMenuOpen = false;
        this.mobileMenu?.classList.remove('mobile-menu--open');
        this.backdrop?.classList.remove('backdrop--visible');
        this.mobileMenuToggle?.setAttribute('aria-expanded', 'false');
        this.mobileMenu?.setAttribute('aria-hidden', 'true');
    }

    // Initialize any interactive components inside injected pages
    initializeInjectedPage(page) {
        // Home page gallery init
        if (page.content === 'pages/home.html') {
            const scope = this.mainContent;
            const stage = scope?.querySelector('#galleryStage');
            const titleEl = scope?.querySelector('#galleryTitle');
            const descEl = scope?.querySelector('#galleryDesc');
            const openBtn = scope?.querySelector('#galleryOpen');
            const prevBtn = scope?.querySelector('.gallery-arrow.left');
            const nextBtn = scope?.querySelector('.gallery-arrow.right');
            if (!stage || !titleEl || !descEl || !openBtn || !prevBtn || !nextBtn) return;

            // Make the gallery smaller
            stage.style.width = 'min(560px, 92vw)';
            const card = scope.querySelector('.gallery-card');
            if (card) card.style.width = 'min(560px, 92vw)';

            const items = [
                { type: 'image', src: '/media/graphics/HellHust-Flyer(1).png', link: 'pages/gameplay.html', title: 'Gameplay', desc: 'See the core loop and flow.' },
                { type: 'image', src: '/media/graphics/SignForHH.png', link: 'pages/contact.html', title: 'Contact Us', desc: 'Reach out to the team.' },
            ];

            let current = 0;
            let currentEl = null;
            let autoTimer = null;
            const AUTO_MS = 6000;
            const DURATION_MS = 1200;

            const buildEl = (item) => {
                let el;
                if (item.type === 'video') {
                    const v = document.createElement('video');
                    v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
                    v.setAttribute('playsinline','');
                    const s = document.createElement('source');
                    s.src = item.src;
                    if (s.src.endsWith('.mp4')) s.type = 'video/mp4';
                    v.appendChild(s);
                    el = v;
                } else {
                    const img = document.createElement('img');
                    img.src = item.src;
                    img.alt = item.title || 'image';
                    el = img;
                }
                el.className = 'media';
                el.style.position = 'absolute';
                el.style.left = '0';
                el.style.top = '0';
                el.style.width = '100%';
                el.style.height = '100%';
                el.style.transform = 'translateX(100%)';
                el.style.transition = `transform ${DURATION_MS}ms ease`;
                return el;
            };

            const updateMeta = (idx) => {
                const item = items[idx];
                titleEl.textContent = item.title || '';
                descEl.textContent = item.desc || '';
                stage.dataset.link = item.link || '';
            };

            const show = (idx, dir = 1) => {
                const nextItem = items[idx];
                const nextEl = buildEl(nextItem);
                if (currentEl) {
                    currentEl.style.transition = `transform ${DURATION_MS}ms ease`;
                }
                stage.insertBefore(nextEl, nextBtn);
                void nextEl.offsetWidth; // force reflow
                nextEl.style.transform = 'translateX(0)';
                if (currentEl) currentEl.style.transform = dir > 0 ? 'translateX(-100%)' : 'translateX(100%)';
                const prevEl = currentEl;
                const cleanup = () => { if (prevEl && prevEl.parentNode) prevEl.parentNode.removeChild(prevEl); };
                if (prevEl) {
                    prevEl.addEventListener('transitionend', function handler() {
                        prevEl.removeEventListener('transitionend', handler);
                        cleanup();
                    });
                }
                currentEl = nextEl;
                current = idx;
                updateMeta(current);
            };

            const openCurrent = () => {
                const item = items[current];
                if (!item || !item.link) return;
                const target = this.pages.findIndex(p => p.content === item.link);
                if (target >= 0) { this.setActivePage(target); } else { window.location.href = item.link; }
            };

            const next = (e) => { if (e) e.stopPropagation(); show((current + 1) % items.length, +1); resetAuto(); };
            const prev = (e) => { if (e) e.stopPropagation(); show((current - 1 + items.length) % items.length, -1); resetAuto(); };

            const startAuto = () => { stopAuto(); autoTimer = setInterval(() => next(), AUTO_MS); };
            const stopAuto = () => { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } };
            const resetAuto = () => { startAuto(); };

            stage.addEventListener('click', openCurrent);
            stage.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCurrent(); } });
            stage.addEventListener('mouseenter', stopAuto);
            stage.addEventListener('mouseleave', startAuto);
            openBtn.addEventListener('click', openCurrent);
            nextBtn.addEventListener('click', next);
            prevBtn.addEventListener('click', prev);

            stage.style.overflow = 'hidden';
            show(0, +1);
            startAuto();
        }
    }

}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.navigationManager = new NavigationManager();
});