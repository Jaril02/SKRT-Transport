const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  gst: { type: String, required: true },
  name: { type: String, required: true },
  phoneNumber: { type: String },
  state: { type: String },
  building: { type: String },
  place: { type: String },
  city: { type: String }
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  consignmentNumber: {
    type: String,
    required: true,
    unique: true
  },
  toBranch: { type: String, required: true },
  consignor: { type: contactSchema, required: true },
  consignee: { type: contactSchema, required: true },
  bookedAt: { type: Date, default: Date.now },
  ewayParta: { type: String, default: '' },
  invoiceNumber: { type: String, default: '' },
  invoiceValue: { type: Number, required: true },
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  packageType: { type: String, required: true },
  privateNumber: { type: String, required: true },
  actualWeight: { type: Number, required: true },
  chargedWeight: { type: Number, required: true },
  rateType: { type: String, required: true },
  rate: { type: Number, required: true },
  paymentMode: { type: String, required: true },
  hamali: { type: Number, default: 0 },
  stationaryCharge: { type: Number, default: 0 },
  miscellaneousCharge: { type: Number, default: 0 },
  totalFreight: { type: Number, required: true, default: 0 },
  totalPayable: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ['Booked', 'In Transit', 'Delivered', 'Cancelled', 'Pending'],
    default: 'Booked'
  },
  vehicleNumber: {
    type: String,
    default: ''
  },
  outgoingStatus: {
    type: String,
    enum: ['Pending', 'Loaded', 'Dispatched', 'In Transit', 'Arrived at Branch', 'Out for Delivery', 'Delivered'],
    default: 'Pending'
  },
  statusHistory: [
    {
      status: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Shipment', shipmentSchema);
