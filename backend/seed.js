const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');
dotenv.config();

const MODELS = [
  ['challans',           './src/modules/challan/model'],
  ['clients',            './src/modules/clients/model'],
  ['companysettings',    './src/modules/settings/model'],
  ['contacts',           './src/modules/contacts/model'],
  ['deliverystatements', './src/modules/delivery-statement/model'],
  ['drivers',            './src/modules/drivers/driverModel'],
  ['entryregisters',     './src/modules/entry/model'],
  ['expenses',           './src/modules/expenses/model'],
  ['inventories',        './src/modules/inventory/model'],
  ['invoices',           './src/modules/invoices/model'],
  ['notifications',      './src/modules/notifications/model'],
  ['rolepermissions',    './src/modules/settings/permissionModel'],
  ['shipments',          './src/modules/shipments/model'],
  ['summaryregisters',   './src/modules/summary/model'],
  ['trackings',          './src/modules/tracking/model'],
  ['users',              './src/modules/auth/model'],
  ['vehicles',           './src/modules/vehicles/model'],
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for seeding...\n');

    const User = require('./src/modules/auth/model');

    const users = [
      { name: 'Admin User', email: 'admin@ttc.com', phone: '9999999999', password: 'admin321', role: 'admin' },
      { name: 'Manager User', email: 'manager@ttc.com', phone: '8888888888', password: 'manager123', role: 'manager' },
    ];

    for (const u of users) {
      const existing = await User.findOne({ email: u.email });
      if (existing) {
        console.log(`ℹ️  Already exists: ${u.email}`);
      } else {
        await User.create(u);
        console.log(`✅ Created: ${u.email} / ${u.password}`);
      }
    }

    // Table header
    const pad = (s, n) => String(s).padEnd(n);
    console.log('\n' + pad('Collection', 22) + 'Docs');
    console.log('─'.repeat(30));
    for (const [label, path] of MODELS) {
      const model = require(path);
      const count = await model.countDocuments();
      console.log(pad(label, 22) + count);
    }
    console.log('─'.repeat(30));
    console.log(pad('', 22) + (await Promise.all(MODELS.map(([, p]) => require(p).countDocuments()))).reduce((a, b) => a + b, 0));
    console.log();

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();
