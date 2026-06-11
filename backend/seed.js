const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load all models
const User = require('./src/modules/auth/model');
const Vehicle = require('./src/modules/vehicles/model');
const Driver = require('./src/modules/drivers/driverModel');
const Client = require('./src/modules/clients/model');
const Contact = require('./src/modules/contacts/model');
const Shipment = require('./src/modules/shipments/model');
const Invoice = require('./src/modules/invoices/model');
const Inventory = require('./src/modules/inventory/model');
const Expense = require('./src/modules/expenses/model');
const Tracking = require('./src/modules/tracking/model');
const Notification = require('./src/modules/notifications/model');
const EntryRegister = require('./src/modules/entry/model');
const Challan = require('./src/modules/challan/model');
const DeliveryStatement = require('./src/modules/delivery-statement/model');
const SummaryRegister = require('./src/modules/summary/model');
const CashMemo = require('./src/modules/cash-memo/model');

dotenv.config();

const ADMIN_EMAIL = 'admin@ttc.com';
const ADMIN_PASSWORD = 'admin123';

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected for seeding...\n');

    // ── Clear all collections ──────────────────────────────────────────────
    const collections = [
      User, Vehicle, Driver, Client, Contact, Shipment, Invoice, Inventory,
      Expense, Tracking, Notification, EntryRegister, Challan,
      DeliveryStatement, SummaryRegister, CashMemo
    ];
    await Promise.all(collections.map((m) => m.deleteMany({})));
    console.log('🗑️  Cleared all existing data.\n');

    // ── 1. Users ───────────────────────────────────────────────────────────
    const admin = await User.create({
      name: 'Admin User',
      email: ADMIN_EMAIL,
      phone: '9999999999',
      password: ADMIN_PASSWORD,
      role: 'admin'
    });
    console.log('👤 Admin user created');

    const manager = await User.create({
      name: 'Manager User',
      email: 'manager@ttc.com',
      phone: '8888888888',
      password: 'manager123',
      role: 'manager'
    });
    console.log('👤 Manager user created');

    const operator = await User.create({
      name: 'Operator User',
      email: 'operator@ttc.com',
      phone: '7777777777',
      password: 'operator123',
      role: 'operator'
    });
    console.log('👤 Operator user created\n');

    // ── 2. Vehicles ────────────────────────────────────────────────────────
    const vehicles = await Vehicle.create([
      {
        vehicleNo: 'RJ-06-GB-2101',
        model: 'Tata LPT 2518',
        type: 'Truck',
        capacity: 25000,
        owner: { name: 'Sant Kanwar Ram', phone: '9999999999' },
        status: 'on-trip',
        lastServiceDate: new Date('2026-04-15'),
        insuranceExpiry: new Date('2027-03-31'),
        currentLocation: { type: 'Point', coordinates: [74.6, 25.3] }
      },
      {
        vehicleNo: 'RJ-06-GB-4421',
        model: 'Ashok Leyland 1920',
        type: 'Container',
        capacity: 18000,
        owner: { name: 'Sant Kanwar Ram', phone: '9999999999' },
        status: 'available',
        lastServiceDate: new Date('2026-05-01'),
        insuranceExpiry: new Date('2027-06-30'),
        currentLocation: { type: 'Point', coordinates: [75.8, 26.9] }
      },
      {
        vehicleNo: 'RJ-06-HA-1234',
        model: 'Eicher Pro 3015',
        type: 'Truck',
        capacity: 12000,
        owner: { name: 'Ramesh Transport', phone: '9876543210' },
        status: 'maintenance',
        lastServiceDate: new Date('2026-02-28'),
        insuranceExpiry: new Date('2026-12-31'),
        currentLocation: { type: 'Point', coordinates: [73.8, 24.6] }
      }
    ]);
    console.log(`🚛 ${vehicles.length} vehicles created`);

    // ── 3. Drivers ─────────────────────────────────────────────────────────
    const drivers = await Driver.create([
      { name: 'Suresh Kumar', vehicleNumber: 'RJ-06-GB-2101', phone: '9876540001' },
      { name: 'Ramesh Singh', vehicleNumber: 'RJ-06-GB-4421', phone: '9876540002' },
      { name: 'Dinesh Yadav', vehicleNumber: 'RJ-06-HA-1234', phone: '9876540003' }
    ]);
    console.log(`🧑‍✈️ ${drivers.length} drivers created`);

    // ── 4. Clients ─────────────────────────────────────────────────────────
    const clients = await Client.create([
      {
        name: 'Aditya Textiles Ltd',
        contactPerson: 'Aditya Sharma',
        email: 'aditya@textiles.com',
        phone: '9876543210',
        address: 'Industrial Area, Bhilwara, Rajasthan',
        gstin: '08AABCG1234L1Z5',
        status: 'active'
      },
      {
        name: 'Gujarat Fabrics Co',
        contactPerson: 'Nayan Patel',
        email: 'nayan@gujarats.com',
        phone: '9123456780',
        address: 'GIDC, Ahmedabad, Gujarat',
        gstin: '24AABCG5678M1Z5',
        status: 'active'
      },
      {
        name: 'Reliance Logistics',
        contactPerson: 'Mukesh Agarwal',
        email: 'mukesh@reliance.com',
        phone: '9988776655',
        address: 'SEZ, Surat, Gujarat',
        gstin: '24AABCG9012N1Z5',
        status: 'active'
      }
    ]);
    console.log(`🏢 ${clients.length} clients created`);

    // ── 5. Contacts (Consignor / Consignee) ───────────────────────────────
    const contacts = await Contact.create([
      {
        type: 'consignor', gst: '08AABCG1234L1Z5', name: 'Aditya Textiles Ltd',
        phoneNumber: '9876543210', state: 'Rajasthan', building: 'Plot 42, Industrial Area',
        place: 'Bhilwara', city: 'Bhilwara'
      },
      {
        type: 'consignee', gst: '24AABCG5678M1Z5', name: 'Gujarat Fabrics Co',
        phoneNumber: '9123456780', state: 'Gujarat', building: 'GIDC Phase 3',
        place: 'Ahmedabad', city: 'Ahmedabad'
      },
      {
        type: 'consignor', gst: '08BXYZH9012P1Z5', name: 'Global Logistics Jaipur',
        phoneNumber: '9811122334', state: 'Rajasthan', building: 'Transport Nagar',
        place: 'Jaipur', city: 'Jaipur'
      },
      {
        type: 'consignee', gst: '07DDEFG3456Q1Z5', name: 'Delhi Depot Services',
        phoneNumber: '9711223344', state: 'Delhi', building: 'Warehouse 5, Anand Vihar',
        place: 'Delhi', city: 'Delhi'
      }
    ]);
    console.log(`📞 ${contacts.length} contacts created`);

    // ── 6. Shipments ───────────────────────────────────────────────────────
    const shipments = await Shipment.create([
      {
        consignmentNumber: 'SKRT-1001',
        toBranch: 'Ahmedabad',
        consignor: {
          gst: '08AABCG1234L1Z5', name: 'Aditya Textiles Ltd',
          phoneNumber: '9876543210', state: 'Rajasthan',
          building: 'Plot 42, Industrial Area', place: 'Bhilwara', city: 'Bhilwara'
        },
        consignee: {
          gst: '24AABCG5678M1Z5', name: 'Gujarat Fabrics Co',
          phoneNumber: '9123456780', state: 'Gujarat',
          building: 'GIDC Phase 3', place: 'Ahmedabad', city: 'Ahmedabad'
        },
        bookedAt: new Date('2026-05-25'),
        ewayParta: 'EWB-2026-0001',
        invoiceNumber: 'INV-SLS-001',
        invoiceValue: 48000,
        description: 'Cotton Fabric Rolls (Grade A)',
        quantity: 100,
        packageType: 'Bales',
        privateNumber: 'PRV-001',
        actualWeight: 2500,
        chargedWeight: 2600,
        rateType: 'Per Quintal',
        rate: 18,
        paymentMode: 'Paid',
        hamali: 500,
        stationaryCharge: 100,
        miscellaneousCharge: 200,
        totalFreight: 46800,
        totalPayable: 47600,
        status: 'In Transit',
        vehicleNumber: 'RJ-06-GB-2101',
        outgoingStatus: 'In Transit',
        statusHistory: [
          { status: 'Booked', timestamp: new Date('2026-05-25') },
          { status: 'Loaded', timestamp: new Date('2026-05-26') },
          { status: 'Dispatched', timestamp: new Date('2026-05-26') },
          { status: 'In Transit', timestamp: new Date('2026-05-27') }
        ]
      },
      {
        consignmentNumber: 'SKRT-1002',
        toBranch: 'Delhi',
        consignor: {
          gst: '08BXYZH9012P1Z5', name: 'Global Logistics Jaipur',
          phoneNumber: '9811122334', state: 'Rajasthan',
          building: 'Transport Nagar', place: 'Jaipur', city: 'Jaipur'
        },
        consignee: {
          gst: '07DDEFG3456Q1Z5', name: 'Delhi Depot Services',
          phoneNumber: '9711223344', state: 'Delhi',
          building: 'Warehouse 5, Anand Vihar', place: 'Delhi', city: 'Delhi'
        },
        bookedAt: new Date('2026-05-28'),
        ewayParta: '',
        invoiceNumber: 'INV-GL-2026-42',
        invoiceValue: 29000,
        description: 'Industrial Machinery Spares',
        quantity: 12,
        packageType: 'Boxes',
        privateNumber: 'PRV-002',
        actualWeight: 1800,
        chargedWeight: 2000,
        rateType: 'Per Quintal',
        rate: 15,
        paymentMode: 'ToPay',
        hamali: 300,
        stationaryCharge: 100,
        miscellaneousCharge: 0,
        totalFreight: 30000,
        totalPayable: 30400,
        status: 'Booked',
        vehicleNumber: '',
        outgoingStatus: 'Pending',
        statusHistory: [
          { status: 'Booked', timestamp: new Date('2026-05-28') }
        ]
      },
      {
        consignmentNumber: 'SKRT-1003',
        toBranch: 'Bhilwara',
        consignor: {
          gst: '24AABCG9012N1Z5', name: 'Reliance Logistics',
          phoneNumber: '9988776655', state: 'Gujarat',
          building: 'SEZ, Surat', place: 'Surat', city: 'Surat'
        },
        consignee: {
          gst: '08AABCG1234L1Z5', name: 'Aditya Textiles Ltd',
          phoneNumber: '9876543210', state: 'Rajasthan',
          building: 'Plot 42, Industrial Area', place: 'Bhilwara', city: 'Bhilwara'
        },
        bookedAt: new Date('2026-05-30'),
        ewayParta: 'EWB-2026-0002',
        invoiceNumber: 'INV-RIL-567',
        invoiceValue: 62000,
        description: 'Polyester Yarn Cartons',
        quantity: 200,
        packageType: 'Cartons',
        privateNumber: 'PRV-003',
        actualWeight: 4000,
        chargedWeight: 4200,
        rateType: 'Per Quintal',
        rate: 16,
        paymentMode: 'Credit',
        hamali: 600,
        stationaryCharge: 150,
        miscellaneousCharge: 0,
        totalFreight: 67200,
        totalPayable: 67950,
        status: 'Delivered',
        vehicleNumber: 'RJ-06-HA-1234',
        outgoingStatus: 'Delivered',
        statusHistory: [
          { status: 'Booked', timestamp: new Date('2026-05-30') },
          { status: 'Loaded', timestamp: new Date('2026-05-31') },
          { status: 'Dispatched', timestamp: new Date('2026-05-31') },
          { status: 'In Transit', timestamp: new Date('2026-06-01') },
          { status: 'Delivered', timestamp: new Date('2026-06-02') }
        ]
      }
    ]);
    console.log(`📦 ${shipments.length} shipments created`);

    // ── 7. Invoices ───────────────────────────────────────────────────────
    const invoices = await Invoice.create([
      {
        invoiceNo: 'INV-2026-001',
        shipment: shipments[0]._id,
        client: { name: 'Aditya Textiles Ltd', email: 'aditya@textiles.com', phone: '9876543210' },
        amount: 46800,
        tax: 0,
        total: 46800,
        status: 'paid',
        dueDate: new Date('2026-06-10'),
        paidDate: new Date('2026-06-05')
      },
      {
        invoiceNo: 'INV-2026-002',
        shipment: shipments[1]._id,
        client: { name: 'Global Logistics Jaipur', email: 'global@logistics.com', phone: '9811122334' },
        amount: 30000,
        tax: 0,
        total: 30000,
        status: 'unpaid',
        dueDate: new Date('2026-06-20')
      },
      {
        invoiceNo: 'INV-2026-003',
        shipment: shipments[2]._id,
        client: { name: 'Reliance Logistics', email: 'mukesh@reliance.com', phone: '9988776655' },
        amount: 67200,
        tax: 0,
        total: 67200,
        status: 'paid',
        dueDate: new Date('2026-06-25'),
        paidDate: new Date('2026-06-15')
      }
    ]);
    console.log(`🧾 ${invoices.length} invoices created`);

    // ── 8. Inventory ──────────────────────────────────────────────────────
    const inventory = await Inventory.create([
      {
        inventoryId: 'INV001001',
        lrNo: 'LR-2026-0001',
        cargoName: 'Cotton Bales (Grade A)',
        senderName: 'Aditya Textiles Ltd',
        senderPhone: '9876543210',
        receiverName: 'Gujarat Fabrics Co',
        receiverPhone: '9123456780',
        origin: 'Bhilwara',
        destination: 'Ahmedabad',
        packages: 50,
        weight: 2500,
        rate: 18,
        totalFreight: 45000,
        paymentMode: 'To Pay',
        warehouseLocation: 'Bay 4, Bhilwara Hub',
        incomingStatus: 'Checked In',
        challanStatus: 'Not Created',
        remarks: 'Handle with care - Keep dry',
        createdBy: admin._id
      },
      {
        inventoryId: 'INV001002',
        lrNo: 'LR-2026-0002',
        cargoName: 'Industrial Machinery Spares',
        senderName: 'Global Logistics Jaipur',
        senderPhone: '9811122334',
        receiverName: 'Delhi Depot Services',
        receiverPhone: '9711223344',
        origin: 'Jaipur',
        destination: 'Delhi',
        packages: 12,
        weight: 1800,
        rate: 15,
        totalFreight: 27000,
        paymentMode: 'Paid',
        warehouseLocation: 'Heavy Cargo Bay, Jaipur',
        incomingStatus: 'Checked In',
        challanStatus: 'Created',
        challanData: {
          challanNo: 'CH-2026-001',
          vehicleNumber: 'RJ-06-GB-2101',
          driverName: 'Suresh Kumar',
          driverPhone: '9876540001',
          fromLocation: 'Jaipur Hub',
          toLocation: 'Delhi Depot',
          dispatchDate: new Date('2026-05-29'),
          packages: 12,
          weight: 1800,
          remarks: 'Urgent Delivery - Fragile'
        },
        remarks: 'Fragile precision parts',
        createdBy: admin._id
      },
      {
        inventoryId: 'INV001003',
        lrNo: 'LR-2026-0003',
        cargoName: 'Polyester Yarn Cartons',
        senderName: 'Reliance Logistics',
        senderPhone: '9988776655',
        receiverName: 'Aditya Textiles Ltd',
        receiverPhone: '9876543210',
        origin: 'Surat',
        destination: 'Bhilwara',
        packages: 100,
        weight: 4000,
        rate: 15.5,
        totalFreight: 62000,
        paymentMode: 'Credit',
        warehouseLocation: 'Bay 2, Surat Depot',
        incomingStatus: 'Arrived at Warehouse',
        challanStatus: 'Not Created',
        remarks: 'Standard transit - moisture sensitive',
        createdBy: admin._id
      }
    ]);
    console.log(`📦 ${inventory.length} inventory records created`);

    // ── 9. Expenses ───────────────────────────────────────────────────────
    const expenses = await Expense.create([
      {
        category: 'Fuel',
        amount: 8500,
        date: new Date('2026-05-27'),
        vehicle: vehicles[0]._id,
        description: 'Diesel fill - RJ-06-GB-2101 (Jaipur to Delhi leg)',
        status: 'paid',
        createdBy: admin._id
      },
      {
        category: 'Toll',
        amount: 2200,
        date: new Date('2026-05-27'),
        vehicle: vehicles[0]._id,
        description: 'Toll charges - NH48 multiple plazas',
        status: 'paid',
        createdBy: admin._id
      },
      {
        category: 'Maintenance',
        amount: 12500,
        date: new Date('2026-05-20'),
        vehicle: vehicles[2]._id,
        description: 'Engine servicing - RJ-06-HA-1234',
        status: 'paid',
        createdBy: manager._id
      },
      {
        category: 'Driver Payment',
        amount: 5000,
        date: new Date('2026-05-31'),
        vehicle: vehicles[0]._id,
        description: 'Trip advance payment - Suresh Kumar',
        status: 'pending',
        createdBy: manager._id
      },
      {
        category: 'Other',
        amount: 750,
        date: new Date('2026-05-28'),
        description: 'Office stationary and printing',
        status: 'paid',
        createdBy: operator._id
      }
    ]);
    console.log(`💰 ${expenses.length} expenses created`);

    // ── 10. Tracking ─────────────────────────────────────────────────────
    const tracking = await Tracking.create([
      {
        vehicle: vehicles[0]._id,
        currentLocation: { lat: 26.9124, lng: 75.7873, address: 'Jaipur-Ajmer Highway, Near Kishangarh' },
        lastUpdate: new Date(),
        history: [
          { lat: 25.3478, lng: 74.6309, timestamp: new Date(Date.now() - 7200000) },
          { lat: 25.6780, lng: 74.8800, timestamp: new Date(Date.now() - 3600000) },
          { lat: 26.0012, lng: 75.1123, timestamp: new Date(Date.now() - 1800000) },
          { lat: 26.9124, lng: 75.7873, timestamp: new Date() }
        ]
      },
      {
        vehicle: vehicles[1]._id,
        currentLocation: { lat: 25.5941, lng: 74.4129, address: 'Bhilwara Depot, Rajasthan' },
        lastUpdate: new Date(),
        history: [
          { lat: 25.5941, lng: 74.4129, timestamp: new Date() }
        ]
      }
    ]);
    console.log(`📍 ${tracking.length} tracking records created`);

    // ── 11. Notifications ─────────────────────────────────────────────────
    const notifications = await Notification.create([
      {
        user: null,
        title: 'System Ready',
        message: 'SKRT Enterprise Portal seeded successfully. All systems operational.',
        type: 'success',
        read: false
      },
      {
        user: admin._id,
        title: 'Shipment In Transit',
        message: 'Shipment SKRT-1001 (Aditya Textiles → Gujarat Fabrics) is now in transit via RJ-06-GB-2101.',
        type: 'info',
        read: false,
        link: '/shipments'
      },
      {
        user: null,
        title: 'Insurance Expiry Reminder',
        message: 'Vehicle RJ-06-HA-1234 insurance expires on 31-Dec-2026. Please renew.',
        type: 'warning',
        read: false,
        link: '/fleet'
      }
    ]);
    console.log(`🔔 ${notifications.length} notifications created`);

    // ── 12. Entry Register ───────────────────────────────────────────────
    const entryRegisters = await EntryRegister.create([
      {
        pageNo: '1',
        dateSearch: '2026-05-25',
        challanNo: 'CH-2026-001',
        fromData: 'Bhilwara',
        toData: 'Ahmedabad',
        vehicleNo: 'RJ-06-GB-2101',
        driverName: 'Suresh Kumar',
        entries: [
          {
            sno: '1', from: 'Bhilwara', to: 'Ahmedabad', grNo: 'GR-001',
            consignor: 'Aditya Textiles', consignee: 'Gujarat Fabrics',
            noOfPackages: '50', contents: 'Cotton Bales', freight: '45000',
            deliveryReceiptNo: 'DR-001', dateOfDelivery: '2026-05-28',
            deliveryStatus: 'Complete'
          },
          {
            sno: '2', from: 'Jaipur', to: 'Delhi', grNo: 'GR-002',
            consignor: 'Global Logistics', consignee: 'Delhi Depot',
            noOfPackages: '12', contents: 'Machinery Spares', freight: '27000',
            deliveryReceiptNo: 'DR-002', dateOfDelivery: '',
            deliveryStatus: 'Pending'
          }
        ]
      }
    ]);
    console.log(`📋 ${entryRegisters.length} entry register created`);

    // ── 13. Challan ───────────────────────────────────────────────────────
    const challans = await Challan.create([
      {
        date: '2026-05-25',
        challanNo: 'CH-2026-001',
        from: 'Bhilwara Hub',
        vehicleNo: 'RJ-06-GB-2101',
        ownerName: 'Sant Kanwar Ram',
        driverName: 'Suresh Kumar',
        entries: [
          { grNo: 'GR-001', pkg: '50', dest: 'Ahmedabad', content: 'Cotton Bales', consignor: 'Aditya Textiles', consignee: 'Gujarat Fabrics', total: '45000', wt: '2500' },
          { grNo: 'GR-002', pkg: '12', dest: 'Delhi', content: 'Machinery Spares', consignor: 'Global Logistics', consignee: 'Delhi Depot', total: '27000', wt: '1800' }
        ],
        commission: '500',
        labour: '800',
        gr: '200',
        crossing: '0',
        truckFreight: '45000',
        advance: '10000',
        tfCredit: '35000',
        totalToPay: '0',
        otherCharge: '0',
        lcdc: '0',
        crossing2: '0',
        doorDelivery: '0',
        balanceFreight: '0',
        note: 'Deliver both consignments on same trip'
      }
    ]);
    console.log(`📄 ${challans.length} challan created`);

    // ── 14. Delivery Statement ────────────────────────────────────────────
    const deliveryStatements = await DeliveryStatement.create([
      {
        pageNo: '1',
        dateSearch: '2026-05-30',
        entries: [
          { sno: '1', drNo: 'DR-001', receiptNo: 'RCT-001', freight: '45000', labour: '800', receiptCh: '5', dCom: '500', demurage: '5' },
          { sno: '2', drNo: 'DR-002', receiptNo: 'RCT-002', freight: '27000', labour: '500', receiptCh: '5', dCom: '300', demurage: '0' }
        ],
        totals: { freight: 72000, labour: 1300, receiptCh: 10, dCom: 800, demurage: 5, total: 74115 }
      }
    ]);
    console.log(`📊 ${deliveryStatements.length} delivery statement created`);

    // ── 15. Summary Register ─────────────────────────────────────────────
    const summaryRegisters = await SummaryRegister.create([
      {
        date: '2026-05-31',
        entries: [
          {
            sno: '1', truckNo: 'RJ-06-GB-2101', driverName: 'Suresh Kumar',
            from: 'Bhilwara', to: 'Ahmedabad', transportName: 'SKRT',
            challanNo: 'CH-2026-001', totalCount: '1', fareDelivery: '45000',
            crossing: '0', crossingFare: '0', labor: '800',
            deliveryCommission: '500', credit: '35000', debit: '0',
            note: 'Completed'
          },
          {
            sno: '2', truckNo: 'RJ-06-GB-4421', driverName: 'Ramesh Singh',
            from: 'Bhilwara', to: 'Jaipur', transportName: 'SKRT',
            challanNo: 'CH-2026-002', totalCount: '1', fareDelivery: '15000',
            crossing: '0', crossingFare: '0', labor: '400',
            deliveryCommission: '250', credit: '10000', debit: '0',
            note: 'In Progress'
          }
        ]
      }
    ]);
    console.log(`📈 ${summaryRegisters.length} summary register created`);

    // ── 16. Cash Memo ─────────────────────────────────────────────────────
    const cashMemos = await CashMemo.create([
      {
        drNo: 'DR-001',
        grNo: 'GR-001',
        date: new Date('2026-05-28'),
        receivedOn: 'Cash',
        from: 'Aditya Textiles Ltd',
        consignee: 'Gujarat Fabrics Co',
        through: 'SKRT Transport',
        freight: 45000,
        freightPaise: 0,
        labour: 800,
        labourPaise: 0,
        stationery: 100,
        stationeryPaise: 0,
        commission: 500,
        commissionPaise: 0,
        aoc: 200,
        aocPaise: 50,
        totalAmount: 46650
      },
      {
        drNo: 'DR-002',
        grNo: 'GR-002',
        date: new Date('2026-06-01'),
        receivedOn: 'Bank Transfer',
        from: 'Global Logistics Jaipur',
        consignee: 'Delhi Depot Services',
        through: 'SKRT Transport',
        freight: 27000,
        freightPaise: 0,
        labour: 500,
        labourPaise: 0,
        stationery: 100,
        stationeryPaise: 0,
        commission: 300,
        commissionPaise: 0,
        aoc: 0,
        aocPaise: 0,
        totalAmount: 27900
      }
    ]);
    console.log(`💵 ${cashMemos.length} cash memos created\n`);

    // ── Summary ──────────────────────────────────────────────────────────
    console.log('═══════════════════════════════════════════════');
    console.log('  ✅ Database seeded successfully!');
    console.log('');
    console.log('  Users:');
    console.log('  ──────────────────────────────────');
    console.log(`  Admin:    ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`  Manager:  manager@ttc.com / manager123`);
    console.log(`  Operator: operator@ttc.com / operator123`);
    console.log('');
    console.log('  Records Created:');
    console.log(`  • ${await User.countDocuments()} Users`);
    console.log(`  • ${await Vehicle.countDocuments()} Vehicles`);
    console.log(`  • ${await Driver.countDocuments()} Drivers`);
    console.log(`  • ${await Client.countDocuments()} Clients`);
    console.log(`  • ${await Contact.countDocuments()} Contacts`);
    console.log(`  • ${await Shipment.countDocuments()} Shipments`);
    console.log(`  • ${await Invoice.countDocuments()} Invoices`);
    console.log(`  • ${await Inventory.countDocuments()} Inventory`);
    console.log(`  • ${await Expense.countDocuments()} Expenses`);
    console.log(`  • ${await Tracking.countDocuments()} Tracking`);
    console.log(`  • ${await Notification.countDocuments()} Notifications`);
    console.log(`  • ${await EntryRegister.countDocuments()} Entry Registers`);
    console.log(`  • ${await Challan.countDocuments()} Challans`);
    console.log(`  • ${await DeliveryStatement.countDocuments()} Delivery Statements`);
    console.log(`  • ${await SummaryRegister.countDocuments()} Summary Registers`);
    console.log(`  • ${await CashMemo.countDocuments()} Cash Memos`);
    console.log('═══════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seeding error:', error.message);
    if (error.errors) {
      Object.entries(error.errors).forEach(([field, err]) => {
        console.error(`   ↳ Field "${field}": ${err.message}`);
      });
    }
    process.exit(1);
  }
};

seedData();
