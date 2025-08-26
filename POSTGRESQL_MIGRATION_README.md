# 🚀 SQLite to PostgreSQL Migration Guide

This guide will help you migrate your Electrical Management System from SQLite to PostgreSQL for Render deployment.

## 📋 Prerequisites

- Node.js 16+ installed
- PostgreSQL database (local or Render)
- Your existing SQLite database with data

## 🔧 Installation

### 1. Install PostgreSQL Dependencies

```bash
cd Backend
npm install pg
```

### 2. Environment Configuration

Update your `Backend/config.env` file:

```env
# Database Configuration
# Choose database type: 'sqlite' or 'postgresql'
DB_TYPE=sqlite

# SQLite Configuration (for local development)
DB_PATH=./electrical_management.db

# PostgreSQL Configuration (for Render production)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=electrical_management
DB_PASSWORD=password
DB_PORT=5432
```

## 🗄️ Database Setup

### Option 1: Local PostgreSQL Setup

1. **Install PostgreSQL locally**
2. **Create database:**
   ```sql
   CREATE DATABASE electrical_management;
   ```
3. **Update environment:**
   ```env
   DB_TYPE=postgresql
   DB_HOST=localhost
   DB_NAME=electrical_management
   DB_USER=postgres
   DB_PASSWORD=your_password
   ```

### Option 2: Render PostgreSQL Setup

1. **Create Render account** at [render.com](https://render.com)
2. **Create new project**
3. **Add PostgreSQL service**
4. **Get connection details** from Render dashboard
5. **Set environment variables** in Render

## 🔄 Migration Process

### 1. Test PostgreSQL Connection

```bash
npm run setup-postgresql
```

### 2. Run Migration

```bash
npm run migrate
```

This will:
- Extract all data from SQLite
- Create tables in PostgreSQL
- Migrate all data with proper data types
- Preserve relationships and constraints

### 3. Verify Migration

```bash
npm run db:switch
```

## 🚀 Render Deployment

### 1. Render Configuration

Your `render.yaml` is already configured with:
- Health check endpoint
- Restart policies
- Build configuration

### 2. Environment Variables in Render

Set these in your Render project:

```env
NODE_ENV=production
DB_TYPE=postgresql
DB_USER=postgres
DB_HOST=${PGHOST}
DB_NAME=${PGDATABASE}
DB_PASSWORD=${PGPASSWORD}
DB_PORT=${PGPORT}
JWT_SECRET=your_jwt_secret
FRONTEND_URL=your_frontend_url
```

### 3. Deploy to Render

```bash
# Deploy through Render dashboard
# No CLI required

# Deploy
# Deploy through Render dashboard
```

## 🔍 Testing

### 1. Health Check

```bash
curl https://your-render-app.onrender.com/health
```

### 2. Database Connection

```bash
curl https://your-render-app.onrender.com/api/test
```

## 📊 Database Schema Changes

| SQLite | PostgreSQL | Notes |
|--------|------------|-------|
| `INTEGER PRIMARY KEY AUTOINCREMENT` | `SERIAL PRIMARY KEY` | Auto-incrementing ID |
| `TEXT` | `VARCHAR(255)` | String with length limit |
| `DATETIME` | `TIMESTAMP` | Date and time |
| `BOOLEAN` | `BOOLEAN` | True/False values |
| `?` placeholders | `$1, $2, $3` | Parameterized queries |

## 🛠️ Available Scripts

```bash
# Setup SQLite (development)
npm run setup

# Setup PostgreSQL
npm run setup-postgresql

# Migrate from SQLite to PostgreSQL
npm run migrate

# Check current database
npm run db:switch

# Start development server
npm run dev

# Start production server
npm start
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check PostgreSQL service is running
   - Verify host, port, and credentials

2. **Permission Denied**
   - Ensure database user has proper permissions
   - Check database exists

3. **Migration Errors**
   - Verify SQLite database is accessible
   - Check PostgreSQL connection

### Debug Commands

```bash
# Test PostgreSQL connection
node -e "require('./config/database-postgresql').pool.query('SELECT NOW()').then(r => console.log(r.rows[0])).catch(console.error)"

# Check SQLite data
node -e "require('./config/database').all('SELECT COUNT(*) as count FROM users').then(r => console.log(r)).catch(console.error)"
```

## 📁 File Structure

```
Backend/
├── config/
│   ├── database.js              # SQLite configuration
│   ├── database-postgresql.js   # PostgreSQL configuration
│   ├── database-switcher.js    # Database selector
│   └── config.env              # Environment variables
├── migrate-to-postgresql.js    # Migration script
├── render.yaml               # Render configuration
└── package.json              # Updated scripts
```

## 🌟 Benefits of PostgreSQL

- **Scalability**: Better for production workloads
- **Concurrency**: Handles multiple connections efficiently
- **ACID Compliance**: Better data integrity
- **Advanced Features**: JSON support, full-text search, etc.
- **Render Integration**: Native support and automatic scaling

## 🔄 Switching Between Databases

### Development (SQLite)
```env
DB_TYPE=sqlite
```

### Production (PostgreSQL)
```env
DB_TYPE=postgresql
```

The application automatically detects and uses the appropriate database based on the `DB_TYPE` environment variable.

## 📞 Support

If you encounter issues:

1. Check the console logs for error messages
2. Verify environment variables are set correctly
3. Test database connections individually
4. Review the migration logs

## 🎯 Next Steps

After successful migration:

1. **Update frontend URLs** to point to Render
2. **Configure custom domain** if needed
3. **Set up monitoring** and alerts
4. **Configure backups** for PostgreSQL
5. **Test all functionality** in production environment

---

**Happy migrating! 🚀**
