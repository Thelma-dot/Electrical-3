# 🚀 Deploy Backend to Render

This guide will help you deploy your Electrical Management System backend to Render.

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Node.js Backend** - Your backend code should be ready

## 🚀 Quick Deployment Steps

### 1. Push Code to GitHub
```bash
git add .
git commit -m "Ready for Render deployment"
git push origin main
```

### 2. Connect to Render
1. Go to [render.com](https://render.com) and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository with your backend code

### 3. Configure the Service
- **Name**: `electrical-3-y99h`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: `Free` (or choose paid plan)

### 4. Environment Variables
Render will automatically set these from your `render.yaml`:
- `NODE_ENV`: `production`
- `PORT`: `10000`
- `JWT_SECRET`: Auto-generated
- `DB_TYPE`: `sqlite`
- `DB_PATH`: `./electrical_management.db`
- `CORS_ORIGIN`: Your Netlify frontend URL

### 5. Deploy
Click "Create Web Service" and Render will:
1. Build your application
2. Deploy it to their infrastructure
3. Give you a URL like: `https://electrical-management-system.onrender.com`

## 🔧 Manual Configuration (Alternative)

If you prefer manual setup:

### Environment Variables
```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-secret-key
DB_TYPE=sqlite
DB_PATH=./electrical_management.db
CORS_ORIGIN=https://your-netlify-app.netlify.app
```

### Build & Start Commands
- **Build Command**: `npm install`
- **Start Command**: `npm start`

## 🌐 Update Frontend

Your frontend is already configured to use the Render backend when deployed on Netlify. The config automatically detects the environment and uses the correct API URLs.

## 📊 Health Check

Your service includes a health check endpoint at `/health` that Render will use to monitor the service status.

## 🔄 Auto-Deploy

With `autoDeploy: true` in your `render.yaml`, every push to your main branch will automatically trigger a new deployment.

## 🚨 Important Notes

1. **Database**: SQLite files are ephemeral on Render. For production, consider using a persistent database service.
2. **Free Tier**: Free tier has limitations but is great for development and testing.
3. **CORS**: Make sure your Netlify frontend URL is correctly set in `CORS_ORIGIN`.

## 🆘 Troubleshooting

### Common Issues:
1. **Build Fails**: Check your `package.json` and dependencies
2. **Service Won't Start**: Verify your `startCommand` and `main` file
3. **CORS Errors**: Check the `CORS_ORIGIN` environment variable
4. **Database Issues**: Ensure SQLite file path is correct

### Logs:
- Check Render dashboard for build and runtime logs
- Use the logs tab to debug issues

## 🎉 Success!

Once deployed, your backend will be available at:
`https://electrical-3-y99h.onrender.com`

Your Netlify frontend will automatically connect to this backend!

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)
