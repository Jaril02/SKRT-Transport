const EntryRegister = require("./model");

/**
 * Get all Entry Registers
 */
exports.getAllEntries = async (req, res) => {
  try {
    const records = await EntryRegister.find().sort({ createdAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error", message: error.message });
  }
};

/**
 * Get Entry Register by Date search
 */
exports.getEntryByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const record = await EntryRegister.findOne({ dateSearch: date });
    if (!record) {
      return res.status(404).json({ success: false, message: "No register found for this date", data: null });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error", message: error.message });
  }
};

/**
 * Create a new Entry Register
 */
exports.createEntry = async (req, res) => {
  try {
    const newRecord = await EntryRegister.create(req.body);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(400).json({ success: false, error: "Bad Request", message: error.message });
  }
};

/**
 * Update an existing Entry Register
 */
exports.getEntryById = async (req, res) => {
  try {
    const record = await EntryRegister.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error", message: error.message });
  }
};

/**
 * Get Entry by G.R. No.
 */
exports.getEntryByGrNo = async (req, res) => {
  try {
    const { grNo } = req.params;
    const record = await EntryRegister.findOne({ 'entries.grNo': grNo });
    if (!record) {
      return res.status(404).json({ success: false, message: "No entry found for this G.R. No." });
    }
    const entry = record.entries.find(e => e.grNo === grNo);
    res.json({ success: true, data: { ...entry.toObject(), registerId: record._id, registerDate: record.dateSearch, registerPage: record.pageNo } });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error", message: error.message });
  }
};

exports.updateEntry = async (req, res) => {
  try {
    console.log('Update Request ID:', req.params.id);
    const { id } = req.params;
    const updatedRecord = await EntryRegister.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedRecord) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.json({ success: true, data: updatedRecord });
  } catch (error) {
    res.status(400).json({ success: false, error: "Bad Request", message: error.message });
  }
};

/**
 * Bulk upload entries from Excel
 */
exports.bulkUploadEntries = async (req, res) => {
  try {
    const { dateSearch, entries, pageNo, challanNo, vehicleNo, driverName } = req.body;
    if (!dateSearch || !entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: "dateSearch and entries array are required" });
    }

    // Assign sequential S.No starting from the next available
    let existing = await EntryRegister.findOne({ dateSearch });
    let nextSno = 1;
    if (existing) {
      const maxSno = (existing.entries || []).reduce((max, e) => {
        const num = parseInt(e.sno, 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      nextSno = maxSno + 1;
    }

    const mapped = entries.map((e, i) => ({
      sno: String(nextSno + i),
      from: e.from || "",
      to: e.to || "",
      grNo: e.grNo || "",
      consignor: e.consignor || "",
      consignee: e.consignee || "",
      noOfPackages: e.noOfPackages || "",
      contents: e.contents || "",
      freight: e.freight || "",
      deliveryReceiptNo: e.deliveryReceiptNo || "",
      dateOfDelivery: e.dateOfDelivery || "",
      deliveryStatus: e.dateOfDelivery ? "Complete" : "Pending"
    }));

    const registerFields = {};
    if (pageNo) registerFields.pageNo = pageNo;
    if (challanNo) registerFields.challanNo = challanNo;
    if (vehicleNo) registerFields.vehicleNo = vehicleNo;
    if (driverName) registerFields.driverName = driverName;

    if (existing) {
      if (Object.keys(registerFields).length > 0) {
        Object.assign(existing, registerFields);
      }
      existing.entries.push(...mapped);
      await existing.save();
      return res.json({ success: true, data: existing, count: mapped.length });
    }

    const newRegister = await EntryRegister.create({ dateSearch, ...registerFields, entries: mapped });
    res.status(201).json({ success: true, data: newRegister, count: mapped.length });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error", message: error.message });
  }
};

/**
 * Update a single entry within a register
 */
exports.updateSingleEntry = async (req, res) => {
  try {
    const { id, entryId } = req.params;
    const updateData = req.body;

    // Recalculate deliveryStatus based on dateOfDelivery
    if (updateData.dateOfDelivery) {
      updateData.deliveryStatus = "Complete";
    } else {
      updateData.deliveryStatus = "Pending";
    }

    const record = await EntryRegister.findOneAndUpdate(
      { _id: id, 'entries._id': entryId },
      { $set: { 'entries.$': { ...updateData, _id: entryId } } },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: "Register or entry not found" });
    }

    const updatedEntry = record.entries.id(entryId);
    res.json({ success: true, data: updatedEntry });
  } catch (error) {
    res.status(400).json({ success: false, error: "Bad Request", message: error.message });
  }
};

/**
 * Delete an Entry Register
 */
exports.deleteEntry = async (req, res) => {
  try {
    const deletedRecord = await EntryRegister.findByIdAndDelete(req.params.id);
    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: "Server Error", message: error.message });
  }
};
