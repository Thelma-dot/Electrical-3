// Test script for real-time updates
const io = require('socket.io-client');

// Test inventory updates
function testInventoryUpdates() {
    console.log('🧪 Testing Inventory Real-time Updates...');

    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
        console.log('✅ Connected to server');

        // Test inventory events
        socket.on('inventory:created', (data) => {
            console.log('📦 Inventory created event received:', data);
        });

        socket.on('inventory:updated', (data) => {
            console.log('📦 Inventory updated event received:', data);
        });

        socket.on('inventory:deleted', (data) => {
            console.log('📦 Inventory deleted event received:', data);
        });

        console.log('📡 Listening for inventory events...');
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
    });

    // Keep connection alive for testing
    setTimeout(() => {
        console.log('⏰ Test completed');
        socket.disconnect();
    }, 30000);
}

// Test toolbox updates
function testToolboxUpdates() {
    console.log('🧪 Testing Toolbox Real-time Updates...');

    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
        console.log('✅ Connected to server');

        // Test toolbox events
        socket.on('tool:created', (data) => {
            console.log('🛠️ Tool created event received:', data);
        });

        socket.on('tool:updated', (data) => {
            console.log('🛠️ Tool updated event received:', data);
        });

        socket.on('tool:deleted', (data) => {
            console.log('🛠️ Tool deleted event received:', data);
        });

        console.log('📡 Listening for toolbox events...');
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected from server');
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error);
    });

    // Keep connection alive for testing
    setTimeout(() => {
        console.log('⏰ Test completed');
        socket.disconnect();
    }, 30000);
}

// Run tests
if (process.argv.includes('--inventory')) {
    testInventoryUpdates();
} else if (process.argv.includes('--toolbox')) {
    testToolboxUpdates();
} else {
    console.log('Usage:');
    console.log('  node test-realtime.js --inventory  # Test inventory updates');
    console.log('  node test-realtime.js --toolbox    # Test toolbox updates');
}
