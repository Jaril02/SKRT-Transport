"use client";

import React, { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  CreditCard, 
  Calendar,
  Plus,
  Loader2,
  Calculator,
  TrendingUp,
  AlertCircle
} from "lucide-react";

import api from "@/lib/api";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { cn } from "@/lib/utils";
import { useHeader } from "@/context/HeaderContext";
import { toast } from "sonner";

const getLocalDateString = (d: Date = new Date()) => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const getFirstDayOfMonthString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export default function InvoicesPage() {
  const { searchQuery } = useHeader();
  
  // Basic states
  const [invoiceList, setInvoiceList] = useState<any[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(true);
  
  // Date range for aggregation
  const [startDate, setStartDate] = useState(getFirstDayOfMonthString());
  const [endDate, setEndDate] = useState(getLocalDateString());
  
  // Data for aggregation
  const [summaries, setSummaries] = useState<any[]>([]);
  const [deliveryStatements, setDeliveryStatements] = useState<any[]>([]);
  const [aggLoading, setAggLoading] = useState(false);

  const fetchInvoices = async () => {
    try {
      setInvoicesLoading(true);
      const { data } = await api.get("/invoices");
      if (data.success) {
        setInvoiceList(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch invoices", error);
    } finally {
      setInvoicesLoading(false);
    }
  };

  const fetchAggregationData = async () => {
    try {
      setAggLoading(true);
      const [sumRes, dsRes] = await Promise.all([
        api.get("/summary"),
        api.get("/delivery-statement")
      ]);
      if (sumRes.data.success) setSummaries(sumRes.data.data || []);
      if (dsRes.data.success) setDeliveryStatements(dsRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch aggregation data", error);
      toast.error("Failed to fetch ledger data for calculation");
    } finally {
      setAggLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchAggregationData();
  }, []);

  // Filtered lists by search query
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoiceList;
    const q = searchQuery.toLowerCase();
    return invoiceList.filter(inv =>
      String(inv.invoiceNo || "").toLowerCase().includes(q) ||
      String(inv.client?.name || "").toLowerCase().includes(q) ||
      String(inv.shipment?.shipmentId || "").toLowerCase().includes(q) ||
      String(inv.status || "").toLowerCase().includes(q)
    );
  }, [invoiceList, searchQuery]);

  // Aggregate values based on Selected Date Range
  const aggregatedValues = useMemo(() => {
    // 1. Filter Summary entries by date range
    const filteredSummaries = summaries.filter(reg => {
      const dateStr = (reg.date || "").split('T')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });

    let summaryCredit = 0;
    let summaryDebit = 0;

    filteredSummaries.forEach(reg => {
      (reg.entries || []).forEach((e: any) => {
        summaryCredit += parseFloat(e.credit) || 0;
        summaryDebit += parseFloat(e.debit) || 0;
      });
    });

    // 2. Filter Delivery Statements by date range
    const filteredDS = deliveryStatements.filter(reg => {
      const dateStr = (reg.dateSearch || "").split('T')[0];
      return dateStr >= startDate && dateStr <= endDate;
    });

    let dsFreight = 0;
    let dsLabour = 0;
    let dsStationery = 0;
    let dsCommission = 0;
    let dsDemurrage = 0;

    filteredDS.forEach(reg => {
      (reg.entries || []).forEach((e: any) => {
        dsFreight += parseFloat(e.freight) || 0;
        dsLabour += parseFloat(e.labour) || 0;
        dsStationery += parseFloat(e.receiptCh) || 0;
        dsCommission += parseFloat(e.dCom) || 0;
        dsDemurrage += parseFloat(e.demurage) || 0;
      });
    });

    const totalCredits = summaryCredit + dsFreight;
    const totalDebits = summaryDebit + dsLabour + dsStationery + dsCommission + dsDemurrage;
    const netReceivable = totalCredits - totalDebits;

    return {
      summaryCredit,
      summaryDebit,
      dsFreight,
      dsLabour,
      dsStationery,
      dsCommission,
      dsDemurrage,
      totalCredits,
      totalDebits,
      netReceivable,
      summariesCount: filteredSummaries.length,
      dsCount: filteredDS.length
    };
  }, [summaries, deliveryStatements, startDate, endDate]);

  const totalBilled = filteredInvoices.reduce((acc, curr) => acc + curr.total, 0);
  const pendingAmount = filteredInvoices.filter(inv => inv.status === 'unpaid').reduce((acc, curr) => acc + curr.total, 0);
  const paidAmount = filteredInvoices.filter(inv => inv.status === 'paid').reduce((acc, curr) => acc + curr.total, 0);

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const p = dateStr.split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : dateStr;
  };

  const getPrintStatementHTML = () => {
    const values = aggregatedValues;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SKRT ERP - Aggregated Invoice Statement</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #111; background: #fff; line-height: 1.5; }
          .header { text-align: center; border-bottom: 2px solid #2388ff; padding-bottom: 15px; margin-bottom: 25px; }
          .header h1 { font-size: 26px; color: #2388ff; margin: 0; text-transform: uppercase; font-weight: 900; }
          .header p { margin: 5px 0 0 0; font-size: 13px; color: #555; }
          .metadata { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
          .statement-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .statement-table th { background: #f2f4f7; padding: 10px; border: 1px solid #ddd; text-align: left; font-weight: bold; }
          .statement-table td { padding: 10px; border: 1px solid #ddd; }
          .section-title { font-weight: bold; background: #eaedf1; }
          .num { text-align: right; font-family: monospace; font-size: 14px; }
          .net-payable { font-size: 18px; font-weight: 900; color: #2388ff; border-top: 2.5px solid #2388ff; }
          .footer { margin-top: 60px; display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; }
        </style>
      </head>
      <body onload="window.print();">
        <div class="header">
          <h1>SANT KANWAR RAM TRANSPORT CORP. (BHL.)</h1>
          <p>Reconciliation Invoice Statement</p>
          <p>Period: ${formatDateDisplay(startDate)} to ${formatDateDisplay(endDate)}</p>
        </div>
        <div class="metadata">
          <div><strong>Report Generated:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>Registers Count:</strong> Summary: ${values.summariesCount} | DS: ${values.dsCount}</div>
        </div>
        
        <table class="statement-table">
          <thead>
            <tr>
              <th>Account Details & Breakdown</th>
              <th style="text-align:right; width: 25%;">Credits (Revenue)</th>
              <th style="text-align:right; width: 25%;">Debits (Expenses)</th>
            </tr>
          </thead>
          <tbody>
            <!-- Summary Values -->
            <tr class="section-title">
              <td colspan="3">A. Summary Register Adjustments</td>
            </tr>
            <tr>
              <td>Summary Credit</td>
              <td class="num">₹ ${values.summaryCredit.toFixed(2)}</td>
              <td class="num">—</td>
            </tr>
            <tr>
              <td>Summary Debit</td>
              <td class="num">—</td>
              <td class="num">₹ ${values.summaryDebit.toFixed(2)}</td>
            </tr>

            <!-- Delivery Statement Values -->
            <tr class="section-title">
              <td colspan="3">B. Delivery Statement Ledger</td>
            </tr>
            <tr>
              <td>Freight (Revenue Credit)</td>
              <td class="num">₹ ${values.dsFreight.toFixed(2)}</td>
              <td class="num">—</td>
            </tr>
            <tr>
              <td>Labour (Expense Debit)</td>
              <td class="num">—</td>
              <td class="num">₹ ${values.dsLabour.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Stationery (Expense Debit)</td>
              <td class="num">—</td>
              <td class="num">₹ ${values.dsStationery.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Commission (Expense Debit)</td>
              <td class="num">—</td>
              <td class="num">₹ ${values.dsCommission.toFixed(2)}</td>
            </tr>
            <tr>
              <td>A.O.C (Expense Debit)</td>
              <td class="num">—</td>
              <td class="num">₹ ${values.dsDemurrage.toFixed(2)}</td>
            </tr>

            <!-- Totals -->
            <tr style="font-weight: bold; background: #f9fbfd;">
              <td>SUBTOTALS</td>
              <td class="num" style="color: #10b981; font-weight: bold;">₹ ${values.totalCredits.toFixed(2)}</td>
              <td class="num" style="color: #ef4444; font-weight: bold;">₹ ${values.totalDebits.toFixed(2)}</td>
            </tr>

            <!-- Grand Total -->
            <tr class="net-payable">
              <td>NET RECONCILED AMOUNT (Receivable)</td>
              <td colspan="2" class="num" style="font-size: 20px; font-weight: 900; color: #2388ff;">₹ ${values.netReceivable.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div>Prepared By: SKRT ERP System</div>
          <div>Authorized Signature: _________________________</div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintStatement = () => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(getPrintStatementHTML());
    pw.document.close();
  };

  const handleDownloadPDFStatement = () => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    const html = getPrintStatementHTML().replace("</body>", `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
<script>window.onload=function(){html2pdf().set({margin:5,filename:'reconciliation-statement.pdf'}).from(document.body).save();};<\/script></body>`);
    pw.document.write(html);
    pw.document.close();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <Calculator className="w-8 h-8 text-[#2388ff]" />
              Billing & Invoices
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Manage client payments, run real-time reconciliation statements, and track revenues.</p>
          </div>
          <div className="flex gap-2">
            <CreateInvoiceDialog onInvoiceCreated={fetchInvoices} />
          </div>
        </div>

        {/* Aggregation Reconciliation Calculator */}
        <Card className="border-slate-800 bg-slate-900/40 backdrop-blur-md overflow-hidden relative shadow-2xl">
          <CardHeader className="bg-slate-900/60 border-b border-slate-800 py-4 px-6 flex flex-row items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-[#2388ff] flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Summary + Delivery Statement Aggregator
            </CardTitle>

            {/* Date range picker */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1">
                <Calendar className="w-3.5 h-3.5 text-[#2388ff]" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-white border-0 outline-none w-28 text-center"
                  style={{ colorScheme: "dark" }}
                />
                <span className="text-slate-500 font-bold px-1">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-white border-0 outline-none w-28 text-center"
                  style={{ colorScheme: "dark" }}
                />
              </div>

              <Button
                size="sm"
                onClick={fetchAggregationData}
                disabled={aggLoading}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 h-8"
              >
                {aggLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Refresh"}
              </Button>

              <Button
                size="sm"
                onClick={handlePrintStatement}
                className="bg-[#2388ff] hover:bg-[#2388ff]/90 text-white font-semibold h-8"
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Print Statement
              </Button>

              <Button
                size="sm"
                onClick={handleDownloadPDFStatement}
                className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 h-8"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Export PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {aggLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-[#2388ff]" />
                <p className="text-xs uppercase tracking-wider font-semibold">Running database aggregates...</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-12 gap-6 items-stretch">
                {/* Credits column */}
                <div className="md:col-span-5 bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-widest border-b border-slate-800 pb-2">Credits (Revenue)</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Summary Credit:</span>
                      <span className="text-white font-mono font-semibold">₹ {aggregatedValues.summaryCredit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">DS Freight:</span>
                      <span className="text-white font-mono font-semibold">₹ {aggregatedValues.dsFreight.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-slate-900 my-2" />
                    <div className="flex justify-between items-center text-emerald-400 font-extrabold">
                      <span>Total Credit:</span>
                      <span className="font-mono text-base">₹ {aggregatedValues.totalCredits.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Arithmetic sign */}
                <div className="md:col-span-2 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-lg text-slate-400">
                    &minus;
                  </div>
                </div>

                {/* Debits column */}
                <div className="md:col-span-5 bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
                  <h4 className="text-xs font-black uppercase text-rose-400 tracking-widest border-b border-slate-800 pb-2">Debits (Expenses Breakdown)</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Summary Debit:</span>
                      <span className="text-white font-mono font-semibold">₹ {aggregatedValues.summaryDebit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">DS Labour:</span>
                      <span className="text-white font-mono font-semibold">₹ {aggregatedValues.dsLabour.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">DS Stationery:</span>
                      <span className="text-white font-mono font-semibold">₹ {aggregatedValues.dsStationery.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">DS Commission:</span>
                      <span className="text-white font-mono font-semibold">₹ {aggregatedValues.dsCommission.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">DS A.O.C:</span>
                      <span className="text-white font-mono font-semibold">₹ {aggregatedValues.dsDemurrage.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-slate-900 my-2" />
                    <div className="flex justify-between items-center text-rose-400 font-extrabold">
                      <span>Total Debit:</span>
                      <span className="font-mono text-base">₹ {aggregatedValues.totalDebits.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Net Payable Highlight bar */}
                <div className="col-span-12 bg-gradient-to-r from-[#2388ff]/10 via-blue-900/10 to-transparent border border-[#2388ff]/30 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#2388ff]/20 text-[#2388ff] flex items-center justify-center shrink-0">
                      <Calculator className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Net Reconciled Amount</h4>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Summary + DS values within date range</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider mr-2">Reconciliation Total</span>
                    <span className={cn(
                      "text-2xl font-black tracking-wide font-mono",
                      aggregatedValues.netReceivable >= 0 ? "text-emerald-400" : "text-rose-500"
                    )}>
                      ₹ {aggregatedValues.netReceivable.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Existing Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="border-slate-800 bg-slate-900/40">
            <CardHeader className="p-4 pb-0"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Total Billed</CardTitle></CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-2xl font-black text-white">₹{(totalBilled).toLocaleString()}</div>
              <p className="text-[10px] text-emerald-400 mt-1 uppercase tracking-wider font-bold">Lifetime Billing Amount</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/40">
            <CardHeader className="p-4 pb-0"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Pending Collected</CardTitle></CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-2xl font-black text-yellow-500">₹{(pendingAmount).toLocaleString()}</div>
              <p className="text-[10px] text-muted-foreground mt-1">{filteredInvoices.filter(inv => inv.status === 'unpaid').length} invoices outstanding</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/40 border-l-rose-500 border-l-4">
            <CardHeader className="p-4 pb-0"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Pending Count</CardTitle></CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-2xl font-black text-rose-500">
                {filteredInvoices.filter(inv => inv.status === 'unpaid').length}
              </div>
              <p className="text-[10px] text-rose-400 mt-1 uppercase tracking-wider font-bold">Pending collections</p>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/40">
            <CardHeader className="p-4 pb-0"><CardTitle className="text-xs uppercase text-slate-500 font-bold tracking-wider">Paid Amount</CardTitle></CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-2xl font-black text-emerald-400">₹{(paidAmount).toLocaleString()}</div>
              <p className="text-[10px] text-emerald-500 mt-1 uppercase tracking-wider font-bold">High collection efficiency</p>
            </CardContent>
          </Card>
        </div>

        {/* Invoices List Card */}
        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <tr className="border-b border-slate-800 hover:bg-transparent text-slate-400">
                  <TableHead className="font-bold">Invoice No.</TableHead>
                  <TableHead className="font-bold">Client</TableHead>
                  <TableHead className="font-bold">Shipment ID</TableHead>
                  <TableHead className="font-bold">Amount</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {invoicesLoading && invoiceList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 animate-pulse text-slate-500 font-bold uppercase tracking-widest">Loading invoices...</TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                      <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.map((inv) => (
                  <TableRow key={inv._id} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                    <TableCell className="font-extrabold text-[#2388ff]">{inv.invoiceNo}</TableCell>
                    <TableCell className="text-slate-300 font-medium">{inv.client?.name}</TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">{inv.shipment?.shipmentId || "—"}</TableCell>
                    <TableCell className="font-bold text-white">₹{inv.total?.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "px-2.5 py-0.5 capitalize text-[10px] font-extrabold border",
                        inv.status === "paid" ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10" :
                          inv.status === "unpaid" ? "text-yellow-500 border-yellow-500/20 bg-yellow-500/10" :
                            "text-rose-500 border-rose-500/20 bg-rose-500/10"
                      )}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono">{new Date(inv.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-[#2388ff]/10 hover:text-[#2388ff]"
                          onClick={() => {
                            const pw = window.open("", "_blank");
                            if (!pw) return;
                            pw.document.write(`
                              <html>
                              <head>
                                <title>Invoice ${inv.invoiceNo}</title>
                                <style>
                                  body { font-family: Arial, sans-serif; padding: 40px; color: #111; line-height: 1.5; }
                                  .invoice-box { max-width: 800px; margin: auto; border: 1px solid #eee; padding: 30px; box-shadow: 0 0 10px rgba(0, 0, 0, .15); }
                                  .invoice-header { display: flex; justify-content: space-between; border-bottom: 2px solid #ddd; padding-bottom: 20px; margin-bottom: 20px; }
                                  .title { font-size: 24px; font-weight: bold; color: #2388ff; }
                                  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                  th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                                  th { background: #f2f4f7; }
                                  .total { text-align: right; font-weight: bold; font-size: 16px; margin-top: 20px; }
                                </style>
                              </head>
                              <body onload="window.print();">
                                <div class="invoice-box">
                                  <div class="invoice-header">
                                    <div>
                                      <div class="title">INVOICE</div>
                                      <div>SANT KANWAR RAM TRANSPORT CORP. (BHL.)</div>
                                    </div>
                                    <div style="text-align: right;">
                                      <div><strong>Invoice No:</strong> ${inv.invoiceNo}</div>
                                      <div><strong>Date:</strong> ${new Date(inv.createdAt).toLocaleDateString()}</div>
                                      <div><strong>Due Date:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "—"}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <strong>Bill To:</strong><br>
                                    ${inv.client?.name || "—"}<br>
                                    ${inv.client?.email || ""}<br>
                                    ${inv.client?.phone || ""}
                                  </div>
                                  <table>
                                    <thead>
                                      <tr>
                                        <th>Description</th>
                                        <th style="text-align: right;">Amount</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td>Shipment Carriage / Transport Services (Ref: ${inv.shipment?.shipmentId || "—"})</td>
                                        <td style="text-align: right;">₹ ${(inv.amount || 0).toLocaleString()}</td>
                                      </tr>
                                      <tr>
                                        <td>Tax (GST 18%)</td>
                                        <td style="text-align: right;">₹ ${(inv.tax || 0).toLocaleString()}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                  <div class="total">Total: ₹ ${(inv.total || 0).toLocaleString()}</div>
                                </div>
                              </body>
                              </html>
                            `);
                            pw.document.close();
                          }}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
