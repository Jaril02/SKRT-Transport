"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  TrendingUp,
  Package,
  Truck,
  Users,
  Box,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import api from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  Booked:     "#6366f1",
  "In Transit": "#f59e0b",
  Delivered:  "#10b981",
  Cancelled:  "#ef4444",
  Pending:    "#94a3b8"
};

export default function DashboardPage() {
  const [stats, setStats]         = React.useState<any>(null);
  const [chartData, setChartData] = React.useState<any>(null);
  const [loading, setLoading]     = React.useState(true);

  React.useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, detailRes] = await Promise.all([
          api.get("/analytics/dashboard"),
          api.get("/analytics/detailed")
        ]);
        if (statsRes.data.success)  setStats(statsRes.data.data);
        if (detailRes.data.success) setChartData(detailRes.data.data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const statCards = stats
    ? [
        {
          label:   "Total Shipments",
          value:   stats.totalShipments?.toLocaleString() ?? "0",
          sub:     `${stats.bookedShipments ?? 0} booked`,
          icon:    Package,
          color:   "text-indigo-400"
        },
        {
          label:   "Active Trips",
          value:   stats.activeTrips ?? "0",
          sub:     `${stats.deliveredShipments ?? 0} delivered`,
          icon:    Truck,
          color:   "text-amber-400"
        },
        {
          label:   "Total Revenue",
          value:   `₹${((stats.totalRevenue ?? 0) / 100000).toFixed(1)}L`,
          sub:     `from ${stats.totalShipments ?? 0} shipments`,
          icon:    TrendingUp,
          color:   "text-emerald-400"
        },
        {
          label:   "Fleet Status",
          value:   `${stats.availableVehicles ?? 0}/${stats.totalVehicles ?? 0}`,
          sub:     `${stats.onTripVehicles ?? 0} on trip`,
          icon:    Box,
          color:   "text-blue-400"
        },
        {
          label:   "Clients",
          value:   stats.totalClients ?? "0",
          sub:     "registered clients",
          icon:    Users,
          color:   "text-purple-400"
        },
        {
          label:   "Inventory Items",
          value:   stats.totalInventory ?? "0",
          sub:     "in warehouse",
          icon:    Box,
          color:   "text-pink-400"
        }
      ]
    : [];

  const pieData = stats
    ? [
        { name: "Booked",     value: stats.bookedShipments     ?? 0 },
        { name: "In Transit", value: stats.activeTrips         ?? 0 },
        { name: "Delivered",  value: stats.deliveredShipments  ?? 0 },
        { name: "Cancelled",  value: stats.cancelledShipments  ?? 0 }
      ].filter(d => d.value > 0)
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Executive Dashboard</h2>
          <p className="text-muted-foreground">
            Live data from MongoDB · Last updated {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {[1,2,3,4,5,6].map(i => (
              <Card key={i} className="h-32 animate-pulse bg-secondary/10 border-border/50" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {statCards.map((stat, i) => (
              <Card key={i} className="border-border/50 bg-secondary/20 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Weekly Shipments + Revenue Chart */}
          <Card className="lg:col-span-4 border-border/50 bg-secondary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Weekly Shipments & Revenue (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">
                    Loading chart data...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData?.weeklyData ?? []}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Area type="monotone" dataKey="shipments" stroke="#10b981" fillOpacity={1} fill="url(#colorShipments)" strokeWidth={2} name="Shipments" />
                      <Area type="monotone" dataKey="revenue"   stroke="#6366f1" fillOpacity={1} fill="url(#colorRevenue)"   strokeWidth={2} name="Revenue (₹)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipment Status Pie Chart */}
          <Card className="lg:col-span-3 border-border/50 bg-secondary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Shipment Status Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground animate-pulse">
                    Loading...
                  </div>
                ) : pieData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No shipments yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                        itemStyle={{ color: "#fff" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* Legend */}
              {!loading && (
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {pieData.map((entry, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[entry.name] ?? "#94a3b8" }}
                      />
                      <span className="text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Monthly Revenue Chart */}
        {!loading && chartData?.monthlyData?.length > 0 && (
          <Card className="border-border/50 bg-secondary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(value: any) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Shipments Table */}
        {!loading && stats?.recentShipments?.length > 0 && (
          <Card className="border-border/50 bg-secondary/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">CN#</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">From</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">To</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentShipments.map((s: any) => (
                      <tr key={s._id} className="border-b border-border/20 hover:bg-secondary/30 transition-colors">
                        <td className="py-2 px-3 font-mono text-xs font-medium">{s.consignmentNumber}</td>
                        <td className="py-2 px-3">{s.consignor?.name ?? "—"}</td>
                        <td className="py-2 px-3">{s.consignee?.name ?? "—"}</td>
                        <td className="py-2 px-3">
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${STATUS_COLORS[s.status] ?? "#94a3b8"}20`,
                              color: STATUS_COLORS[s.status] ?? "#94a3b8"
                            }}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-medium">
                          ₹{(s.totalPayable ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
