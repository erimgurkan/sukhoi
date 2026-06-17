const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

const isWindows = os.platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

const ROOT = __dirname;

const services = [];
let blockchainReady = false;
let deployDone = false;

function log(service, message, isError = false) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const colors = {
    blockchain: '\x1b[33m',  // Yellow
    deploy: '\x1b[35m',      // Magenta
    backend: '\x1b[36m',     // Cyan
    public: '\x1b[32m',      // Green
    admin: '\x1b[34m',       // Blue
    system: '\x1b[31m',      // Red
  };
  const color = colors[service] || '\x1b[37m';
  const reset = '\x1b[0m';
  const prefix = `${color}[${timestamp}] [${service.toUpperCase().padEnd(10)}]${reset}`;
  const stream = isError ? process.stderr : process.stdout;
  stream.write(`${prefix} ${message}\n`);
}

function startProcess(name, command, args, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env, FORCE_COLOR: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: isWindows,
    });

    proc.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      lines.forEach(line => log(name, line.trim()));

      // Detect when Hardhat node is ready
      if (name === 'blockchain' && data.toString().includes('Started HTTP and WebSocket JSON-RPC server')) {
        blockchainReady = true;
        log('system', '✓ Blockchain node is ready!');
        resolve(proc);
      }
    });

    proc.stderr.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      lines.forEach(line => log(name, line.trim(), true));
    });

    proc.on('error', (err) => {
      log(name, `Failed to start: ${err.message}`, true);
      reject(err);
    });

    proc.on('close', (code) => {
      log(name, `Exited with code ${code}`);
      if (name === 'deploy') {
        deployDone = true;
        resolve(proc);
      }
    });

    services.push({ name, proc });

    // For non-blockchain services, resolve immediately
    if (name !== 'blockchain' && name !== 'deploy') {
      setTimeout(() => resolve(proc), 1000);
    }
  });
}

async function deploy() {
  log('system', 'Deploying SKH contract...');
  await startProcess(
    'deploy',
    npxCmd,
    ['hardhat', 'run', 'scripts/deploy.js', '--network', 'localhost'],
    path.join(ROOT, 'blockchain')
  );
  // Wait for deploy to complete
  await new Promise((resolve) => {
    const check = setInterval(() => {
      if (deployDone) { clearInterval(check); resolve(); }
    }, 500);
  });
  log('system', '✓ Contract deployed successfully!');
}

async function main() {
  console.log('\n');
  console.log('\x1b[33m' + '  ███████╗██╗   ██╗██╗  ██╗██╗  ██╗ ██████╗ ██╗' + '\x1b[0m');
  console.log('\x1b[33m' + '  ██╔════╝██║   ██║██║ ██╔╝██║  ██║██╔═══██╗██║' + '\x1b[0m');
  console.log('\x1b[33m' + '  ███████╗██║   ██║█████╔╝ ███████║██║   ██║██║' + '\x1b[0m');
  console.log('\x1b[33m' + '  ╚════██║██║   ██║██╔═██╗ ██╔══██║██║   ██║██║' + '\x1b[0m');
  console.log('\x1b[33m' + '  ███████║╚██████╔╝██║  ██╗██║  ██║╚██████╔╝██║' + '\x1b[0m');
  console.log('\x1b[33m' + '  ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝' + '\x1b[0m');
  console.log('\x1b[90m' + '  ─── Sukhoi Chain Ecosystem v1.0.0 ───' + '\x1b[0m');
  console.log('\n');

  try {
    // Step 1: Start blockchain node
    log('system', 'Starting Hardhat blockchain node...');
    await startProcess(
      'blockchain',
      npxCmd,
      ['hardhat', 'node'],
      path.join(ROOT, 'blockchain')
    );

    // Step 2: Deploy contract
    await deploy();

    // Step 3: Start backend
    log('system', 'Starting backend API server...');
    await startProcess(
      'backend',
      npmCmd,
      ['start'],
      path.join(ROOT, 'backend')
    );

    // Step 4: Start frontends
    log('system', 'Starting public frontend...');
    await startProcess(
      'public',
      npmCmd,
      ['run', 'dev'],
      path.join(ROOT, 'frontend-public')
    );

    log('system', 'Starting admin frontend...');
    await startProcess(
      'admin',
      npmCmd,
      ['run', 'dev'],
      path.join(ROOT, 'frontend-admin')
    );

    console.log('\n');
    log('system', '══════════════════════════════════════════════');
    log('system', '  All services started successfully!');
    log('system', '──────────────────────────────────────────────');
    log('system', '  🔗 Blockchain RPC:   http://localhost:8545');
    log('system', '  ⚡ Backend API:      http://localhost:3001');
    log('system', '  🌐 Public Frontend:  http://localhost:5173');
    log('system', '  🛡️  Admin Panel:      http://localhost:5174');
    log('system', '══════════════════════════════════════════════');
    console.log('\n');

  } catch (err) {
    log('system', `Startup failed: ${err.message}`, true);
    shutdown();
    process.exit(1);
  }
}

function shutdown() {
  log('system', 'Shutting down all services...');
  services.forEach(({ name, proc }) => {
    try {
      if (isWindows) {
        spawn('taskkill', ['/pid', proc.pid.toString(), '/f', '/t'], { shell: true });
      } else {
        proc.kill('SIGTERM');
      }
      log(name, 'Stopped');
    } catch (e) {
      // Process might already be dead
    }
  });
  log('system', 'All services stopped. Goodbye.');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Windows-specific: handle Ctrl+C
if (isWindows) {
  process.on('SIGHUP', shutdown);
}

main().catch((err) => {
  log('system', `Fatal error: ${err.message}`, true);
  process.exit(1);
});
