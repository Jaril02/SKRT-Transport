const Shipment = require('./model');
const sendResponse = require('../../utils/response');

const parseNumber = (value) => {
  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
};

// Helper: Generate Unique Consignment Number
async function generateUniqueConsignmentNumber() {
  const lastShipment = await Shipment.findOne({
    consignmentNumber: /^SK-\d+$/
  }).sort({ createdAt: -1 });

  let nextNumber = 1;

  if (lastShipment?.consignmentNumber) {
    const lastNumber = parseInt(lastShipment.consignmentNumber.replace('SK-', ''), 10);
    nextNumber = lastNumber + 1;
  }

  let consignmentNumber = `SK-${String(nextNumber).padStart(2, '0')}`;

  while (await Shipment.exists({ consignmentNumber })) {
    nextNumber++;
    consignmentNumber = `SK-${String(nextNumber).padStart(2, '0')}`;
  }

  return consignmentNumber;
}

// @desc    Create new shipment
// @route   POST /api/shipments
// @access  Private/Operator
exports.createShipment = async (req, res) => {
  try {
    const {
      toBranch, consignor, consignee, bookedAt, ewayParta, invoiceNumber,
      invoiceValue, description, quantity, packageType, privateNumber,
      actualWeight, chargedWeight, rateType, rate, paymentMode,
      hamali, stationaryCharge, miscellaneousCharge, status, vehicleNumber, outgoingStatus
    } = req.body;

    const computedTotalFreight = parseNumber(chargedWeight) * parseNumber(rate);
    const computedTotalPayable = computedTotalFreight +
      parseNumber(hamali) + parseNumber(stationaryCharge) + parseNumber(miscellaneousCharge);

    const generatedConsignmentNumber = await generateUniqueConsignmentNumber();

    const shipment = await Shipment.create({
      consignmentNumber: generatedConsignmentNumber,
      toBranch,
      consignor,
      consignee,
      bookedAt: bookedAt ? new Date(bookedAt) : Date.now(),
      ewayParta: ewayParta || '',
      invoiceNumber: invoiceNumber || '',
      invoiceValue: parseNumber(invoiceValue),
      description,
      quantity: parseNumber(quantity),
      packageType,
      privateNumber,
      actualWeight: parseNumber(actualWeight),
      chargedWeight: parseNumber(chargedWeight),
      rateType,
      rate: parseNumber(rate),
      paymentMode,
      hamali: parseNumber(hamali),
      stationaryCharge: parseNumber(stationaryCharge),
      miscellaneousCharge: parseNumber(miscellaneousCharge),
      totalFreight: computedTotalFreight,
      totalPayable: computedTotalPayable,
      status: status || 'Booked',
      vehicleNumber: vehicleNumber || '',
      outgoingStatus: outgoingStatus || 'Pending',
      statusHistory: [{ status: outgoingStatus || 'Pending', timestamp: Date.now() }],
      updatedAt: Date.now()
    });

    return sendResponse(res, 201, true, 'Shipment created successfully', shipment);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
};

// @desc    Get next available consignment number
// @route   GET /api/shipments/next-number
// @access  Private
exports.getNextNumber = async (req, res) => {
  try {
    const consignmentNumber = await generateUniqueConsignmentNumber();
    return sendResponse(res, 200, true, 'Next number generated', { consignmentNumber });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// @desc    Get all shipments
// @route   GET /api/shipments
// @access  Private
exports.getShipments = async (req, res) => {
  try {
    const { status, search, limit } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { consignmentNumber: regex },
        { 'consignor.name': regex },
        { 'consignee.name': regex },
        { vehicleNumber: regex }
      ];
    }

    const query = Shipment.find(filter).sort({ createdAt: -1 });
    if (limit) query.limit(parseInt(limit));

    const shipments = await query;
    return sendResponse(res, 200, true, 'Shipments fetched successfully', shipments);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// @desc    Get single shipment
// @route   GET /api/shipments/:id
// @access  Private
exports.getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (shipment) {
      return sendResponse(res, 200, true, 'Shipment fetched successfully', shipment);
    } else {
      return sendResponse(res, 404, false, 'Shipment not found');
    }
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// @desc    Update shipment
// @route   PUT /api/shipments/:id
// @access  Private/Operator
exports.updateShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return sendResponse(res, 404, false, 'Shipment not found');
    }

    const {
      toBranch, consignor, consignee, bookedAt, ewayParta, invoiceNumber,
      invoiceValue, description, quantity, packageType, privateNumber,
      actualWeight, chargedWeight, rateType, rate, paymentMode,
      hamali, stationaryCharge, miscellaneousCharge, status, vehicleNumber, outgoingStatus
    } = req.body;

    if (toBranch !== undefined) shipment.toBranch = toBranch;
    if (consignor !== undefined) shipment.consignor = consignor;
    if (consignee !== undefined) shipment.consignee = consignee;
    if (bookedAt !== undefined) shipment.bookedAt = new Date(bookedAt);
    if (ewayParta !== undefined) shipment.ewayParta = ewayParta;
    if (invoiceNumber !== undefined) shipment.invoiceNumber = invoiceNumber;
    if (invoiceValue !== undefined) shipment.invoiceValue = parseNumber(invoiceValue);
    if (description !== undefined) shipment.description = description;
    if (quantity !== undefined) shipment.quantity = parseNumber(quantity);
    if (packageType !== undefined) shipment.packageType = packageType;
    if (privateNumber !== undefined) shipment.privateNumber = privateNumber;
    if (actualWeight !== undefined) shipment.actualWeight = parseNumber(actualWeight);
    if (chargedWeight !== undefined) shipment.chargedWeight = parseNumber(chargedWeight);
    if (rateType !== undefined) shipment.rateType = rateType;
    if (rate !== undefined) shipment.rate = parseNumber(rate);
    if (paymentMode !== undefined) shipment.paymentMode = paymentMode;
    if (hamali !== undefined) shipment.hamali = parseNumber(hamali);
    if (stationaryCharge !== undefined) shipment.stationaryCharge = parseNumber(stationaryCharge);
    if (miscellaneousCharge !== undefined) shipment.miscellaneousCharge = parseNumber(miscellaneousCharge);
    if (status !== undefined) shipment.status = status;
    if (vehicleNumber !== undefined) shipment.vehicleNumber = vehicleNumber;

    if (outgoingStatus !== undefined && outgoingStatus !== shipment.outgoingStatus) {
      shipment.statusHistory.push({ status: outgoingStatus, timestamp: Date.now() });
      shipment.outgoingStatus = outgoingStatus;
    }

    // Recompute totals
    shipment.totalFreight  = shipment.chargedWeight * shipment.rate;
    shipment.totalPayable  = shipment.totalFreight + shipment.hamali +
                             shipment.stationaryCharge + shipment.miscellaneousCharge;
    shipment.updatedAt     = Date.now();

    const updatedShipment = await shipment.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('tracking_updated', {
        shipmentId: updatedShipment._id,
        outgoingStatus: updatedShipment.outgoingStatus
      });
    }

    return sendResponse(res, 200, true, 'Shipment updated successfully', updatedShipment);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// @desc    Delete shipment
// @route   DELETE /api/shipments/:id
// @access  Private/Operator
exports.deleteShipment = async (req, res) => {
  try {
    // FIX: use findByIdAndDelete (Mongoose 7+ compatible — .remove() is deprecated)
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    if (!shipment) {
      return sendResponse(res, 404, false, 'Shipment not found');
    }
    return sendResponse(res, 200, true, 'Shipment deleted successfully', null);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

// @desc    Update shipment status
// @route   PATCH /api/shipments/:id/status
// @access  Private/Operator
exports.updateStatus = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);
    if (shipment) {
      if (req.body.status) shipment.status = req.body.status;
      if (req.body.outgoingStatus && req.body.outgoingStatus !== shipment.outgoingStatus) {
        shipment.statusHistory.push({ status: req.body.outgoingStatus, timestamp: Date.now() });
        shipment.outgoingStatus = req.body.outgoingStatus;
      }
      shipment.updatedAt = Date.now();
      const updatedShipment = await shipment.save();

      const io = req.app.get('io');
      if (io) {
        io.emit('tracking_updated', {
          shipmentId: updatedShipment._id,
          outgoingStatus: updatedShipment.outgoingStatus
        });
      }

      return sendResponse(res, 200, true, 'Status updated successfully', updatedShipment);
    } else {
      return sendResponse(res, 404, false, 'Shipment not found');
    }
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};
