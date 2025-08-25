module.exports = {
  // Production database configuration
  database: {
    // For production, you might want to use a cloud database
    // Example: PostgreSQL on Heroku, MySQL on Railway, etc.
    type: process.env.DB_TYPE || 'sqlite',
    sqlite: {
      database: process.env.DB_PATH || './electrical_management.db'
    },
    mysql: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    }
  },
  
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || '0.0.0.0'
  },
  
  // Security configuration
  security: {
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        ['https://your-app.herokuapp.com', 'https://your-app.vercel.app'],
      credentials: true
    },
    session: {
      secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }
  },
  
  // Email configuration (for password reset, notifications)
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@yourapp.com'
  }
};
