module.exports = {
  // Vercel-specific database configuration
  database: {
    // For Vercel, we need to use external databases since SQLite won't work
    type: process.env.DB_TYPE || 'postgresql',
    
    // PostgreSQL configuration (recommended for Vercel)
    postgresql: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    },
    
    // MySQL configuration (alternative)
    mysql: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      ssl: process.env.NODE_ENV === 'production'
    }
  },
  
  // Vercel serverless configuration
  serverless: {
    // Vercel sets PORT automatically
    port: process.env.PORT || 3000,
    
    // Vercel functions timeout
    timeout: 30000, // 30 seconds
    
    // Environment detection
    isVercel: process.env.VERCEL === '1'
  },
  
  // Security configuration for Vercel
  security: {
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        ['https://*.vercel.app', 'http://localhost:3000'],
      credentials: true
    },
    session: {
      secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
      }
    }
  }
};
