const Shipment = require('../shipments/model');
const Vehicle = require('../vehicles/model');
const Client = require('../clients/model');
const User = require('../auth/model');
const Inventory = require('../inventory/model');
const sendResponse = require('../../utils/response');

exports.getDashboardStats = async (req, res) => {
  try {
    // Correct status values matching the Shipment model enum
    const [
      totalShipments,
      activeTrips,
      deliveredShipments,
      cancelledShipments,
      bookedShipments,
      totalVehicles,
      availableVehicles,
      onTripVehicles,
      totalClients,
      totalDrivers,
      totalInventory,
      revenueAgg,
      recentShipments
    ] = await Promise.all([
      Shipment.countDocuments(),
      Shipment.countDocuments({ status: 'In Transit' }),
      Shipment.countDocuments({ status: 'Delivered' }),
      Shipment.countDocuments({ status: 'Cancelled' }),
      Shipment.countDocuments({ status: 'Booked' }),
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ status: 'available' }),
      Vehicle.countDocuments({ status: 'on-trip' }),
      Client.countDocuments(),
      User.countDocuments({ role: 'driver' }),
      Inventory.countDocuments(),
      // Total revenue from all shipments totalPayable
      Shipment.aggregate([
        { $group: { _id: null, total: { $sum: '$totalPayable' } } }
      ]),
      // Recent 5 shipments
      Shipment.find().sort({ createdAt: -1 }).limit(5).lean()
    ]);

    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    return sendResponse(res, 200, true, 'Dashboard stats fetched successfully', {
      totalShipments,
      activeTrips,
      deliveredShipments,
      cancelledShipments,
      bookedShipments,
      totalVehicles,
      availableVehicles,
      onTripVehicles,
      totalClients,
      totalDrivers,
      totalInventory,
      totalRevenue,
      recentShipments
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};

exports.getDetailedAnalytics = async (req, res) => {
  try {
    // Last 7 days shipment trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyShipments = await Shipment.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          shipments: { $sum: 1 },
          revenue: { $sum: '$totalPayable' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill in missing days
    const days = [];
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = weeklyShipments.find(w => w._id === dateStr);
      days.push({
        name: dayLabels[d.getDay()],
        date: dateStr,
        shipments: found ? found.shipments : 0,
        revenue: found ? found.revenue : 0
      });
    }

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Shipment.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          revenue: { $sum: '$totalPayable' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = monthlyRevenue.map(m => ({
      name: monthNames[parseInt(m._id.split('-')[1]) - 1],
      revenue: m.revenue,
      shipments: m.count
    }));

    // Top destination branches
    const topRoutes = await Shipment.aggregate([
      { $group: { _id: '$toBranch', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Status breakdown
    const statusBreakdown = await Shipment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    return sendResponse(res, 200, true, 'Detailed analytics fetched successfully', {
      weeklyData: days,
      monthlyData,
      topRoutes,
      statusBreakdown
    });
  } catch (error) {
    return sendResponse(res, 500, false, error.message);
  }
};
