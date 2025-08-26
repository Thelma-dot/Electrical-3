# 🗄️ SQLite Setup Guide

## 🎯 **Why SQLite?**

SQLite is perfect for your Electrical Management System because:
- ✅ **No installation required** - Built into Node.js
- ✅ **File-based** - Your data is stored in a single file
- ✅ **Zero configuration** - Works out of the box
- ✅ **Reliable** - Used by millions of applications
- ✅ **Perfect for development and production**

## 🚀 **Quick Setup (2 minutes)**

### **Step 1: Setup Database**
```bash
npm run setup-sqlite
```

This will:
- Create your SQLite database file
- Set up all required tables
- Create a demo admin user

### **Step 2: Start Your Server**
```bash
npm start
```

### **Step 3: Login**
- **URL**: `http://localhost:5000`
- **Username**: `admin`
- **Password**: `admin123`

## 📁 **What Gets Created**

Your SQLite database will contain these tables:
- **Users** - Staff accounts and authentication
- **Inventory** - Electrical equipment tracking
- **Reports** - Job reports and documentation
- **Toolbox** - Tools and equipment management
- **Tasks** - Task assignment and tracking

## 🔧 **Database Location**

Your SQLite database is stored at:
```
Backend/electrical_management.db
```

**Important**: This file contains all your data, so:
- ✅ **Back it up** regularly
- ✅ **Don't delete it** accidentally
- ✅ **Include it in your deployment** to Render

## 📊 **Database Commands**

### **Setup Database**
```bash
npm run setup-sqlite
```

### **Test Database**
```bash
npm run test-sqlite
```

### **Start Server**
```bash
npm start
```

### **Development Mode**
```bash
npm run dev
```

## 🌐 **Deploy to Render**

### **1. Your Database File**
When you deploy to Render, make sure your `electrical_management.db` file is included in your repository.

### **2. Environment Variables**
Set these in Render:
```env
NODE_ENV=production
DB_TYPE=sqlite
DB_PATH=./Backend/electrical_management.db
```

### **3. Deploy**
Push to GitHub and Render will automatically deploy your app with SQLite!

## 🔍 **Troubleshooting**

### **Problem: Database not found**
```bash
# Run setup again
npm run setup-sqlite
```

### **Problem: Tables not created**
```bash
# Check if setup script ran successfully
npm run test-sqlite
```

### **Problem: Can't connect to database**
- Make sure `sqlite3` is installed: `npm install sqlite3`
- Check file permissions on the database file
- Verify the database path in your configuration

## 📈 **Performance Tips**

- **SQLite is fast** for most applications
- **File size** grows with your data
- **Backup regularly** - your data is in one file
- **Monitor file size** - SQLite handles GBs of data easily

## 🎉 **You're All Set!**

With SQLite, you have:
- ✅ **Simple setup** - No database server needed
- ✅ **Reliable storage** - ACID compliant
- ✅ **Easy backup** - Just copy one file
- ✅ **Fast performance** - Perfect for your use case
- ✅ **Zero maintenance** - No database administration

## 🚀 **Next Steps**

1. **Run setup**: `npm run setup-sqlite`
2. **Start server**: `npm start`
3. **Test login**: `admin/admin123`
4. **Deploy to Render**: Push to GitHub

---

**Happy coding with SQLite! 🗄️✨**
