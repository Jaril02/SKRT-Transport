const { makeWASocket, useMongoDBAuthState, Browsers, DisconnectReason } = require('@whiskeysockets/baileys');
const mongoose = require('mongoose');

let sock = null;
let isReady = false;
let qrCode = null;

const COLLECTION_NAME = 'whatsapp_sessions';

exports.initialize = async () => {
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
    });
  }

  const collection = mongoose.connection.db.collection(COLLECTION_NAME);
  const { state, saveCreds } = await useMongoDBAuthState(collection);

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
    markOnlineOnConnect: false,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      console.log('📱 QR code received');
    }

    if (connection === 'open') {
      isReady = true;
      qrCode = null;
      console.log('✅ WhatsApp client is ready!');
    }

    if (connection === 'close') {
      isReady = false;
      qrCode = null;
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log('🔌 WhatsApp disconnected, reconnecting...');
        exports.initialize();
      } else {
        console.log('❌ WhatsApp logged out. Scan QR code again.');
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  console.log('🚀 Initializing WhatsApp client...');
};

exports.getQR = () => qrCode;
exports.isReady = () => isReady;
exports.getStatus = () => ({
  connected: isReady,
  qrCode: qrCode,
  state: isReady ? 'ready' : qrCode ? 'qr_pending' : 'initializing'
});

exports.sendMedia = async (phone, base64Data, filename) => {
  if (!isReady) throw new Error('WhatsApp client not connected. Scan QR code first.');
  const jid = phone.includes('@s.whatsapp.net') ? phone : `${phone}@s.whatsapp.net`;
  const buffer = Buffer.from(base64Data, 'base64');
  await sock.sendMessage(jid, {
    document: buffer,
    mimetype: 'application/pdf',
    fileName: filename,
  });
};
