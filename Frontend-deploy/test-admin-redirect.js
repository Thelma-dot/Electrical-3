// Test script to verify admin redirect functionality
// Run this in browser console after login to debug

function testAdminRedirect() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    if (!user || !token) {
        console.log('No user logged in');
        return;
    }
    
    console.log('Current user:', user);
    console.log('User role:', user.role);
    console.log('Expected redirect:', user.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html');
    
    // Test the redirect
    if (user.role === 'admin') {
        console.log('✅ Admin user - should redirect to admin-dashboard.html');
        // window.location.href = 'admin-dashboard.html';
    } else {
        console.log('✅ Regular user - should redirect to dashboard.html');
        // window.location.href = 'dashboard.html';
    }
}

// Run the test
testAdminRedirect();
