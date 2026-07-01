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

    // Seed shipments with challanCreated field
    const Shipment = require('./src/modules/shipments/model');
    const shipments = [
      {
        consignmentNumber: 'SK-01',
        toBranch: 'Jaipur',
        consignor: { name: 'ABC Traders', address: '123 Industrial Area', gstin: '08AABC1234A1Z', contact: '9876543210' },
        consignee: { name: 'XYZ Stores', address: '456 Market Road', gstin: '08AAXYZ5678B2Z', contact: '9812345678' },
        bookedAt: new Date(),
        ewayParta: 'EWB123456789',
        invoiceNumber: 'INV-001',
        invoiceValue: 50000,
        description: 'Electronics Goods',
        quantity: 10,
        packageType: 'Carton',
        privateNumber: 'PRV001',
        actualWeight: 500,
        chargedWeight: 500,
        rateType: 'Per KG',
        rate: 100,
        paymentMode: 'Prepaid',
        hamali: 500,
        stationaryCharge: 100,
        miscellaneousCharge: 200,
        totalFreight: 50000,
        totalPayable: 50800,
        status: 'Booked',
        vehicleNumber: 'RJ14GA1234',
        outgoingStatus: 'Pending',
        challanCreated: false,
        statusHistory: [{ status: 'Booked', timestamp: new Date() }]
      },
      {
        consignmentNumber: 'SK-02',
        toBranch: 'Udaipur',
        consignor: { name: 'PQR Enterprises', address: '789 Business Park', gstin: '08APQR9876C3Z', contact: '9765432109' },
        consignee: { name: 'LMN Retail', address: '321 Commercial Street', gstin: '08ALMN4321D4Z', contact: '9781234560' },
        bookedAt: new Date(),
        description: 'Textile Materials',
        quantity: 5,
        packageType: 'Bale',
        actualWeight: 200,
        chargedWeight: 200,
        rate: 80,
        totalFreight: 16000,
        totalPayable: 16000,
        status: 'Booked',
        vehicleNumber: 'RJ14GB5678',
        outgoingStatus: 'Pending',
        challanCreated: false,
        statusHistory: [{ status: 'Booked', timestamp: new Date() }]
      },
      {
        consignmentNumber: 'SK-03',
        toBranch: 'Ajmer',
        consignor: { name: 'DEF Industries', address: '456 Factory Road', gstin: '08ADEF1111E5Z', contact: '9654321098' },
        consignee: { name: 'MNO Wholesale', address: '789 Depot Street', gstin: '08AMNO2222F6Z', contact: '9681234560' },
        bookedAt: new Date(),
        description: 'Building Materials',
        quantity: 20,
        packageType: 'Sacks',
        actualWeight: 1000,
        chargedWeight: 1000,
        rate: 50,
        totalFreight: 50000,
        totalPayable: 50000,
        status: 'In Transit',
        vehicleNumber: 'RJ14GC9012',
        outgoingStatus: 'Dispatched',
        challanCreated: false,
        statusHistory: [{ status: 'Booked', timestamp: new Date() }, { status: 'In Transit', timestamp: new Date() }]
      }
    ];

    for (const s of shipments) {
      const existing = await Shipment.findOne({ consignmentNumber: s.consignmentNumber });
      if (existing) {
        console.log(`ℹ️  Shipment already exists: ${s.consignmentNumber}`);
      } else {
        await Shipment.create(s);
        console.log(`✅ Created shipment: ${s.consignmentNumber}`);
      }
    }

    // Seed challans and update referenced shipments
    const Challan = require('./src/modules/challan/model');
    const challans = [
      {
        date: new Date().toISOString().split('T')[0],
        challanNo: '323',
        from: 'Bhilwara',
        vehicleNo: 'RJ14GA1234',
        ownerName: 'Sant Kanwar Ram Transport',
        driverName: 'Rajesh Kumar',
        entries: [
          { grNo: 'SK-01', pkg: '10', dest: 'Jaipur', content: 'Electronics Goods', consignor: 'ABC Traders', consignee: 'XYZ Stores', total: '50800', wt: '500' }
        ],
        commission: '1000',
        truckFreight: '5000',
        advance: '0',
        tfCredit: '0',
        totalToPay: '0',
        otherCharge: '0',
        lcdc: '0',
        crossing2: '0',
        doorDelivery: '0',
        balanceFreight: '0',
        note: 'Sample challan for SK-01'
      }
    ];

    for (const c of challans) {
      const existing = await Challan.findOne({ challanNo: c.challanNo });
      if (existing) {
        console.log(`ℹ️  Challan already exists: ${c.challanNo}`);
      } else {
        const newChallan = await Challan.create(c);
        console.log(`✅ Created challan: ${c.challanNo}`);

        // Update referenced shipments to mark them as having a challan
        const grNos = c.entries.map(e => e.grNo).filter(Boolean);
        if (grNos.length > 0) {
          await Shipment.updateMany(
            { consignmentNumber: { $in: grNos } },
            { $set: { challanCreated: true } }
          );
          console.log(`✅ Updated ${grNos.length} shipments with challanCreated: true`);
        }
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
