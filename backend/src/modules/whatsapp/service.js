const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

let client = null;
let isReady = false;
let qrCode = null;
let readyTimeout = null;

const getChromePath = () => {
  const envPath = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath) return envPath;
  const home = process.env.USERPROFILE || process.env.HOME;
  if (home) {
    const p = path.join(home, '.cache', 'puppeteer', 'chrome', 'win64-149.0.7827.22', 'chrome-win64', 'chrome.exe');
    if (fs.existsSync(p)) return p;
  }
  return undefined;
};

const cleanupOrphanedChrome = () => {
  try {
    const currentPid = process.pid;
    const lines = execSync('tasklist /FI "IMAGENAME eq chrome.exe" /FO CSV /NH', { encoding: 'utf8' }).split('\n').filter(Boolean);
    let killed = 0;
    for (const line of lines) {
      const match = line.match(/"chrome\.exe","(\d+)"/);
      if (match) {
        const pid = parseInt(match[1]);
        if (pid !== currentPid) {
          try { execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' }); killed++; } catch {}
        }
      }
    }
    if (killed > 0) console.log(`🧹 Cleaned up ${killed} orphaned Chrome process(es)`);
  } catch {}
};

const removeLockFiles = () => {
  try {
    const sessionDir = path.join(__dirname, '..', '..', '..', '.wwebjs_auth', 'session-skrt-whatsapp', 'Default');
    const lockFile = path.join(sessionDir, 'LOCK');
    const lockShm = path.join(sessionDir, 'lockfile');
    [lockFile, lockShm].forEach(f => {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
        console.log(`🔓 Removed lock file: ${path.basename(f)}`);
      }
    });
  } catch {}
};

const restartClient = async () => {
  try {
    if (readyTimeout) { clearTimeout(readyTimeout); readyTimeout = null; }
    isReady = false;
    qrCode = null;
    if (client) {
      try { await client.destroy(); } catch {}
      client = null;
    }
    removeLockFiles();
    try {
      const sessDir = path.join(__dirname, '..', '..', '..', '.wwebjs_auth', 'session-skrt-whatsapp');
      if (fs.existsSync(sessDir)) {
        fs.rmSync(sessDir, { recursive: true, force: true });
        console.log('🗑️ Wiped corrupted session directory');
      }
    } catch {}
    console.log('🔄 Restarting WhatsApp client (fresh QR scan needed)...');
    exports.initialize();
  } catch (e) {
    console.error('❌ Restart failed:', e.message);
  }
};

exports.initialize = () => {
  removeLockFiles();

  const chromePath = getChromePath();
  if (chromePath) {
    process.env.PUPPETEER_EXECUTABLE_PATH = chromePath;
  }
  const puppeteerConfig = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };
  if (chromePath) {
    puppeteerConfig.executablePath = chromePath;
    console.log('🔍 Using Chrome at:', chromePath);
  }

  client = new Client({
    authStrategy: new LocalAuth({ clientId: 'skrt-whatsapp' }),
    puppeteer: puppeteerConfig,
    qrMaxRetries: 5
  });

  client.on('qr', (qr) => {
    qrCode = qr;
    console.log('\n📱 QR CODE RECEIVED (valid ~20s). Scan with WhatsApp:\n');
    try {
      require('qrcode-terminal').generate(qr, { small: true });
    } catch (e) {
      console.log('QR string length:', qr.length);
      console.log(`QR URL: https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
    }
  });

  client.on('ready', () => {
    isReady = true;
    qrCode = null;
    if (readyTimeout) { clearTimeout(readyTimeout); readyTimeout = null; }
    console.log('✅ WhatsApp client is ready!');
  });

  client.on('authenticated', () => {
    console.log('🔐 WhatsApp authenticated');
    readyTimeout = setTimeout(() => {
      if (!isReady) {
        console.log('⚠️ WhatsApp authenticated but not ready after 30s. Reinitializing...');
        restartClient();
      }
    }, 30000);
  });

  client.on('auth_failure', (msg) => {
    console.error('❌ WhatsApp auth failure:', msg);
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    qrCode = null;
    console.log('🔌 WhatsApp disconnected:', reason);
    console.log('🔄 Attempting reconnect in 5s...');
    setTimeout(() => {
      try {
        client.initialize();
      } catch (e) {
        console.error('❌ Reconnect failed:', e.message);
      }
    }, 5000);
  });

  client.on('change_state', (state) => {
    console.log('📡 WhatsApp state:', state);
  });

  console.log('🚀 Initializing WhatsApp client...');
  client.initialize();
};

exports.getQR = () => qrCode;
exports.isReady = () => isReady;
exports.getStatus = () => ({
  connected: isReady,
  qrCode: qrCode,
  state: isReady ? 'ready' : qrCode ? 'qr_pending' : 'initializing'
});

exports.sendMedia = async (phone, media, filename) => {
  if (!isReady) throw new Error('WhatsApp client not connected. Scan QR code first.');
  const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
  await client.sendMessage(chatId, media, { sendMediaAsDocument: true, filename });
};
