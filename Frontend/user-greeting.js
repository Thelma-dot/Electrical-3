// User Greeting Functionality
class UserGreeting {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.loadUserInfo();
        this.setupEventListeners();
        this.updateGreeting();
        this.updateSidebarGreeting();
    }

    loadUserInfo() {
        // Try to get user info from localStorage - check multiple possible keys
        let userInfo = localStorage.getItem('user') || localStorage.getItem('userInfo') || sessionStorage.getItem('userInfo');

        console.log('UserGreeting: loadUserInfo called');
        console.log('UserGreeting: localStorage user:', localStorage.getItem('user'));
        console.log('UserGreeting: localStorage userInfo:', localStorage.getItem('userInfo'));
        console.log('UserGreeting: sessionStorage userInfo:', sessionStorage.getItem('userInfo'));

        if (userInfo) {
            try {
                this.currentUser = JSON.parse(userInfo);
                console.log('UserGreeting: Successfully parsed user from storage:', this.currentUser);
            } catch (e) {
                console.warn('Failed to parse user info:', e);
            }
        } else {
            console.log('UserGreeting: No user data found in any storage location');
        }

        // If no user info, try to get from URL params or default
        if (!this.currentUser) {
            console.log('UserGreeting: No user found in storage, using default');
            this.currentUser = this.getDefaultUserInfo();
        }

        console.log('UserGreeting: Final currentUser:', this.currentUser);
    }

    getDefaultUserInfo() {
        // Get user info from URL parameters if available
        const urlParams = new URLSearchParams(window.location.search);
        const staffId = urlParams.get('staff_id') || 'Guest User';
        const role = urlParams.get('role') || 'guest';

        console.log('UserGreeting: Using default user info - staffId:', staffId, 'role:', role);

        return {
            staff_id: staffId,
            role: role,
            name: staffId,
            email: '',
            last_login: new Date().toISOString()
        };
    }

    setupEventListeners() {
        // Listen for user login/logout events
        window.addEventListener('userLogin', (e) => {
            this.currentUser = e.detail;
            this.updateGreeting();
            this.updateSidebarGreeting();
        });

        window.addEventListener('userLogout', () => {
            this.currentUser = null;
            this.updateGreeting();
            this.updateSidebarGreeting();
        });

        // Listen for profile updates
        window.addEventListener('profileUpdated', (e) => {
            this.currentUser = e.detail;
            this.updateGreeting();
            this.updateSidebarGreeting();
        });
    }

    updateGreeting() {
        const greetingElement = document.querySelector('.user-greeting');
        if (!greetingElement) return;

        if (this.currentUser) {
            this.displayUserGreeting(greetingElement);
        } else {
            this.displayDefaultGreeting(greetingElement);
        }
    }

    updateSidebarGreeting() {
        // Update sidebar greeting elements
        const sidebarGreeting = document.querySelector('#greeting');
        const roleSubtitle = document.querySelector('#roleSubtitle');
        
        console.log('UserGreeting: updateSidebarGreeting called');
        console.log('UserGreeting: Found greeting element:', !!sidebarGreeting);
        console.log('UserGreeting: Found roleSubtitle element:', !!roleSubtitle);
        console.log('UserGreeting: currentUser:', this.currentUser);

        if (sidebarGreeting && this.currentUser && typeof this.currentUser === 'object') {
            const name = this.currentUser.name || this.currentUser.staff_id || 'User';
            sidebarGreeting.textContent = `Hello, ${name}`;
            sidebarGreeting.style.color = '#3498db';
            sidebarGreeting.style.fontWeight = '600';
            console.log('UserGreeting: Updated greeting to:', `Hello, ${name}`);
        } else if (sidebarGreeting) {
            // Fallback if no user data
            sidebarGreeting.textContent = 'Hello, User';
            sidebarGreeting.style.color = '#3498db';
            sidebarGreeting.style.fontWeight = '600';
            console.log('UserGreeting: Using fallback greeting: Hello, User');
        }

        if (roleSubtitle && this.currentUser && typeof this.currentUser === 'object') {
            roleSubtitle.textContent = this.currentUser.role === 'admin' ? 'Admin' : 'Staff Member';
            roleSubtitle.style.color = '#6b7280';
            console.log('UserGreeting: Updated role subtitle to:', this.currentUser.role === 'admin' ? 'Admin' : 'Staff Member');
        } else if (roleSubtitle) {
            // Fallback if no user data
            roleSubtitle.textContent = 'Staff Member';
            roleSubtitle.style.color = '#6b7280';
            console.log('UserGreeting: Using fallback role subtitle: Staff Member');
        }
    }

    displayUserGreeting(element) {
        const timeOfDay = this.getTimeOfDay();
        const roleDisplay = this.currentUser.role === 'admin' ? 'Administrator' :
            this.currentUser.role === 'staff' ? 'Staff Member' :
                this.currentUser.role;

        element.innerHTML = `
            <h2>${timeOfDay}, ${this.currentUser.name || this.currentUser.staff_id}!</h2>
            <p>Welcome back to the Electrical Management System</p>
            <div class="user-info">
                <div class="user-avatar">
                    ${(this.currentUser.name || this.currentUser.staff_id).charAt(0).toUpperCase()}
                </div>
                <div class="user-details">
                    <div class="user-name">${this.currentUser.name || this.currentUser.staff_id}</div>
                    <div class="user-role">${roleDisplay}</div>
                </div>
                <span class="user-status online">Online</span>
            </div>
        `;
    }

    displayDefaultGreeting(element) {
        const timeOfDay = this.getTimeOfDay();
        element.innerHTML = `
            <h2>${timeOfDay}!</h2>
            <p>Welcome to the Electrical Management System</p>
            <div class="user-info">
                <div class="user-avatar">G</div>
                <div class="user-details">
                    <div class="user-name">Guest User</div>
                    <div class="user-role">Please log in</div>
                </div>
                <span class="user-status offline">Offline</span>
            </div>
        `;
    }

    getTimeOfDay() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        if (hour < 21) return 'Good Evening';
        return 'Good Night';
    }

    // Method to update user info (called after login)
    updateUserInfo(userInfo) {
        // Validate userInfo parameter
        if (userInfo && typeof userInfo === 'object') {
            this.currentUser = userInfo;
            this.updateGreeting();
            this.updateSidebarGreeting();

            // Store in localStorage for persistence - use 'user' key to match profile page
            localStorage.setItem('user', JSON.stringify(userInfo));
            console.log('UserGreeting: Updated user info and stored in localStorage:', userInfo);
        } else {
            console.warn('Invalid userInfo provided to updateUserInfo:', userInfo);
            this.currentUser = null;
            this.updateGreeting();
            this.updateSidebarGreeting();

            // Clear localStorage
            localStorage.removeItem('user');
            localStorage.removeItem('userInfo');
        }
    }

    // Method to get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Method to check if user is admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    // Method to check if user is logged in
    isLoggedIn() {
        return !!this.currentUser;
    }
}

// Initialize user greeting when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userGreeting = new UserGreeting();

    // Check if there's user data in localStorage and update greeting
    const userData = localStorage.getItem('user');
    if (userData && window.userGreeting) {
        try {
            const user = JSON.parse(userData);
            console.log('DOM loaded: Found user data in localStorage:', user);
            window.userGreeting.updateUserInfo(user);
        } catch (e) {
            console.warn('Failed to parse user data from localStorage:', e);
        }
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserGreeting;
}
