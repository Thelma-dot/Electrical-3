# Toolbox Safety Form System

## Overview
This system allows staff members to submit toolbox safety forms that are automatically saved to the database and displayed in real-time on the admin dashboard.

## How It Works

### 1. Staff Submission (`tool_box.html`)
- Staff members fill out the toolbox safety form with required information
- Form includes: work activity, date, location, personnel details, tools used, hazards, etc.
- Data is submitted to the backend API endpoint `/api/toolbox`
- Form is reset and success message is displayed after successful submission

### 2. Backend Processing
- **Controller**: `Backend/controllers/toolboxController.js`
  - Handles form creation, updates, and deletion
  - Emits real-time events for admin dashboard updates
- **Model**: `Backend/models/Toolbox.js`
  - Manages database operations using SQLite
  - Supports CRUD operations for toolbox forms
- **Database**: SQLite table `toolbox` with fields matching the form structure

### 3. Admin Dashboard (`admin-toolbox.html`)
- Real-time display of all submitted toolbox forms
- Search and filter functionality
- Detailed view of each form
- Export to CSV functionality
- Statistics dashboard showing form counts by time periods

## Database Schema

The `toolbox` table includes:
- `id` - Primary key
- `user_id` - Foreign key to users table
- `work_activity` - Description of work being performed
- `date` - Date of work
- `work_location` - Location where work is performed
- `name_company` - Name/company of personnel
- `sign` - Signature field
- `ppe_no` - Personal Protective Equipment number
- `tools_used` - Tools and equipment used
- `hazards` - Identified hazards and preventive actions
- `circulars` - Recent circulars or safety alerts
- `risk_assessment` - Risk assessment reference number
- `permit` - Permit to work reference number
- `remarks` - Additional remarks
- `prepared_by` - Name and signature of preparer
- `verified_by` - Name and signature of duty officer
- `created_at` - Timestamp of form creation

## API Endpoints

### Staff Endpoints (require authentication)
- `POST /api/toolbox` - Create new toolbox form
- `GET /api/toolbox` - Get user's toolbox forms
- `PUT /api/toolbox/:id` - Update toolbox form
- `DELETE /api/toolbox/:id` - Delete toolbox form

### Admin Endpoints (require admin authentication)
- `GET /api/admin/toolbox` - Get all toolbox forms for admin dashboard

## Real-time Updates

The system uses Socket.IO to provide real-time updates:
- When a staff member submits a form, admin dashboard is automatically updated
- No need to refresh the page to see new submissions
- Events: `tool:created`, `tool:updated`, `tool:deleted`

## Features

### Staff Features
- Comprehensive safety form with all required fields
- Form validation and error handling
- Success/error message display
- Automatic form reset after submission
- Today's date pre-filled

### Admin Features
- Real-time dashboard with all submitted forms
- Search and filter capabilities
- Detailed view of each form
- Export functionality (CSV)
- Statistics and analytics
- User management integration

## Security

- JWT authentication required for all endpoints
- Admin-only access to admin dashboard
- Users can only view/edit their own forms
- Input validation and sanitization

## Usage Instructions

### For Staff
1. Navigate to the Toolbox page
2. Fill out all required fields
3. Click Submit
4. Form will be saved and admin will be notified

### For Admins
1. Navigate to Admin Dashboard > Toolbox Management
2. View all submitted forms in real-time
3. Use search and filter to find specific forms
4. Click on forms to view details
5. Export data as needed

## Technical Notes

- Built with Node.js, Express, and SQLite
- Frontend uses vanilla JavaScript with modern ES6+ features
- Responsive design for mobile and desktop
- Real-time updates via Socket.IO
- RESTful API design
- Error handling and user feedback throughout
