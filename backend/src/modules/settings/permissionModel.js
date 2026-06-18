const mongoose = require('mongoose');

const actionSchema = new mongoose.Schema({
  create: { type: Boolean, default: false },
  edit:   { type: Boolean, default: false },
  delete: { type: Boolean, default: false },
}, { _id: false });

const rolePermissionSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['admin', 'manager'],
    unique: true,
    required: true,
  },
  permissions: {
    shipments:  { type: actionSchema, default: { create: true, edit: true, delete: true } },
    inventory:  { type: actionSchema, default: { create: true, edit: true, delete: true } },
    vehicles:   { type: actionSchema, default: { create: true, edit: true, delete: true } },
    drivers:    { type: actionSchema, default: { create: true, edit: true, delete: true } },
    clients:    { type: actionSchema, default: { create: true, edit: true, delete: true } },
    invoices:   { type: actionSchema, default: { create: true, edit: true, delete: true } },
    contacts:   { type: actionSchema, default: { create: true, edit: true, delete: true } },
    expenses:   { type: actionSchema, default: { create: true, edit: true, delete: true } },
    users:      { type: actionSchema, default: {} },
    settings:   { type: actionSchema, default: {} },
  },
}, { timestamps: true });

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
