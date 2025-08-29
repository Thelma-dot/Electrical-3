# Electrical Management System - Setup Guide

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- SQLite3 (included with Node.js)

## Installation & Setup

### 1. Backend Setup
```bash
cd Backend
npm install
```

### 2. Environment Configuration
Copy `config.env.example` to `config.env` and update the values:
```bash
cp config.env.example config.env
```

Edit `config.env` with your settings:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://127.0.0.1:5500
JWT_SECRET=your_super_secret_jwt_key_here
```

### 3. Database Setup
The database will be automatically created when you start the server:
```bash
npm start
```

### 4. Frontend Setup
The frontend is static HTML/CSS/JS and can be served using any static file server.

**Option 1: Using Live Server (VS Code Extension)**
- Install Live Server extension
- Right-click on `Frontend/index.html` and select "Open with Live Server"

**Option 2: Using Python**
```bash
cd Frontend
python -m http.server 5500
```

**Option 3: Using Node.js http-server**
```bash
npm install -g http-server
cd Frontend
http-server -p 5500
```

## Running the Project

### Start Backend
```bash
cd Backend
npm start
```

### Start Frontend
Open `Frontend/index.html` in your browser or use a static file server.

## Default Users
The system comes with demo users:
- Staff ID: `h2412031`, Password: `password1`
- Staff ID: `h2402117`, Password: `password2`
- Staff ID: `h2402123`, Password: `password3`
- Staff ID: `h2402140`, Password: `password4`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/request-reset` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Reports
- `GET /api/reports` - Get user reports
- `POST /api/reports` - Create report
- `GET /api/reports/summary` - Get dashboard summary
- `GET /api/reports/chart-data` - Get chart data

### Inventory
- `GET /api/inventory` - Get inventory items
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

### Toolbox
- `GET /api/toolbox` - Get toolbox items
- `POST /api/toolbox` - Create toolbox item
- `POST /api/toolbox/form` - Submit toolbox form

### Settings
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update user settings

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the PORT in `config.env`
   - Kill the process using the port

2. **Database connection error**
   - Ensure SQLite3 is installed
   - Check file permissions in the Backend directory

3. **CORS errors**
   - Verify FRONTEND_URL in `config.env` matches your frontend URL
   - Check that the frontend is running on the correct port

4. **JWT errors**
   - Ensure JWT_SECRET is set in `config.env`
   - Check that the token is being sent in Authorization header

### Logs
Check the console output for detailed error messages and debugging information.

## Security Notes
- Change the default JWT_SECRET in production
- Use HTTPS in production
- Implement proper password policies
- Add rate limiting for production use
- Use environment variables for sensitive data
