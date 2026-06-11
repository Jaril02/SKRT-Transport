"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, Plus, Filter, Download, Fuel, Wrench, CreditCard } from "lucide-react";

import api from "@/lib/api";
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog";

export default function ExpensesPage() {
  const [expenseList, setExpenseList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/expenses");
      if (data.success) {
        setExpenseList(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchExpenses();
  }, []);

  const totalExpense = expenseList.reduce((acc, curr) => acc + curr.amount, 0);
  const fuelExpense = expenseList.filter(e => e.category === 'Fuel').reduce((acc, curr) => acc + curr.amount, 0);
  const maintenanceExpense = expenseList.filter(e => e.category === 'Maintenance').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Expense Tracking</h2>
            <p className="text-muted-foreground">Monitor and manage all operational expenses.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <AddExpenseDialog onExpenseAdded={fetchExpenses} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="bg-primary/5 border-primary/20 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Monthly Expense</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalExpense.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Current billing cycle</p>
            </CardContent>
          </Card>
          <Card className="bg-accent/5 border-accent/20 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fuel Costs</CardTitle>
              <Fuel className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{fuelExpense.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalExpense > 0 ? ((fuelExpense / totalExpense) * 100).toFixed(0) : 0}% of total expenses
              </p>
            </CardContent>
          </Card>
          <Card className="bg-secondary/10 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{maintenanceExpense.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">Repair and service costs</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50 bg-secondary/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Expenses</CardTitle>
              <Button variant="ghost" size="sm">
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead>Category</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 animate-pulse text-muted-foreground">Loading expenses...</TableCell>
                  </TableRow>
                ) : expenseList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No expenses recorded yet. Add your first expense.</TableCell>
                  </TableRow>
                ) : expenseList.map((expense) => (
                  <TableRow key={expense._id} className="border-border/50 hover:bg-white/5 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {expense.category === "Fuel" && <Fuel className="w-4 h-4 text-accent" />}
                        {expense.category === "Maintenance" && <Wrench className="w-4 h-4 text-muted-foreground" />}
                        {expense.category === "Toll" && <CreditCard className="w-4 h-4 text-primary" />}
                        <span className="font-medium">{expense.category}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-primary">{expense.vehicle?.vehicleNo || "N/A"}</TableCell>
                    <TableCell className="font-bold text-lg">₹{expense.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(expense.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{expense.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
