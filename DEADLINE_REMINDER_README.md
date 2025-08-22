# Task Deadline Reminder System

## Overview

The Task Deadline Reminder System has been completely redesigned to automatically integrate with the task assignment functionality. Instead of manually setting deadlines, the system now automatically displays countdown timers for all assigned tasks with due dates.

## Key Features

### 🔄 **Automatic Integration**
- **No Manual Setup Required**: Deadlines are automatically pulled from assigned tasks
- **Real-time Updates**: Reminders update automatically when tasks are assigned, updated, or completed
- **Smart Filtering**: Only shows active tasks (excludes completed/cancelled tasks)

### ⏰ **Intelligent Countdown System**
- **Live Countdown**: Real-time countdown for each task deadline
- **Priority-based Display**: Tasks are sorted by due date (earliest first)
- **Visual Status Indicators**:
  - 🟢 **Upcoming**: Tasks due in the future
  - 🟡 **Warning**: Tasks due within 48 hours
  - 🔴 **Urgent**: Tasks due within 24 hours
  - 🚨 **Overdue**: Tasks past their due date

### 🎨 **Enhanced User Interface**
- **Task Information**: Shows task title, priority, and due date
- **Priority Badges**: Color-coded priority indicators
- **Responsive Design**: Works on all screen sizes
- **Dark Mode Support**: Full dark mode compatibility

## How It Works

### 1. **Automatic Data Loading**
```javascript
// System automatically fetches user's assigned tasks
async function updateTaskDeadlineReminders() {
  const response = await fetch('/api/tasks/my', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const tasks = await response.json();
  displayTaskDeadlineReminders(tasks);
}
```

### 2. **Smart Task Filtering**
```javascript
// Only shows relevant tasks
const tasksWithDeadlines = tasks
  .filter(task => task.due_date && 
                  task.status !== 'completed' && 
                  task.status !== 'cancelled')
  .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
```

### 3. **Real-time Countdown Updates**
```javascript
// Updates every second for accurate countdown
function updateCountdown() {
  const timeDiff = deadlineDate - now;
  if (timeDiff <= 0) {
    countdownElement.innerHTML = '🚨 OVERDUE!';
    playAlertSound();
  } else {
    // Display countdown with appropriate styling
  }
}
```

## File Structure

### Frontend Files Modified
- **`Frontend/dashboard.html`**: Updated deadline reminder section
- **`Frontend/script.js`**: Complete rewrite of deadline reminder functions
- **`Frontend/dashboard-tasks.js`**: Integration with deadline reminders
- **`Frontend/dashboard.css`**: New styles for deadline display

### Backend Files
- **`Backend/models/Task.js`**: Task model with due_date support
- **`Backend/routes/tasks.js`**: API endpoints for task management

## API Endpoints

### Get User's Tasks
```
GET /api/tasks/my
Authorization: Bearer <token>
```

### Update Task Status
```
PUT /api/tasks/:id
Authorization: Bearer <token>
Body: { "status": "new_status" }
```

## Database Schema

### Tasks Table
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to INTEGER NOT NULL,
  assigned_by INTEGER NOT NULL,
  priority TEXT DEFAULT 'medium',
  due_date DATETIME,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
);
```

## User Experience

### For Regular Users
1. **Dashboard View**: See all upcoming deadlines at a glance
2. **Task Management**: Update task status directly from reminders
3. **Priority Awareness**: Visual indicators for urgent tasks
4. **Overdue Alerts**: Clear notifications for missed deadlines

### For Administrators
1. **Task Assignment**: Set due dates when assigning tasks
2. **Priority Management**: Assign appropriate priority levels
3. **Monitoring**: Track task completion and deadlines

## Testing the System

### 1. **Setup Demo Data**
```bash
cd Backend
node insertDemoTasks.js
```

### 2. **Login as Demo User**
- Staff ID: `h2412031` | Password: `password1`
- Staff ID: `h2402117` | Password: `password2`
- Staff ID: `h2402123` | Password: `password3`
- Staff ID: `h2402140` | Password: `password4`

### 3. **View Dashboard**
- Navigate to the dashboard
- Check the "Task Deadline Reminders" section
- Verify countdown timers are working
- Test with different task priorities and due dates

## Demo Tasks Included

1. **Complete Electrical Safety Inspection** (High Priority, Due: 2 days)
2. **Update Circuit Breaker Documentation** (Medium Priority, Due: 5 days)
3. **Emergency Response Training** (Urgent Priority, Due: 1 day)
4. **Monthly Equipment Maintenance** (Low Priority, Due: 7 days)
5. **Safety Protocol Review** (High Priority, Overdue: 1 day ago)

## Technical Implementation

### Real-time Updates
- **WebSocket Integration**: Immediate updates when tasks change
- **Periodic Refresh**: Fallback updates every 30-60 seconds
- **Event-driven**: Updates triggered by task status changes

### Performance Optimizations
- **Efficient Filtering**: Only processes relevant tasks
- **Smart Caching**: Avoids unnecessary API calls
- **Debounced Updates**: Prevents excessive refresh cycles

### Error Handling
- **Graceful Degradation**: System works even if some features fail
- **User Feedback**: Clear error messages and notifications
- **Fallback Mechanisms**: Multiple update strategies

## CSS Classes

### Deadline Items
- `.deadline-item`: Base styling for each deadline
- `.deadline-item.overdue`: Styling for overdue tasks
- `.deadline-item.upcoming`: Styling for upcoming tasks

### Countdown Styling
- `.countdown .urgent`: Red text for urgent deadlines
- `.countdown .warning`: Yellow text for warning deadlines
- `.countdown .overdue`: Bold red text for overdue tasks

### Priority Badges
- `.priority-badge`: Base priority styling
- `.priority-low`, `.priority-medium`, `.priority-high`, `.priority-urgent`: Priority-specific colors

## Browser Compatibility

- **Modern Browsers**: Full functionality
- **ES6+ Support**: Required for async/await and modern JavaScript
- **CSS Grid/Flexbox**: Required for responsive layout
- **WebSocket API**: Required for real-time updates

## Troubleshooting

### Common Issues

1. **Deadlines Not Showing**
   - Check if user has assigned tasks
   - Verify tasks have due_date values
   - Check browser console for errors

2. **Countdown Not Updating**
   - Refresh the page
   - Check if JavaScript is enabled
   - Verify real-time connection status

3. **Styling Issues**
   - Clear browser cache
   - Check CSS file loading
   - Verify dark mode compatibility

### Debug Mode
```javascript
// Enable debug logging
localStorage.setItem('debugDeadlines', 'true');
```

## Future Enhancements

### Planned Features
- **Email Notifications**: Send reminders via email
- **Push Notifications**: Browser push notifications
- **Calendar Integration**: Sync with external calendars
- **Custom Reminder Times**: User-configurable reminder intervals
- **Bulk Operations**: Manage multiple deadlines at once

### Performance Improvements
- **Virtual Scrolling**: Handle large numbers of tasks
- **Lazy Loading**: Load deadlines on demand
- **Service Worker**: Offline deadline tracking

## Conclusion

The new Task Deadline Reminder System provides a seamless, automated way for users to track their assigned task deadlines. By integrating directly with the task assignment system, it eliminates the need for manual deadline management while providing real-time updates and visual feedback for task priorities and urgency levels.

The system is designed to be user-friendly, performant, and maintainable, with comprehensive error handling and fallback mechanisms to ensure reliability in various deployment scenarios.
