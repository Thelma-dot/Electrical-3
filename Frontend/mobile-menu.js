// Mobile Menu Functionality
// This file provides mobile menu functionality for all pages

class MobileMenu {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        // Create mobile menu toggle button
        this.createMobileMenuToggle();
        
        // Create mobile overlay
        this.createMobileOverlay();
        
        // Add event listeners
        this.addEventListeners();
        
        // Handle window resize
        this.handleResize();
        
        this.isInitialized = true;
    }

    createMobileMenuToggle() {
        // Check if toggle button already exists
        if (document.querySelector('.mobile-menu-toggle')) return;

        const toggleButton = document.createElement('button');
        toggleButton.className = 'mobile-menu-toggle';
        toggleButton.innerHTML = '☰';
        toggleButton.setAttribute('aria-label', 'Toggle mobile menu');
        document.body.appendChild(toggleButton);
    }

    createMobileOverlay() {
        // Check if overlay already exists
        if (document.querySelector('.mobile-overlay')) return;

        const overlay = document.createElement('div');
        overlay.className = 'mobile-overlay';
        overlay.setAttribute('aria-label', 'Mobile menu overlay');
        document.body.appendChild(overlay);
    }

    addEventListeners() {
        const toggleButton = document.querySelector('.mobile-menu-toggle');
        const overlay = document.querySelector('.mobile-overlay');
        const sidebar = document.querySelector('.sidebar');

        if (!toggleButton || !overlay || !sidebar) return;

        // Toggle menu
        toggleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMobileMenu();
        });

        // Close menu when clicking overlay
        overlay.addEventListener('click', () => {
            this.closeMobileMenu();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!sidebar.contains(e.target) && !toggleButton.contains(e.target)) {
                this.closeMobileMenu();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });

        // Handle sidebar link clicks (close menu on mobile)
        const sidebarLinks = sidebar.querySelectorAll('nav a');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    this.closeMobileMenu();
                }
            });
        });
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        
        if (!sidebar || !overlay) return;

        if (sidebar.classList.contains('mobile-open')) {
            this.closeMobileMenu();
        } else {
            this.openMobileMenu();
        }
    }

    openMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        
        if (!sidebar || !overlay) return;

        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        const firstLink = sidebar.querySelector('nav a');
        if (firstLink) {
            firstLink.focus();
        }
    }

    closeMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.mobile-overlay');
        
        if (!sidebar || !overlay) return;

        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Return focus to toggle button
        const toggleButton = document.querySelector('.mobile-menu-toggle');
        if (toggleButton) {
            toggleButton.focus();
        }
    }

    handleResize() {
        let resizeTimer;
        
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768) {
                    this.closeMobileMenu();
                }
            }, 250);
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                if (window.innerWidth > 768) {
                    this.closeMobileMenu();
                }
            }, 100);
        });
    }

    // Public method to check if menu is open
    isMenuOpen() {
        const sidebar = document.querySelector('.sidebar');
        return sidebar ? sidebar.classList.contains('mobile-open') : false;
    }

    // Public method to programmatically close menu
    close() {
        this.closeMobileMenu();
    }
}

// Initialize mobile menu when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize on pages with sidebar
    if (document.querySelector('.sidebar')) {
        window.mobileMenu = new MobileMenu();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileMenu;
}
