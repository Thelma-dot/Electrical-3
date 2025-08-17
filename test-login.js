const fetch = require("node-fetch");

async function testLogin() {
  try {
    console.log("🧪 Testing login functionality...\n");

    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        staffid: "h2412031",
        password: "password1",
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Login successful!");
      console.log(`Token: ${data.token.substring(0, 20)}...`);
      console.log(`User: ${data.user.staff_id}`);
      console.log("\n🎉 Backend is working perfectly!");
    } else {
      console.log("❌ Login failed:", data.error);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testLogin();
