// Real-time dashboard updates
class DashboardRealtime {
    constructor() {
        this.socket = null;
        this.userId = null;
        this.pollingInterval = null;
        this.isConnected = false;
        this.apiEndpoints = {
            dashboardStats: '/api/dashboard/stats'
        };
        this.init();
    }

    init() {
        this.getCurrentUser();
        this.setupWebSocket();
        this.setupPollingFallback();
        this.setupInventoryListeners(); // Add inventory update listeners
    }

    getCurrentUser() {
        const user = JSON.parse(localStorage.getItem('user'));
        this.userId = user ? user.id : null;
    }

    setupWebSocket() {
        try {
            // Try WebSocket connection
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('Connected to dashboard real-time updates');
                this.isConnected = true;
                this.stopPolling();
                
                // Join user-specific room
                if (this.userId) {
                    this.socket.emit('join_user_room', this.userId);
                }
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from dashboard updates');
                this.isConnected = false;
                this.startPolling();
            });

            this.socket.on('dashboard_update', (data) => {
                this.updateDashboardStats(data);
            });

        } catch (error) {
            console.error('WebSocket setup failed:', error);
            this.startPolling();
        }
    }

    setupPollingFallback() {
        // Start polling as fallback
        this.startPolling();
    }

    startPolling() {
        if (this.pollingInterval) return;
        
        this.pollingInterval = setInterval(() => {
            this.fetchDashboardStats();
        }, 5000); // Poll every 5 seconds
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    async fetchDashboardStats() {
        if (!this.userId) return;

        try {
            const response = await fetch(this.apiEndpoints.dashboardStats, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.ok) {
                const stats = await response.json();
                this.updateDashboardStats(stats);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        }
    }

    updateDashboardStats(stats) {
        // Update the stats cards
        const cards = document.querySelectorAll('.stats .card p');
        
        if (cards.length >= 4) {
            // Generate Report count
            cards[0].textContent = stats.generateReport || 0;
            
            // Inventory count
            cards[1].textContent = stats.inventory || 0;
            
            // In Progress count
            cards[2].textContent = stats.inProgress || 0;
            
            // Completed count
            cards[3].textContent = stats.completed || 0;
        }

        // Update charts if available
        this.updateCharts(stats);
    }

    updateCharts(stats) {
        // Update progress chart if it exists
        if (window.dashboardCharts && window.dashboardCharts.progressChart) {
            // Update chart data based on stats
            const chartData = [
                stats.generateReport || 0,
                stats.inventory || 0,
                stats.inProgress || 0,
                stats.completed || 0
            ];
            
            window.dashboardCharts.progressChart.data.datasets[0].data = chartData;
            window.dashboardCharts.progressChart.update();
        }
    }

    setupInventoryListeners() {
        // Listen for inventory updates from other components
        window.addEventListener('inventoryUpdate', (event) => {
            console.log('📦 Dashboard received inventory update:', event.detail);
            this.handleInventoryUpdate(event.detail);
        });

        // Listen for storage changes (cross-tab communication)
        window.addEventListener('storage', (event) => {
            if (event.key === 'inventoryUpdate') {
                try {
                    const updateData = JSON.parse(event.newValue);
                    console.log('📦 Dashboard received storage-based inventory update:', updateData);
                    this.handleInventoryUpdate(updateData);
                } catch (error) {
                    console.error('Error parsing storage update:', error);
                }
            }
        });
    }

    handleInventoryUpdate(updateData) {
        // Update inventory-related stats on the dashboard
        this.updateInventoryStats(updateData);
        
        // Flash the inventory stats to indicate update
        this.flashInventoryStats();
    }

    updateInventoryStats(updateData) {
        // Update inventory count if available
        const inventoryCountElement = document.querySelector('.stats .card:nth-child(1) p');
        if (inventoryCountElement && updateData.type === 'created') {
            const currentCount = parseInt(inventoryCountElement.textContent) || 0;
            inventoryCountElement.textContent = currentCount + 1;
        } else if (inventoryCountElement && updateData.type === 'deleted') {
            const currentCount = parseInt(inventoryCountElement.textContent) || 0;
            inventoryCountElement.textContent = Math.max(0, currentCount - 1);
        }
    }

    flashInventoryStats() {
        const inventoryCard = document.querySelector('.stats .card:nth-child(1)');
        if (inventoryCard) {
            inventoryCard.style.animation = 'flash 600ms ease';
            setTimeout(() => {
                inventoryCard.style.animation = '';
            }, 600);
        }
    }

    // Method to manually trigger update
    refresh() {
        this.fetchDashboardStats();
    }

    // Cleanup method
    destroy() {
        this.stopPolling();
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

// Initialize real-time dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        window.dashboardRealtime = new DashboardRealtime();
    }
});

// Export for use in other files
window.DashboardRealtime = DashboardRealtime;
