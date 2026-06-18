const RolePermission = require('../modules/settings/permissionModel');

const requirePermission = (module, action) => {
  return async (req, res, next) => {
    if (req.user.role === 'admin') return next();
    try {
      const rp = await RolePermission.findOne({ role: req.user.role });
      if (rp && rp.permissions[module] && rp.permissions[module][action]) {
        return next();
      }
      return res.status(403).json({ success: false, message: 'Forbidden' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  };
};

module.exports = { requirePermission };
