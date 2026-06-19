const https = require('https');
const { makeWASocket, Browsers, DisconnectReason, initAuthCreds, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const mongoose = require('mongoose');
const { Binary } = require('bson');

let sock = null;
let isReady = false;
let qrCode = null;
let initLock = false;
let reconnectAttempts = 0;

const COLLECTION_NAME = 'whatsapp_sessions';
const KEY_PREFIX = 'key:';

const binaryToBuffer = (val) => {
  if (val instanceof Binary) return Buffer.from(val.buffer);
  if (Buffer.isBuffer(val)) return val;
  if (val && typeof val === 'object') {
    if (Array.isArray(val)) return val.map(binaryToBuffer);
    if (val.constructor !== Object) return val;
    const result = {};
    for (const [k, v] of Object.entries(val)) result[k] = binaryToBuffer(v);
    return result;
  }
  return val;
};

const useMongoDBAuthState = async (collection) => {
  if (process.env.WHATSAPP_FRESH === 'true') {
    console.log('🧹 WHATSAPP_FRESH mode — clearing session from MongoDB');
    await collection.drop().catch(() => {});
    console.log('   ✓ Collection dropped, fresh QR scan required');
  }
  const credsDoc = await collection.findOne({ _id: 'creds' });
  const rawCreds = credsDoc ? credsDoc.creds : null;
  const creds = rawCreds ? binaryToBuffer(rawCreds) : initAuthCreds();

  const keys = {
    get: async (type, ids) => {
      const docs = await collection.find({
        _id: { $in: ids.map(id => `${KEY_PREFIX}${type}:${id}`) }
      }).toArray();
      const result = {};
      for (const doc of docs) {
        const id = doc._id.replace(`${KEY_PREFIX}${type}:`, '');
        result[id] = binaryToBuffer(doc.value);
      }
      return result;
    },
    set: async (data) => {
      const ops = Object.entries(data).map(([key, value]) => ({
        updateOne: {
          filter: { _id: `${KEY_PREFIX}${key}` },
          update: { $set: { value } },
          upsert: true,
        }
      }));
      if (ops.length) await collection.bulkWrite(ops);
    },
    delete: async (ids) => {
      await collection.deleteMany({
        _id: { $in: ids.map(id => `${KEY_PREFIX}${id}`) }
      });
    },
  };

  const saveCreds = async () => {
    await collection.updateOne(
      { _id: 'creds' },
      { $set: { creds } },
      { upsert: true }
    );
  };

  return {
    state: {
      creds,
      keys: makeCacheableSignalKeyStore(keys),
    },
    saveCreds,
  };
};

exports.initialize = async () => {
  if (initLock) {
    console.log('⏳ WhatsApp init already in progress, skipping...');
    return;
  }
  initLock = true;

  if (sock) {
    try {
      sock.ev.removeAllListeners();
      sock.end(undefined);
      sock.close();
    } catch {}
    sock = null;
  }

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
    agent: new https.Agent({ keepAlive: true, family: 4 }),
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      reconnectAttempts = 0;
      console.log('📱 QR code received');
    }

    if (connection === 'open') {
      isReady = true;
      qrCode = null;
      reconnectAttempts = 0;
      initLock = false;
      console.log('✅ WhatsApp client is ready!');
    }

    if (connection === 'close') {
      isReady = false;
      qrCode = null;
      initLock = false;
      const isLoggedOut = lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut;
      if (isLoggedOut) {
        console.log('❌ WhatsApp logged out. Scan QR code again.');
      } else {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 60000);
        reconnectAttempts++;
        console.log(`🔌 WhatsApp disconnected, reconnecting in ${delay / 1000}s...`);
        setTimeout(() => exports.initialize(), delay);
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
