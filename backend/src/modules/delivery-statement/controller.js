const DSRegister = require("./model");

exports.getAll = async (req, res) => {
  try {
    const records = await DSRegister.find().sort({ createdAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getByDate = async (req, res) => {
  try {
    const record = await DSRegister.findOne({ dateSearch: req.params.date });
    if (!record) return res.status(404).json({ success: false, message: "No record found for this date" });
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const record = await DSRegister.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { dateSearch } = req.body;
    let record = await DSRegister.findOne({ dateSearch });
    if (record) {
      record = await DSRegister.findByIdAndUpdate(record._id, req.body, { new: true, runValidators: true });
      return res.status(200).json({ success: true, data: record });
    }
    const newRecord = await DSRegister.create(req.body);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await DSRegister.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await DSRegister.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
