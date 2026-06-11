const SummaryRegister = require("./model");

exports.getAll = async (req, res) => {
  try {
    const data = await SummaryRegister.find().sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getByDate = async (req, res) => {
  try {
    const data = await SummaryRegister.findOne({ date: req.params.date });
    if (!data) return res.status(404).json({ success: false, message: "No record found for this date" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const data = await SummaryRegister.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { entries } = req.body;
    // Removed Credit/Debit exclusivity check
    const data = await SummaryRegister.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { entries } = req.body;
    // Removed Credit/Debit exclusivity check
    const data = await SummaryRegister.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const data = await SummaryRegister.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
