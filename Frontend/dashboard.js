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
