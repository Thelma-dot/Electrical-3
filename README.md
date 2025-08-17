# Electrical Management System

A comprehensive web-based system for managing electrical equipment, tools, reports, and inventory.

## Features

- **User Authentication**: Secure login system with staff ID
- **Report Management**: Create and manage work reports
- **Inventory Management**: Track electrical equipment and supplies
- **Toolbox Management**: Manage tools and their assignments
- **Settings**: User preferences and system configuration
- **Password Reset**: Email-based password recovery

## Tech Stack

- **Backend**: Node.js, Express.js, SQLite
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database**: SQLite (for development), MySQL (for production)

## Quick Start

### Option 1: Using the Batch File (Windows)

1. Double-click `start-project.bat`
2. The system will automatically start both servers
3. Your browser will open to `http://localhost:5500`

### Option 2: Manual Setup

#### Prerequisites

- Node.js (v14 or higher)
- Python (for frontend server)

#### Backend Setup

```bash
cd Backend
npm install
npm start
```

#### Frontend Setup

```bash
cd Frontend
python -m http.server 5500
```

## Access URLs

- **Frontend**: http://localhost:5500
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## Database Setup

The system uses SQLite for development, which is automatically set up when you first run the backend. The database file will be created at `Backend/electrical_management.db`.

### For Production (MySQL)

1. Install MySQL
2. Update the `.env` file with your MySQL credentials
3. Run `node setup-db.js` to create the database schema

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/reset-password` - Password reset
- `GET /api/reports` - Get reports
- `POST /api/reports` - Create report
- `GET /api/inventory` - Get inventory
- `POST /api/inventory` - Add inventory item
- `GET /api/toolbox` - Get tools
- `POST /api/toolbox` - Add tool
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update settings

## Project Structure

```
Electrical_management_system-main/
├── Backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # API controllers
│   ├── middlewares/     # Express middlewares
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── Frontend/
│   ├── images/          # Static images
│   ├── *.html           # HTML pages
│   ├── *.css            # Stylesheets
│   └── script.js        # Main JavaScript file
└── start-project.bat    # Quick start script
```

## Troubleshooting

### Backend Issues

- Ensure Node.js is installed
- Check if port 5000 is available
- Verify all dependencies are installed with `npm install`

### Frontend Issues

- Ensure Python is installed
- Check if port 5500 is available
- Try using a different port: `python -m http.server 8000`

### Database Issues

- SQLite database is created automatically
- Check file permissions in the Backend directory
- For MySQL issues, verify connection settings in `.env`

## Development

To run in development mode with auto-reload:

```bash
cd Backend
npm install nodemon -g
npm run dev
```

## License

This project is licensed under the ISC License.

