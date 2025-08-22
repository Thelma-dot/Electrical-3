# User Greeting System Documentation

## Overview
The User Greeting System provides personalized greetings for users after they log in and update their profile. It displays "Hello" followed by the user's name in various locations throughout the application.

## Features

### 1. **Personalized Greetings**
- Shows "Hello, [User Name]!" after login
- Updates automatically when profile is modified
- Displays in multiple locations for consistency

### 2. **Greeting Locations**
- **Dashboard Header**: Main greeting with "Welcome back!" subtitle
- **Sidebar**: Compact greeting below the logo
- **Profile Page**: Greeting above profile information
- **All User Pages**: Consistent greeting across the application

### 3. **Real-Time Updates**
- Automatically refreshes when profile is updated
- Maintains consistency across all pages
- Uses localStorage for performance

## Architecture

### Frontend Components
- **`user-greeting.js`**: Main JavaScript class handling all greeting functionality
- **`user-greeting.css`**: Styling for greeting elements
- **Integration**: Added to all user-facing pages

### Backend Components
- **`authController.js`**: Profile management endpoints
- **`authRoutes.js`**: API routes for profile operations
- **Database**: User profile storage and retrieval

## How It Works

### 1. **User Login Process**
```javascript
// When user logs in, user data is stored in localStorage
const userData = {
    staffId: data.user.staffid,
    fullName: data.user.fullName,
    email: data.user.email,
    phone: data.user.phone,
    role: data.user.role,
    createdAt: data.user.createdAt,
    lastLogin: new Date().toISOString()
};
localStorage.setItem('userData', JSON.stringify(userData));
```

### 2. **Greeting Display**
```javascript
// Dashboard header greeting
dashboardHeader.innerHTML = `
    <span class="welcome-text">Welcome back!</span>
    <span class="main-greeting">Hello, ${this.userData.fullName}!</span>
`;

// Sidebar greeting
greetingElement.innerHTML = `
    <div class="greeting-text">Hello!</div>
    <div class="user-name">${this.userData.fullName}</div>
`;
```

### 3. **Profile Updates**
```javascript
// When profile is updated, greeting automatically refreshes
async handleProfileUpdate() {
    // Update profile via API
    const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updateData)
    });
    
    // Update local data and refresh greeting
    this.userData = { ...this.userData, ...updateData };
    this.displayGreeting();
}
```

## API Endpoints

### GET `/api/auth/me`
- **Purpose**: Retrieve current user profile
- **Authentication**: Required (JWT token)
- **Response**: User profile data

### PUT `/api/auth/profile`
- **Purpose**: Update user profile
- **Authentication**: Required (JWT token)
- **Body**: `{ fullName, email, phone }`
- **Response**: Success message and updated user data

## File Structure

```
Frontend/
├── user-greeting.js          # Main greeting system
├── user-greeting.css         # Greeting styles
├── dashboard.html            # Dashboard with greeting
├── profile.html             # Profile page with greeting
├── generate_report.html     # Report page with greeting
├── inventory.html           # Inventory page with greeting
└── tool_box.html           # Toolbox page with greeting

Backend/
├── controllers/
│   └── authController.js    # Profile management
└── routes/
    └── authRoutes.js        # Profile API routes
```

## Implementation Details

### UserGreeting Class
```javascript
class UserGreeting {
    constructor() {
        this.userData = null;
        this.init();
    }
    
    // Initialize greeting system
    init() {
        this.checkUserLogin();
        this.setupProfileUpdateListeners();
    }
    
    // Display greetings in all locations
    displayGreeting() {
        this.updateDashboardGreeting();
        this.updateProfileGreeting();
        this.updatePageGreetings();
    }
}
```

### CSS Classes
- **`.user-greeting`**: Sidebar greeting container
- **`.dashboard-greeting`**: Dashboard header container
- **`.welcome-text`**: "Welcome back!" subtitle
- **`.main-greeting`**: Main "Hello, [Name]!" text
- **`.greeting-text`**: Sidebar "Hello!" text
- **`.user-name`**: Sidebar user name display

## Setup Instructions

### 1. **Include Scripts**
Add to all user-facing HTML files:
```html
<script src="./user-greeting.js"></script>
```

### 2. **Include Styles**
Add to main pages:
```html
<link rel="stylesheet" href="./user-greeting.css">
```

### 3. **Backend Setup**
Ensure profile endpoints are configured in `authRoutes.js`:
```javascript
router.get('/me', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);
```

## Usage Examples

### Manual Greeting Refresh
```javascript
// Refresh greeting manually
window.userGreeting.refreshGreeting();

// Get current user data
const userData = window.userGreeting.getUserData();
```

### Profile Update Event
```javascript
// Listen for profile updates
document.addEventListener('profileUpdated', () => {
    console.log('Profile was updated, greeting refreshed');
});
```

## Styling Customization

### Custom Greeting Colors
```css
.user-greeting {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.dashboard-greeting .main-greeting {
    color: #333;
    font-weight: 600;
}
```

### Animation Effects
```css
.user-greeting {
    animation: slideInGreeting 0.5s ease-out;
    transition: all 0.3s ease;
}

.user-greeting:hover {
    transform: translateY(-2px);
}
```

## Browser Compatibility

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **ES6 Features**: Uses modern JavaScript features
- **CSS Grid/Flexbox**: Responsive design support
- **LocalStorage**: Data persistence across sessions

## Performance Considerations

- **Caching**: User data stored in localStorage
- **Minimal API Calls**: Only fetches data when needed
- **Efficient Updates**: Only updates changed elements
- **Event Delegation**: Optimized event handling

## Security Features

- **JWT Authentication**: All profile operations require valid tokens
- **Input Validation**: Server-side validation of profile data
- **Data Sanitization**: Removes sensitive information before display
- **Role-Based Access**: Profile operations restricted to authenticated users

## Troubleshooting

### Common Issues

1. **Greeting Not Displaying**
   - Check if user is logged in
   - Verify localStorage has userData
   - Check browser console for errors

2. **Profile Updates Not Reflecting**
   - Ensure profile update API is working
   - Check if userData is being updated
   - Verify event listeners are properly set up

3. **Styling Issues**
   - Confirm CSS file is loaded
   - Check for CSS conflicts
   - Verify CSS classes are applied correctly

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('debugGreeting', 'true');

// Check user data
console.log('Current user data:', window.userGreeting.getUserData());
```

## Future Enhancements

1. **Multi-language Support**: Internationalized greetings
2. **Custom Greeting Messages**: User-defined greeting text
3. **Time-based Greetings**: "Good morning", "Good afternoon", etc.
4. **Avatar Integration**: User profile pictures in greetings
5. **Notification System**: Real-time greeting updates

## Conclusion

The User Greeting System provides a personalized and engaging user experience by displaying customized greetings throughout the application. It automatically updates when user profiles change and maintains consistency across all pages. The system is designed to be lightweight, secure, and easily customizable for future enhancements.
