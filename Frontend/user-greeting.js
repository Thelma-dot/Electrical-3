// User Greeting System
// This file handles personalized greetings for users after login and profile updates

class UserGreeting {
    constructor() {
        this.userData = null;
        this.init();
    }

    init() {
        // Check if user is logged in
        this.checkUserLogin();

        // Set up event listeners for profile updates
        this.setupProfileUpdateListeners();
    }

    checkUserLogin() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('userData');

        if (token && userData) {
            try {
                this.userData = JSON.parse(userData);
                this.displayGreeting();
            } catch (error) {
                console.error('Error parsing user data:', error);
                this.fetchUserData();
            }
        } else {
            this.fetchUserData();
        }
    }

    async fetchUserData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(window.appConfig.getApiUrl() + '/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.userData = await response.json();
                localStorage.setItem('userData', JSON.stringify(this.userData));
                this.displayGreeting();
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }

    displayGreeting() {
        if (!this.userData) return;

        // Display greeting only in sidebar
        this.updateSidebarGreeting();

        // Display greeting in profile page
        this.updateProfileGreeting();

        // Display greeting in other pages
        this.updatePageGreetings();
    }

    updateDashboardGreeting() {
        // Remove greeting from dashboard header - greeting will only appear in sidebar
        const dashboardHeader = document.querySelector('.header h1');
        if (dashboardHeader) {
            // Keep the original "Dashboard" title without greeting
            dashboardHeader.textContent = 'Dashboard';
            dashboardHeader.className = '';
        }
    }

    updateProfileGreeting() {
        const greetingElement = document.getElementById('greeting');
        if (greetingElement && this.userData.fullName) {
            greetingElement.textContent = `Hello, ${this.userData.fullName}!`;
        }

        // Update profile information display
        this.updateProfileDisplay();
    }

    updateProfileDisplay() {
        if (!this.userData) return;

        // Update profile fields
        const staffIdElement = document.getElementById('displayStaffIdText');
        const nameElement = document.getElementById('displayNameText');
        const emailElement = document.getElementById('displayEmailText');
        const phoneElement = document.getElementById('displayPhoneText');
        const createdElement = document.getElementById('displayCreatedText');
        const lastLoginElement = document.getElementById('displayLastLoginText');

        if (staffIdElement) staffIdElement.textContent = this.userData.staffId || 'Not set';
        if (nameElement) nameElement.textContent = this.userData.fullName || 'Not set';
        if (emailElement) emailElement.textContent = this.userData.email || 'Not set';
        if (phoneElement) phoneElement.textContent = this.userData.phone || 'Not set';
        if (createdElement) createdElement.textContent = this.formatDate(this.userData.createdAt);
        if (lastLoginElement) lastLoginElement.textContent = this.formatDate(this.userData.lastLogin);
    }

    updatePageGreetings() {
        // Always add greeting to sidebar if available (for all pages)
        this.updateSidebarGreeting();

        // Update profile page greeting if on profile page
        if (document.title.includes('Profile')) {
            this.updateProfileGreeting();
        }
    }

    updateSidebarGreeting() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && this.userData && this.userData.fullName) {
            try {
                // Check if greeting already exists
                let greetingElement = sidebar.querySelector('.user-greeting');

                if (!greetingElement) {
                    greetingElement = document.createElement('div');
                    greetingElement.className = 'user-greeting';

                    // For admin pages, insert after the logo in sidebar-header
                    const sidebarHeader = sidebar.querySelector('.sidebar-header');
                    const logo = sidebar.querySelector('.avatar');

                    if (sidebarHeader && logo) {
                        // Insert the greeting after the logo but still within the sidebar-header
                        sidebarHeader.appendChild(greetingElement);
                    } else {
                        // Fallback: insert after logo/avatar - check for both .avatar and .logo classes
                        const logoOrAvatar = sidebar.querySelector('.avatar') || sidebar.querySelector('.logo');
                        if (logoOrAvatar) {
                            logoOrAvatar.parentNode.insertBefore(greetingElement, logoOrAvatar.nextSibling);
                        } else {
                            // If no logo/avatar, insert at the beginning of sidebar
                            sidebar.insertBefore(greetingElement, sidebar.firstChild);
                        }
                    }
                }

                greetingElement.innerHTML = `
                    <div class="greeting-text">Hello!</div>
                    <div class="user-name">${this.userData.fullName}</div>
                `;

                // Ensure the greeting is visible
                greetingElement.style.display = 'block';

                console.log('Greeting added to sidebar successfully');
            } catch (error) {
                console.error('Error adding greeting to sidebar:', error);
            }
        } else {
            console.log('Sidebar greeting not added:', {
                hasSidebar: !!sidebar,
                hasUserData: !!this.userData,
                hasFullName: !!(this.userData && this.userData.fullName)
            });
        }
    }

    setupProfileUpdateListeners() {
        // Listen for profile update events
        document.addEventListener('profileUpdated', () => {
            this.fetchUserData();
        });

        // Listen for form submissions in profile edit modal
        const editForm = document.getElementById('editProfileForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileUpdate();
            });
        }
    }

    async handleProfileUpdate() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const formData = new FormData(document.getElementById('editProfileForm'));
            const updateData = {
                fullName: formData.get('fullName'),
                email: formData.get('email'),
                phone: formData.get('phone')
            };

            const response = await fetch(window.appConfig.getApiUrl() + '/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                // Update local user data
                this.userData = { ...this.userData, ...updateData };
                localStorage.setItem('userData', JSON.stringify(this.userData));

                // Refresh greeting display
                this.displayGreeting();

                // Show success message
                alert('Profile updated successfully!');

                // Close modal
                this.closeEditProfileModal();

                // Dispatch custom event
                document.dispatchEvent(new CustomEvent('profileUpdated'));
            } else {
                throw new Error('Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile. Please try again.');
        }
    }

    closeEditProfileModal() {
        const modal = document.getElementById('editProfileModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    formatDate(dateString) {
        if (!dateString) return 'Not available';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return dateString;
        }
    }

    // Public method to refresh greeting
    refreshGreeting() {
        this.fetchUserData();
    }

    // Public method to get current user data
    getUserData() {
        return this.userData;
    }
}

// Initialize user greeting system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userGreeting = new UserGreeting();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UserGreeting;
}
