"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { FileText, Receipt, PlusSquare, Loader2, ChevronLeft, ChevronRight, Search, Download } from "lucide-react";
import { useHeader } from "@/context/HeaderContext";
import { ViewEditEntryDialog } from "@/components/entry/ViewEditEntryDialog";

import { toast } from "sonner";
import api from "@/lib/api";

const PER_PAGE = 30;

export default function InventoryPage() {
  const router = useRouter();
  const { searchQuery, setSearchQuery } = useHeader();
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/entry");
      if (data.success) {
        const flat: any[] = [];
        for (const reg of data.data) {
          for (const entry of (reg.entries || [])) {
            if (entry.grNo || entry.from || entry.to || entry.consignor || entry.consignee || entry.noOfPackages || entry.contents || entry.freight || entry.deliveryReceiptNo || entry.dateOfDelivery) {
              flat.push({
                ...entry,
                _registerId: reg._id,
                _registerDate: reg.dateSearch || "—",
                _registerPage: reg.pageNo || "—",
                _registerChallan: reg.challanNo || "",
                _registerVehicleNo: reg.vehicleNo || "",
                deliveryStatus: entry.deliveryStatus || (entry.dateOfDelivery ? "Complete" : "Pending"),
              });
            }
          }
        }
        setAllEntries(flat);
      }
    } catch (err) {
      console.error("Failed to fetch entry registers", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const [highlightVal, setHighlightVal] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const highlightParam = params.get("highlight");
      if (highlightParam) {
        setHighlightVal(highlightParam);
      } else {
        setHighlightVal(null);
      }
    }
  }, [fetchEntries]);

  const filtered = useMemo(() => {
    const sorted = [...allEntries].sort((a, b) => {
      const dateA = a._registerDate || "";
      const dateB = b._registerDate || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      const snoA = parseInt(a.sno, 10) || 0;
      const snoB = parseInt(b.sno, 10) || 0;
      return snoB - snoA;
    });
    const q = (localSearch || searchQuery).trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(e =>
      String(e.sno || "").toLowerCase().includes(q) ||
      String(e.grNo || "").toLowerCase().includes(q) ||
      String(e.deliveryReceiptNo || "").toLowerCase().includes(q)
    );
  }, [allEntries, searchQuery, localSearch]);

  useEffect(() => {
    if (highlightVal && allEntries.length > 0) {
      const matchedIdx = filtered.findIndex(
        e => e.grNo === highlightVal || e.deliveryReceiptNo === highlightVal || e.sno === highlightVal
      );
      if (matchedIdx !== -1) {
        const matchPage = Math.floor(matchedIdx / PER_PAGE) + 1;
        setPage(matchPage);

        const timer = setTimeout(() => {
          const elementId = `row-inventory-${highlightVal}`;
          const el = document.getElementById(elementId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("animate-row-blink");
            setTimeout(() => {
              el.classList.remove("animate-row-blink");
            }, 3000);
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightVal, allEntries, filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  useEffect(() => { setPage(1); }, [searchQuery]);

  const handlePrintCashMemo = () => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(`<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: Arial, sans-serif; }
    .page { border: 2px solid #000; width: 1000px; padding: 20px; margin: 20px auto; position: relative; }
    .header-top { display: flex; justify-content: space-between; align-items: center; }
    .dr-no { font-size: 18px; font-weight: bold; color: #333; }
    .contact { font-size: 14px; font-weight: bold; }
    .title { text-align: center; font-size: 24px; font-weight: bold; color: #000080; margin-top: 10px; }
    .subtitle { text-align: center; font-size: 16px; color: #000080; margin-bottom: 20px; }
    .form-line { display: flex; margin-bottom: 15px; align-items: center; }
    .label { font-weight: bold; width: 100px; }
    .input-line { border-bottom: 1px solid black; flex-grow: 1; height: 1.2em; }
    .table-container { border: 1px solid black; margin-top: 30px; width: 100%; }
    .table-container table { width: 100%; border-collapse: collapse; }
    .table-container th, .table-container td { text-align: left; padding: 8px; }
    .table-container th { border-bottom: 1px solid black; font-size: 18px; text-align: center; }
    .table-container tr { height: 30px; }
    .signature { text-align: right; margin-top: 40px; font-weight: bold; }
</style>
</head>
<body>
<div class="page">
    <div class="header-top">
        <div class="dr-no">D.R. No. <span style="color:red;">DR-___</span></div>
        <div class="header-title"><span style="font-weight:bold;font-size:18px;">CASH MEMO</span></div>
        <div style="font-size:11px; font-weight:bold; text-align: right; color:#000000; line-height: 1.4; padding-right: 10px; white-space: nowrap;">
            <span>Mob.: 96809-92567</span><br/>
            <span>Mob.: 86196-06627</span>
        </div>
    </div>
    <div class="title">Sant Kanwar Ram Transport Corp. (BHL.)</div>
    <div class="subtitle">123-124, Transport Nagar, BHILWARA - 311001 (Raj.)</div>
    <div class="form-line"><div class="label">G.R. No.</div><div class="input-line"></div><div style="width:110px;text-align:right;font-weight:bold;white-space:nowrap;padding-right:6px;">Received on</div><div class="input-line" style="width:200px;flex-shrink:0;"></div></div>
    <div class="form-line"><div class="label">From</div><div class="input-line"></div><div style="width:110px;text-align:right;font-weight:bold;white-space:nowrap;padding-right:6px;">Dt.</div><div class="input-line" style="width:200px;flex-shrink:0;"></div></div>
    <div class="form-line"><div class="label">Consignee</div><div class="input-line"></div></div>
    <div class="form-line"><div class="label">Through</div><div class="input-line"></div></div>
    <div class="table-container">
        <table>
            <thead><tr><th style="width:70%;"></th><th style="width:15%;">Rs.</th><th style="width:15%;">P.</th></tr></thead>
            <tbody>
                <tr><td>Freight</td><td style="border-left:1px solid black;"></td><td style="border-left:1px solid black;"></td></tr>
                <tr><td>Labour</td><td style="border-left:1px solid black;"></td><td style="border-left:1px solid black;"></td></tr>
                <tr><td>Stationery</td><td style="border-left:1px solid black;">5</td><td style="border-left:1px solid black;">00</td></tr>
                <tr><td>Commission</td><td style="border-left:1px solid black;"></td><td style="border-left:1px solid black;"></td></tr>
                <tr><td>A.O.C.</td><td style="border-left:1px solid black;">5</td><td style="border-left:1px solid black;"></td></tr>
                <tr style="border-top:1px solid black;"><td style="font-weight:bold;">Total</td><td style="border-left:1px solid black;"></td><td style="border-left:1px solid black;"></td></tr>
            </tbody>
        </table>
    </div>
    <div class="signature">D. Clerk</div>
</div>
</body>
</html>`);
    pw.document.close();
  };

  const exportCSV = () => {
    const headers = ["S.No.", "From", "To", "G. R. No.", "Consignor", "Consignee", "No. of Packages", "Contents", "Freight", "Delivery Receipt No.", "Date of Delivery", "Delivery Status"];
    const rows = filtered.map((entry: any, idx: number) => [
      filtered.length - idx,
      entry.from || "",
      entry.to || "",
      entry.grNo || "",
      entry.consignor || "",
      entry.consignee || "",
      entry.noOfPackages || "",
      entry.contents || "",
      entry.freight || "",
      entry.deliveryReceiptNo || "",
      entry.dateOfDelivery || "",
      entry.deliveryStatus || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" +
      [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventory data exported successfully");
  };

  return (
    <DashboardLayout>
      <style>{`
        @keyframes row-blink {
          0%, 100% { background-color: transparent; }
          25%, 75% { background-color: rgba(35, 136, 255, 0.4); }
          50% { background-color: rgba(35, 136, 255, 0.15); }
        }
        .animate-row-blink {
          animation: row-blink 1.2s ease-in-out 2 !important;
        }
      `}</style>
      <div className="space-y-6 px-8 py-8 h-full max-w-full">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
            <p className="text-muted-foreground">All delivery register records</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              onClick={() => router.push("/cash-memo")}
              className="h-9 px-4 rounded-lg bg-slate-800 text-slate-200 hover:bg-blue-600 hover:text-white border border-slate-700 font-medium transition-all duration-200 flex items-center gap-2"
            >
              <Receipt className="h-4 w-4" /> Cash Memo
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/entry")}
              className="h-9 px-4 rounded-lg bg-slate-800 text-slate-200 hover:bg-violet-600 hover:text-white border border-slate-700 font-medium transition-all duration-200 flex items-center gap-2"
            >
              <PlusSquare className="h-4 w-4" /> Entry
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/summary")}
              className="h-9 px-4 rounded-lg bg-slate-800 text-slate-200 hover:bg-emerald-600 hover:text-white border border-slate-700 font-medium transition-all duration-200 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" /> Summary
            </Button>
            <Button
              size="sm"
              onClick={() => router.push("/delivery-statement")}
              className="h-9 px-4 rounded-lg bg-slate-800 text-slate-200 hover:bg-cyan-600 hover:text-white border border-slate-700 font-medium transition-all duration-200 flex items-center gap-2"
            >
              <FileText className="h-4 w-4" /> Delivery Statement
            </Button>
            <Button
              size="sm"
              onClick={exportCSV}
              className="h-9 px-4 rounded-lg bg-emerald-800 text-emerald-200 hover:bg-emerald-600 hover:text-white border border-emerald-700 font-medium transition-all duration-200 flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Download
            </Button>
          </div>
        </div>

        {/* Search by S.No, G.R. No., Delivery Receipt No. */}
        <div className="flex items-center gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => { setLocalSearch(e.target.value); setPage(1); }}
              placeholder="Search by S.No, G.R. No, Delivery Receipt No..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm outline-none focus:border-[#2388ff] transition-colors"
            />
          </div>
          {localSearch && (
            <button onClick={() => setLocalSearch("")} className="h-9 px-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors text-xs font-medium">
              Clear
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading entries...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {localSearch || searchQuery ? "No matching entries found." : "No entries found."}
          </div>
        ) : (
          <div className="w-full flex justify-center">
            <div className="w-full max-w-[1450px] rounded-xl border border-slate-800 bg-[#0b1220] shadow-xl p-8 relative overflow-hidden">
              <div className="overflow-x-auto border border-slate-700 rounded-md bg-slate-900/40">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-800 border-b-2 border-[#2388ff]/60">
                      <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[4%]">S.No.</th>
                      <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[6%]">From</th>
                      <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[6%]">To</th>
                      <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[7%]">G. R. No.</th>
                      <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[10%]">Consignor</th>
                      <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[10%]">Consignee</th>
                      <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[7%]">No. of<br />Packages</th>
                      <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[10%]">Contents</th>
                      <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[6%]">Freight</th>
                      <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[10%]">Delivery Receipt No.</th>
                      <th className="border-r border-slate-700 text-[#2388ff] uppercase font-bold p-2 w-[10%]">Date of Delivery</th>
                      <th className="text-[#2388ff] uppercase font-bold p-2 w-[8%]">Delivery Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((entry: any, idx: number) => (
                      <tr
                        key={entry._id || idx}
                        id={
                          entry.grNo === highlightVal
                            ? `row-inventory-${entry.grNo}`
                            : entry.deliveryReceiptNo === highlightVal
                            ? `row-inventory-${entry.deliveryReceiptNo}`
                            : entry.sno === highlightVal
                            ? `row-inventory-${entry.sno}`
                            : undefined
                        }
                        onClick={() => { setSelectedEntry(entry); setDialogOpen(true); }}
                        className={`cursor-pointer hover:bg-slate-800/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-slate-900/40'}`}
                      >
                        <td className="border border-slate-700 text-center font-mono text-slate-400 bg-slate-900/50 p-1.5">
                          {filtered.length - ((currentPage - 1) * PER_PAGE + idx)}
                        </td>
                        <td className="border border-slate-700 p-1.5 text-white">{entry.from}</td>
                        <td className="border border-slate-700 p-1.5 text-white">{entry.to}</td>
                        <td className="border border-slate-700 p-1.5 font-mono text-white">{entry.grNo}</td>
                        <td className="border border-slate-700 p-1.5 text-white max-w-[120px] truncate" title={entry.consignor}>{entry.consignor}</td>
                        <td className="border border-slate-700 p-1.5 text-white max-w-[120px] truncate" title={entry.consignee}>{entry.consignee}</td>
                        <td className="border border-slate-700 p-1.5 text-white text-center">{entry.noOfPackages}</td>
                        <td className="border border-slate-700 p-1.5 text-white max-w-[120px] truncate" title={entry.contents}>{entry.contents}</td>
                        <td className="border border-slate-700 p-1.5 font-mono text-white text-right">{entry.freight}</td>
                        <td className="border border-slate-700 p-1.5 font-mono text-white">{entry.deliveryReceiptNo}</td>
                        <td className="border border-slate-700 p-1.5 text-white">{entry.dateOfDelivery}</td>
                        <td className="border border-slate-700 p-1.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entry.deliveryStatus === "Complete"
                              ? "bg-emerald-900/50 text-emerald-400"
                              : "bg-amber-900/50 text-amber-400"
                            }`}>
                            {entry.deliveryStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-xs text-slate-400">
                  <span>{filtered.length} total entries</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={currentPage <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="h-7 px-2 text-slate-400 hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-mono">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={currentPage >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="h-7 px-2 text-slate-400 hover:text-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ViewEditEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        entry={selectedEntry}
        onEntryUpdated={fetchEntries}
      />
    </DashboardLayout>
  );
}
