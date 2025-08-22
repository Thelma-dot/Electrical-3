# Real-Time Updates for Inventory and Toolbox Management

This document explains how real-time updates are implemented for both inventory and toolbox management systems, following the same pattern as the reports management system.

## Overview

The system uses Socket.IO to provide real-time updates when staff members create, update, or delete inventory items or toolbox forms. When these changes occur, the admin management pages automatically refresh to show the latest data, exactly like the reports management system.

## How It Works

### 1. Staff Action
When a staff member performs an action (create, update, delete) in the inventory or toolbox pages:
- The action is sent to the backend via API calls
- The backend processes the request and updates the database

### 2. Backend Event Emission
After successful database operations, the backend controllers emit Socket.IO events:
- `inventory:created` - When a new inventory item is created
- `inventory:updated` - When an inventory item is updated  
- `inventory:deleted` - When an inventory item is deleted
- `tool:created` - When a new toolbox form is created
- `tool:updated` - When a toolbox form is updated
- `tool:deleted` - When a toolbox form is deleted

### 3. Admin Page Updates
Admin pages are connected to Socket.IO and listen for these events:
- When an event is received, the page automatically refreshes its data
- The UI is updated with the latest information
- No manual refresh is needed

## Implementation Details

### Backend Architecture

#### Socket.IO Setup
- Socket.IO is configured in `Backend/server.js`
- The server exposes the Socket.IO instance via `app.locals.io` for use in controllers

#### Controllers
Both `inventoryController.js` and `toolboxController.js` emit events after successful operations:

```javascript
// Example from inventoryController.js
if (req.app.locals.io) {
  req.app.locals.io.emit('inventory:created', { inventoryId, userId });
}
```

#### Routes
The routes now use the controller functions instead of direct database calls:
- `Backend/routes/inventory.js` - Uses `inventoryController` functions
- `Backend/routes/toolbox.js` - Uses `toolboxController` functions

### Frontend Architecture

#### Socket.IO Integration
Both admin pages include Socket.IO client and establish connections:

```html
<script src="http://localhost:5000/socket.io/socket.io.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', () => {
        try {
            const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });
            
            // Listen for real-time updates
            socket.on('inventory:created', () => loadInventory());
            socket.on('inventory:updated', () => loadInventory());
            socket.on('inventory:deleted', () => loadInventory());
            
            // Initialize page
            loadInventory();
        } catch (e) { /* ignore */ }
    });
</script>
```

#### Event Handling
When events are received:
1. The corresponding data loading function is called (e.g., `loadInventory()`)
2. Fresh data is fetched from the server
3. The UI is updated with the latest information

## Testing Real-Time Updates

### Method 1: Manual Testing (Recommended)
1. **Start the backend server**: `node Backend/server.js`
2. **Open admin pages** in separate browser tabs:
   - `admin-inventory.html` - Inventory management
   - `admin-toolbox.html` - Toolbox management
3. **Open staff pages** in other tabs:
   - `inventory.html` - Staff inventory page
   - `tool_box.html` - Staff toolbox page
4. **Make changes** in staff pages (create, update, delete items)
5. **Watch admin pages** automatically refresh and show the changes

### Method 2: Using the Test Page
1. Open `test-realtime.html` in a browser
2. Verify connection status shows "Connected to server"
3. The page will log all Socket.IO events received

### Method 3: Backend Test Script
```bash
# Test inventory updates
node Backend/test-realtime.js --inventory

# Test toolbox updates  
node Backend/test-realtime.js --toolbox
```

## Live Status Indicator

Both admin pages show a live status badge that indicates:
- **LIVE** (green) - Connected to server and receiving real-time updates
- **OFFLINE** (red) - Disconnected from server, real-time updates disabled

## Troubleshooting

### Common Issues

1. **Socket.IO not loading**
   - Check if the backend server is running on port 5000
   - Verify the Socket.IO script URL in the HTML files
   - Check browser console for connection errors

2. **Events not being received**
   - Verify the backend is emitting events correctly
   - Check if CORS is properly configured
   - Ensure admin pages are listening for the correct event names

3. **Page not refreshing**
   - Ensure the `loadInventory()` or `loadToolbox()` functions are working
   - Check if the admin token is valid
   - Verify the API endpoints are accessible

4. **Database errors**
   - Check if the database schema matches the expected structure
   - Verify the user ID field references (`req.user.userId`)
   - Check database connection and permissions

### Debug Mode

Enable debug logging by:
1. Opening browser developer tools (F12)
2. Checking the Console tab for Socket.IO connection messages
3. Looking for event logs and any error messages

## Security Considerations

- Socket.IO events are emitted to all connected clients
- Admin authentication is handled separately via JWT tokens
- Real-time updates are informational only and don't bypass authentication
- User data is filtered by user ID to ensure privacy

## Performance Notes

- Each event triggers a full data refresh from the server
- Consider implementing partial updates for large datasets
- Socket.IO automatically handles reconnection on network issues
- Events are lightweight and don't impact performance significantly

## File Structure

```
Backend/
├── server.js              # Socket.IO server setup
├── controllers/
│   ├── inventoryController.js  # Emits inventory events
│   └── toolboxController.js    # Emits toolbox events
├── routes/
│   ├── inventory.js       # Uses inventory controller
│   └── toolbox.js         # Uses toolbox controller
└── models/
    ├── Inventory.js       # Database operations
    └── Toolbox.js         # Database operations

Frontend/
├── admin-inventory.html   # Admin inventory page with Socket.IO
├── admin-inventory.js     # Inventory management logic
├── admin-toolbox.html     # Admin toolbox page with Socket.IO
├── admin-toolbox.js       # Toolbox management logic
└── test-realtime.html     # Testing page for real-time updates
```

## Conclusion

The inventory and toolbox management systems now provide the same real-time experience as the reports management system. Staff updates are instantly reflected in admin panels, improving efficiency and ensuring all stakeholders have access to current information without manual intervention.
