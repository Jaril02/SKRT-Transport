"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import { TrendingUp, Users, Truck, Package, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const revenueData = [
  { month: "Jan", revenue: 450000, cost: 320000 },
  { month: "Feb", revenue: 520000, cost: 380000 },
  { month: "Mar", revenue: 480000, cost: 310000 },
  { month: "Apr", revenue: 610000, cost: 420000 },
  { month: "May", revenue: 750000, cost: 490000 },
];

const routeData = [
  { name: "Bhilwara-Ahmedabad", value: 45 },
  { name: "Bhilwara-Surat", value: 30 },
  { name: "Jaipur-Delhi", value: 15 },
  { name: "Mumbai-Pune", value: 10 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Business Intelligence</h2>
            <p className="text-muted-foreground">Deep dive into logistics performance, revenue growth, and operational efficiency.</p>
          </div>
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Download Report</Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 bg-secondary/10">
            <CardHeader>
              <CardTitle>Revenue vs Operational Cost</CardTitle>
              <CardDescription>Monthly comparison of gross revenue and expenditures.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                    <Area type="monotone" dataKey="cost" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-secondary/10">
            <CardHeader>
              <CardTitle>Top Routes</CardTitle>
              <CardDescription>By consignment volume.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={routeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {routeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {routeData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-[10px] text-muted-foreground truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-border/50 bg-secondary/10">
            <CardHeader><CardTitle>Vehicle Utilization</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-secondary/10">
            <CardHeader><CardTitle>Delivery Success Rate</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }} />
                    <Line type="stepAfter" dataKey="revenue" stroke="#f59e0b" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
