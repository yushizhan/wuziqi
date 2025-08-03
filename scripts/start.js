// Port detection and server startup script

const net = require('net');
const { spawn } = require('child_process');

// Check if port is available
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.listen(port, (err) => {
      if (err) {
        resolve(false);
      } else {
        server.close(() => resolve(true));
      }
    });
    
    server.on('error', () => {
      resolve(false);
    });
  });
}

// Find available port starting from preferred port
async function findAvailablePort(startPort = 3000) {
  for (let port = startPort; port <= startPort + 10; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error('No available ports found');
}

async function startServer() {
  try {
    const preferredPort = process.env.PORT || 3000;
    let port;
    
    if (await isPortAvailable(preferredPort)) {
      port = preferredPort;
      console.log(`✅ Port ${port} is available`);
    } else {
      console.log(`⚠️  Port ${preferredPort} is occupied, finding alternative...`);
      port = await findAvailablePort(3001);
      console.log(`✅ Using port ${port} instead`);
    }
    
    // Set the port and start the server
    process.env.PORT = port;
    
    const serverProcess = spawn('node', ['server.js'], {
      stdio: 'inherit',
      env: { ...process.env, PORT: port }
    });
    
    console.log(`🚀 Server starting on http://localhost:${port}`);
    
    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
    });
    
    serverProcess.on('exit', (code) => {
      console.log(`Server exited with code ${code}`);
    });
    
  } catch (error) {
    console.error('Error starting server:', error.message);
    process.exit(1);
  }
}

startServer();