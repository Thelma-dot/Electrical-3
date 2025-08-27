const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database file path for Railway
const dbPath = path.join(__dirname, "electrical_management.db");

console.log("🚀 Railway: Initializing users in production database...");
console.log("📁 Database path:", dbPath);

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("❌ Error opening database:", err.message);
        process.exit(1);
    } else {
        console.log("✅ Connected to Railway SQLite database");
        initializeUsers();
    }
});

function initializeUsers() {
    console.log("\n🔧 Setting up users for Railway deployment...");

    // Create admin user
    createAdminUser();
}

function createAdminUser() {
    const hashedPassword = bcrypt.hashSync("admin123", 10);

    // Check if admin user exists
    db.get("SELECT id FROM users WHERE staff_id = ?", ["admin"], (err, row) => {
        if (err) {
            console.error("❌ Error checking for admin user:", err.message);
            return;
        }

        if (row) {
            console.log("ℹ️ Admin user already exists, updating password...");
            updateAdminPassword();
        } else {
            console.log("🔧 Creating admin user...");
            db.run(
                `INSERT INTO users (staff_id, password, email, role) VALUES (?, ?, ?, ?)`,
                ["admin", hashedPassword, "admin@example.com", "admin"],
                function (err) {
                    if (err) {
                        console.error("❌ Error creating admin user:", err.message);
                    } else {
                        console.log("✅ Admin user created successfully!");
                    }
                    createDemoUsers();
                }
            );
        }
    });
}

function updateAdminPassword() {
    const hashedPassword = bcrypt.hashSync("admin123", 10);

    db.run(
        `UPDATE users SET password = ?, role = 'admin' WHERE staff_id = ?`,
        [hashedPassword, "admin"],
        function (err) {
            if (err) {
                console.error("❌ Error updating admin password:", err.message);
            } else {
                console.log("✅ Admin password updated successfully!");
            }
            createDemoUsers();
        }
    );
}

function createDemoUsers() {
    console.log("🔧 Creating demo users...");

    const demoUsers = [
        { staffID: "h2412031", password: "password1" },
        { staffID: "h2402117", password: "password2" },
        { staffID: "h2402123", password: "password3" },
        { staffID: "h2402140", password: "password4" }
    ];

    let usersCreated = 0;

    demoUsers.forEach((user) => {
        const hashedPassword = bcrypt.hashSync(user.password, 10);

        db.run(
            `INSERT OR IGNORE INTO users (staff_id, password, role) VALUES (?, ?, ?)`,
            [user.staffID, hashedPassword, "staff"],
            function (err) {
                if (err) {
                    console.error(`❌ Error creating user ${user.staffID}:`, err.message);
                } else {
                    if (this.changes > 0) {
                        console.log(`✅ Created user: ${user.staffID}`);
                    } else {
                        console.log(`ℹ️ User ${user.staffID} already exists`);
                    }
                }

                usersCreated++;
                if (usersCreated === demoUsers.length) {
                    finishUserSetup();
                }
            }
        );
    });
}

function finishUserSetup() {
    console.log("\n🎉 Railway user setup complete!");
    console.log("\n📋 Available Login Credentials:");
    console.log("   Admin: admin / admin123");
    console.log("   Demo: h2412031 / password1");
    console.log("   Demo: h2402117 / password2");
    console.log("   Demo: h2402123 / password3");
    console.log("   Demo: h2402140 / password4");

    db.close((err) => {
        if (err) {
            console.error("❌ Error closing database:", err.message);
        } else {
            console.log("✅ Database connection closed");
        }
        process.exit(0);
    });
}
