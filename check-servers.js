const http = require("http");

function checkServer(port, name) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: "localhost",
        port: port,
        path: port === 5000 ? "/health" : "/",
        method: "GET",
        timeout: 3000,
      },
      (res) => {
        console.log(`✅ ${name} is running on port ${port}`);
        resolve(true);
      }
    );

    req.on("error", () => {
      console.log(`❌ ${name} is not running on port ${port}`);
      resolve(false);
    });

    req.on("timeout", () => {
      console.log(`⏰ ${name} timeout on port ${port}`);
      resolve(false);
    });

    req.end();
  });
}

async function checkAllServers() {
  console.log("🔍 Checking server status...\n");

  const backendRunning = await checkServer(5000, "Backend");
  const frontendRunning = await checkServer(5500, "Frontend");

  console.log("\n📊 Summary:");
  if (backendRunning && frontendRunning) {
    console.log("🎉 Both servers are running!");
    console.log("🌐 Frontend: http://localhost:5500");
    console.log("🔧 Backend: http://localhost:5000");
    console.log("\nTry accessing: http://localhost:5500");
  } else {
    console.log("⚠️ Some servers are not running");
    if (!backendRunning) {
      console.log("💡 Start backend: cd Backend && npm start");
    }
    if (!frontendRunning) {
      console.log("💡 Start frontend: cd Frontend && npx http-server -p 5500");
    }
  }
}

checkAllServers();
