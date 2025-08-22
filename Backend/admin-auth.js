const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Replace with your actual admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123';

// Login endpoint (handles both admin and regular users)
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        res.json({ success: true, role: 'admin' });
    } else {
        // Handle regular user login here
        // This is where you'd normally check against your user database
        req.session.isUser = true;
        res.json({ success: true, role: 'user' });
    }
});

// Middleware to protect admin dashboard route
function requireAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied' });
    }
}

// Example admin dashboard route
app.get('/admin/dashboard', requireAdmin, (req, res) => {
    res.json({ message: 'Welcome to the admin dashboard!' });
});

app.listen(3000, () => {
    console.log('Backend running on http://localhost:3000');
});
