# 🔌 Electrical Management System

A comprehensive electrical management system with real-time inventory tracking, toolbox management, and admin dashboard.

## ✨ Features

- **Real-time Inventory Management** - Live updates with Socket.IO
- **Toolbox System** - Equipment and tool tracking
- **Admin Dashboard** - Comprehensive management interface
- **User Authentication** - Secure login and role-based access
- **Reporting System** - Generate and export reports
- **Mobile Responsive** - Works on all devices
- **Real-time Notifications** - Instant updates and alerts

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git

### Local Development
```bash
# Clone the repository
git clone https://github.com/Thelma-dot/Electrical-3.git
cd Electrical-3

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Initialize database
npm run setup

# Start development server
npm run dev
```

### Production Deployment
```bash
# Install dependencies
npm ci --only=production

# Start production server
npm start
```

## 🐳 Docker Deployment

### Quick Start with Docker
```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build and run manually
docker build -t electrical-management .
docker run -p 5000:5000 electrical-management
```

### Docker Compose Services
- **App**: Main Node.js application
- **PostgreSQL**: Database (optional, uncomment in docker-compose.yml)
- **Redis**: Session storage (optional, uncomment in docker-compose.yml)

## ☁️ Cloud Deployment

### 1. Heroku (Recommended)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/Thelma-dot/Electrical-3)

```bash
# Manual deployment
heroku create your-app-name
heroku config:set NODE_ENV=production
git push heroku main
```

### 2. Render
1. Connect your GitHub repository
2. Render will auto-deploy on push
3. Set environment variables in dashboard

## 🔧 Configuration

### Environment Variables
```bash
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
DB_TYPE=sqlite
FRONTEND_URL=https://your-domain.com
```

### Database Options
- **SQLite**: Default and recommended (simple, file-based, no setup required)
- **PostgreSQL**: Alternative for production (requires additional setup)
- **MySQL**: Alternative production option (requires additional setup)

## 📁 Project Structure

```
Electrical-3/
├── Backend/                 # Node.js backend
│   ├── server.js           # Main server
│   ├── app.js              # Express app
│   ├── config/             # Configuration
│   ├── controllers/        # Route controllers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   └── middleware/         # Custom middleware
├── Frontend/               # Frontend assets
│   ├── *.html             # HTML pages
│   ├── *.css              # Stylesheets
│   ├── *.js               # JavaScript
│   └── images/            # Images
├── package.json            # Dependencies
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker services
└── README.md               # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Inventory
- `GET /api/inventory` - Get all inventory
- `POST /api/inventory` - Create inventory item
- `PUT /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item

### Toolbox
- `GET /api/toolbox` - Get all toolbox items
- `POST /api/toolbox` - Submit toolbox form
- `PUT /api/toolbox/:id` - Update toolbox item

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Generate report
- `GET /api/reports/:id` - Get specific report

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "inventory"
```

## 📊 Monitoring

### Health Check
- Endpoint: `/health`
- Returns application status and database connectivity

### Logging
- Application logs: `npm start`
- Docker logs: `docker-compose logs -f app`

## 🔒 Security

- JWT-based authentication
- Session management with express-session
- CORS protection
- Helmet.js security headers
- Input validation and sanitization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/Thelma-dot/Electrical-3/issues)
- **Documentation**: [Wiki](https://github.com/Thelma-dot/Electrical-3/wiki)
- **Email**: your-email@example.com

## 🙏 Acknowledgments

- Express.js team for the web framework
- Socket.IO for real-time capabilities
- SQLite for the database engine
- All contributors and users

---

**Made with ❤️ for electrical management professionals**

