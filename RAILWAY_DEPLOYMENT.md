# 🚂 Railway Deployment Guide

This guide will help you deploy your Electrical Management System to Railway instead of Netlify, Render, and Vercel.

## 🎯 Why Railway?

- **Full-stack support**: Perfect for Node.js + frontend applications
- **Automatic deployments**: Deploys on every git push
- **Built-in database support**: Can use PostgreSQL if needed
- **Custom domains**: Easy domain management
- **Environment variables**: Secure configuration management
- **Auto-scaling**: Handles traffic spikes automatically

## 📋 Prerequisites

1. **GitHub account** with your project repository
2. **Railway account** (sign up at [railway.app](https://railway.app))
3. **Node.js** installed locally (for testing)

## 🚀 Deployment Steps

### Step 1: Prepare Your Repository

Your repository is now configured for Railway deployment with:
- ✅ `server.js` - Unified server (backend + frontend)
- ✅ `package.json` - Root-level dependencies
- ✅ `railway.json` - Railway configuration
- ✅ `railway.env` - Environment variables template

### Step 2: Connect to Railway

1. **Go to [railway.app](https://railway.app)** and sign in
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your repository** (`Electrical-3`)
5. **Railway will automatically detect** it's a Node.js project

### Step 3: Configure Environment Variables

In your Railway project dashboard:

1. **Go to Variables tab**
2. **Add these environment variables**:

```bash
NODE_ENV=production
PORT=8080
DB_TYPE=sqlite
DB_PATH=./Backend/electrical_management.db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
BCRYPT_ROUNDS=10
TOKEN_EXPIRY=24h
RESET_TOKEN_EXPIRY=15m
```

3. **For email functionality** (optional):
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Step 4: Deploy

1. **Railway will automatically deploy** when you push to your main branch
2. **Monitor the deployment** in the Railway dashboard
3. **Check the logs** for any errors

### Step 5: Get Your Domain

1. **Go to Settings tab** in your Railway project
2. **Copy the generated domain** (e.g., `https://electrical-3-production.up.railway.app`)
3. **Update your frontend config** if needed

## 🔧 Local Testing

Before deploying, test locally:

```bash
# Install dependencies
npm install

# Start the server
npm start

# Test endpoints
curl http://localhost:8080/health
curl http://localhost:8080/api/test
```

## 📱 Frontend Configuration

Your frontend automatically detects Railway deployment and uses the correct API endpoints. The configuration priority is:

1. **Railway** (highest priority)
2. **Netlify**
3. **Render**
4. **Vercel**
5. **Development** (localhost)

## 🗄️ Database

- **SQLite**: Used by default (file-based, good for development)
- **PostgreSQL**: Can be added later for production scaling
- **Data persistence**: Railway provides persistent storage

## 🔐 Authentication

Default admin user (if not exists):
- **Staff ID**: `admin`
- **Password**: `admin123`

## 📊 Health Check

Railway monitors your app at:
- **Endpoint**: `/health`
- **Expected response**: `{"status":"UP","database":"SQLite","platform":"Railway"}`

## 🚨 Troubleshooting

### Common Issues:

1. **Build fails**: Check `package.json` scripts and dependencies
2. **Port binding**: Ensure `PORT` environment variable is set
3. **Database errors**: Verify `DB_PATH` points to correct location
4. **CORS issues**: Check allowed origins in server configuration

### Debug Commands:

```bash
# Check Railway logs
railway logs

# SSH into Railway instance
railway shell

# Check environment variables
railway variables
```

## 🔄 Updating Your App

1. **Make changes** to your code
2. **Commit and push** to GitHub
3. **Railway automatically redeploys**
4. **Monitor deployment** in Railway dashboard

## 🌐 Custom Domain (Optional)

1. **Go to Settings** in Railway project
2. **Click "Custom Domains"**
3. **Add your domain** (e.g., `app.yourcompany.com`)
4. **Update DNS records** as instructed

## 💰 Pricing

- **Free tier**: $5/month credit
- **Pay-as-you-use**: Only pay for what you use
- **No hidden fees**: Transparent pricing

## 📞 Support

- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Community**: [discord.gg/railway](https://discord.gg/railway)
- **GitHub Issues**: For code-specific problems

## 🎉 Success!

Once deployed, your app will be available at:
`https://electrical-3-production.up.railway.app`

Your frontend will automatically connect to the Railway backend, and you'll have a fully functional Electrical Management System running in the cloud!

---

**Next Steps:**
1. Push your changes to GitHub
2. Connect your repo to Railway
3. Deploy and test
4. Share your live app URL! 🚀
