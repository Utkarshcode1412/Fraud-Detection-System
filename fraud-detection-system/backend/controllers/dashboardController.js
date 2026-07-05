const asyncHandler = require('../utils/asyncHandler');
const dashboardService = require('../services/dashboardService');

const getOverview = asyncHandler(async (req, res) => {
  const [summary, trend, riskDistribution, topLocations, recentTransactions, recentAlerts] =
    await Promise.all([
      dashboardService.getSummary(),
      dashboardService.getFraudTrend(30),
      dashboardService.getRiskDistribution(),
      dashboardService.getTopFraudLocations(10),
      dashboardService.getRecentTransactions(10),
      dashboardService.getRecentAlerts(10),
    ]);

  res.status(200).json({
    summary,
    fraudTrend: trend,
    riskDistribution,
    topFraudLocations: topLocations,
    recentTransactions,
    recentAlerts,
  });
});

module.exports = { getOverview };
