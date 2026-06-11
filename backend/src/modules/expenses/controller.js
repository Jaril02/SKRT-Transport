const Expense = require('./model');
const sendResponse = require('../../utils/response');

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().populate('vehicle', 'vehicleNo');
    return sendResponse(res, 200, true, 'Expenses fetched successfully', expenses);
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      createdBy: req.user._id
    });
    return sendResponse(res, 201, true, 'Expense created successfully', expense);
  } catch (error) {
    return sendResponse(res, 400, false, error.message);
  }
};
