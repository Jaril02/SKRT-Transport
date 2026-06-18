"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Printer, Download, Save, Plus, X, Loader2, ArrowLeft, Search as SearchIcon, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { useHeader } from "@/context/HeaderContext";
import { fetchTemplate, fillTemplate } from "@/lib/template-utils";
import { generateAndSendPDF } from "@/lib/whatsapp";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

type ChallanRow = {
  id: number;
  grNo: string;
  pkg: string;
  dest: string;
  content: string;
  consignor: string;
  consignee: string;
  total: string;
  wt: string;
};

const emptyRow = (id: number): ChallanRow => ({
  id, grNo: "", pkg: "", dest: "", content: "", consignor: "", consignee: "", total: "", wt: ""
});

export default function ChallanPage() {
  const router = useRouter();
  const { searchQuery } = useHeader();
  const [date, setDate] = useState(today());
  const [challanNo, setChallanNo] = useState("");
  const [from, setFrom] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverList, setDriverList] = useState<any[]>([]);
  const [customVehicle, setCustomVehicle] = useState(false);
  const [customDriver, setCustomDriver] = useState(false);
  const vehicleList = useMemo(() => {
    const seen = new Set<string>();
    return driverList.filter(d => {
      if (!d.vehicleNumber || seen.has(d.vehicleNumber)) return false;
      seen.add(d.vehicleNumber);
      return true;
    });
  }, [driverList]);
  const driverMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of driverList) {
      if (d.vehicleNumber && !map.has(d.vehicleNumber)) {
        map.set(d.vehicleNumber, d.name);
      }
    }
    return map;
  }, [driverList]);

  const [rows, setRows] = useState<ChallanRow[]>([]);

  const rowMatches = (row: ChallanRow, q: string) => {
    if (!q.trim()) return false;
    const lower = q.toLowerCase();
    return Object.values(row).some((v) => String(v).toLowerCase().includes(lower));
  };

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rows;
    return rows.filter((r) => rowMatches(r, searchQuery));
  }, [rows, searchQuery]);

  const [fetchingGr, setFetchingGr] = useState<number | null>(null);

  const [charges, setCharges] = useState({
    commission: "",
    labour: "",
    gr: "",
    crossing: "",
    truckFreight: "",
    advance: "",
    tfCredit: "",
    totalToPay: "",
    otherCharge: "",
    lcdc: "",
    crossing2: "",
    doorDelivery: "",
    balanceFreight: "",
    note: ""
  });

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [waPhone, setWaPhone] = useState("");
  const [sendingWa, setSendingWa] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const getNextChallanNo = useCallback(async (): Promise<string> => {
    try {
      const { data } = await api.get("/challan");
      if (!data.success || !data.data || data.data.length === 0) {
        return "323";
      }
      let maxNum = 322;
      for (const c of data.data) {
        if (c.challanNo) {
          const match = String(c.challanNo).match(/\d+/);
          if (match) {
            const parsed = parseInt(match[0], 10);
            if (!isNaN(parsed) && parsed > maxNum) {
              maxNum = parsed;
            }
          }
        }
      }
      return String(maxNum + 1);
    } catch (err) {
      console.error("Error getting next challan number:", err);
      return "323";
    }
  }, []);

  const updateRow = (index: number, field: keyof ChallanRow, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, emptyRow(Date.now())]); // Use timestamp as unique id for new rows
  };

  const deleteRow = (index: number) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
  };

  const handleGrBlur = useCallback(async (idx: number, grNo: string) => {
    if (!grNo.trim()) return;
    setFetchingGr(idx);
    let entryData: any = null;
    let cmTotal: string | null = null;

    try {
      const { data } = await api.get(`/entry/grno/${encodeURIComponent(grNo.trim())}`);
      if (data.success && data.data) entryData = data.data;
    } catch { /* ignore */ }

    try {
      const cmRes = await api.get(`/cash-memo/grno/${encodeURIComponent(grNo.trim())}`);
      if (cmRes.data.success && cmRes.data.data) {
        cmTotal = String(cmRes.data.data.totalAmount || "");
      }
    } catch { /* ignore */ }

    setRows((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        pkg: entryData?.noOfPackages || updated[idx].pkg,
        dest: entryData?.to || updated[idx].dest,
        content: entryData?.contents || updated[idx].content,
        consignor: entryData?.consignor || updated[idx].consignor,
        consignee: entryData?.consignee || updated[idx].consignee,
        total: cmTotal ?? updated[idx].total,
      };
      return updated;
    });
    setFetchingGr(null);
  }, []);

  // Fetch next challan number on page load
  useEffect(() => {
    let active = true;
    getNextChallanNo().then(nextNo => {
      if (active) setChallanNo(nextNo);
    });
    return () => { active = false; };
  }, [getNextChallanNo]);

  // Fetch driver list
  useEffect(() => {
    api.get("/drivers/entry").then((res) => {
      if (res.data.success) setDriverList(res.data.data);
    }).catch(() => {});
  }, []);

  // Auto-detect custom vehicle/driver when driver list loads
  useEffect(() => {
    if (driverList.length > 0) {
      if (vehicleNo && !customVehicle) {
        const match = driverList.some(d => d.vehicleNumber === vehicleNo);
        if (!match) setCustomVehicle(true);
      }
      if (driverName && !customDriver) {
        const match = driverList.some(d => d.name === driverName);
        if (!match) setCustomDriver(true);
      }
    }
  }, [driverList, vehicleNo, driverName]);

  // Calculations
  const totalPkg = rows.reduce((sum, r) => sum + (parseFloat(r.pkg) || 0), 0);
  const totalWt = rows.reduce((sum, r) => sum + (parseFloat(r.wt) || 0), 0);

  const rowsTotal = rows.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);
  const chargeFields = ['commission','labour','gr','crossing','truckFreight','advance','tfCredit','totalToPay','otherCharge','lcdc','crossing2','balanceFreight'];
  const totalDeductions = chargeFields.reduce((sum, f) => sum + (parseFloat((charges as any)[f]) || 0), 0);
  const doorDelivery = parseFloat(charges.doorDelivery) || 0;

  const grandTotal = rowsTotal - totalDeductions + doorDelivery;

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        date,
        challanNo,
        from,
        vehicleNo,
        ownerName,
        driverName,
        entries: rows.map(({ id, ...rest }) => rest),
        ...charges
      };
      
      const res = await api.post("/challan", payload);
      if (res.data.success) {
        toast.success("Challan saved successfully.");

        // Reset complete challan form to blank
        setFrom("");
        setVehicleNo("");
        setOwnerName("");
        setDriverName("");
        setCustomVehicle(false);
        setCustomDriver(false);
        setRows([]); // Clear all table rows (0 rows)
        setCharges({
          commission: "",
          labour: "",
          gr: "",
          crossing: "",
          truckFreight: "",
          advance: "",
          tfCredit: "",
          totalToPay: "",
          otherCharge: "",
          lcdc: "",
          crossing2: "",
          doorDelivery: "",
          balanceFreight: "",
          note: ""
        });

        // Generate next challan number without page refresh
        const nextNo = await getNextChallanNo();
        setChallanNo(nextNo);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save challan.");
    } finally {
      setSaving(false);
    }
  };

  const buildChallanHtml = async (): Promise<string> => {
    const r = (v: any) => v || "";
    const formatDate = (ds: string) => {
      if (!ds) return "";
      const p = ds.split("-");
      return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : ds;
    };
    const tableRows = rows.map((row, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td style="text-align:center;">${r(row.grNo)}</td>
        <td style="text-align:center;">${r(row.pkg)}</td>
        <td>${r(row.dest)}</td>
        <td>${r(row.content)}</td>
        <td>${r(row.consignor)}</td>
        <td>${r(row.consignee)}</td>
        <td style="text-align:right;">${r(row.total)}</td>
        <td style="text-align:right;">${r(row.wt)}</td>
      </tr>
    `).join("");

    const template = await fetchTemplate("challan");
    return fillTemplate(template, {
      CHALLAN_NO: r(challanNo),
      DATE: formatDate(date),
      FROM: r(from),
      VEHICLE_NO: r(vehicleNo),
      OWNER_NAME: r(ownerName),
      DRIVER_NAME: r(driverName),
      TABLE_ROWS: tableRows,
      TOTAL_PKG: String(totalPkg),
      TOTAL_WT: totalWt.toFixed(1),
      GRAND_TOTAL: grandTotal.toFixed(2),
      TRUCK_FREIGHT: r(charges.truckFreight),
      ADVANCE: r(charges.advance),
      TF_CREDIT: r(charges.tfCredit),
      TOTAL_TO_PAY: r(charges.totalToPay),
      OTHER_CHARGE: r(charges.otherCharge),
      LCDC: r(charges.lcdc),
      CROSSING: r(charges.crossing2),
      DOOR_DELIVERY: r(charges.doorDelivery),
      BALANCE_FREIGHT: r(charges.balanceFreight),
      CHARGES_NOTE: r(charges.note),
    });
  };

  const handlePrint = async () => {
    const html = await buildChallanHtml();
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(html);
    pw.document.close();
  };

  const handleDownloadPDF = async () => {
    const html = await buildChallanHtml();
    const pw = window.open("", "_blank");
    if (!pw) return;
    const pdfHtml = html.replace("</body>", `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
<script>window.onload=function(){html2pdf().set({margin:10,filename:'challan.pdf',image:{type:'jpeg',quality:0.98},html2canvas:{scale:2,letterRendering:true},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(document.body).save();};<\/script></body>`);
    pw.document.write(pdfHtml);
    pw.document.close();
  };

  const handleWhatsApp = async () => {
    if (!waPhone.trim()) { toast.error("Enter a WhatsApp number"); return; }
    setSendingWa(true);
    try {
      const html = await buildChallanHtml();
      await generateAndSendPDF(waPhone, html, `challan-${challanNo}.pdf`, "portrait");
    } catch {
      // handled by generateAndSendPDF
    } finally {
      setSendingWa(false);
    }
  };

  return (
    <DashboardLayout>
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body > * { display: none !important; }
          #challan-printable { display: block !important; }
          #challan-action-bar { display: none !important; }
          .sidebar-layout, nav, header, footer { display: none !important; }
          #challan-printable .challan-wrapper {
            box-shadow: none !important;
            border: 2px solid #111 !important;
            background: #fff !important;
            max-width: 100% !important;
            margin: 0 !important;
            color: #000 !important;
          }
          #challan-printable .add-row-btn, #challan-printable .delete-btn { display: none !important; }
          #challan-printable input { background: transparent !important; color: #000 !important; border-bottom: 1px solid #555 !important; }
          #challan-printable th { background: #f0f0f0 !important; border: 1px solid #555 !important; color: #000 !important; }
          #challan-printable td { border: 1px solid #555 !important; color: #000 !important; }
          #challan-printable .totals-box { border: 2px solid #333 !important; background: transparent !important; }
          #challan-printable .text-[#2388ff], #challan-printable .text-rose-500 { color: #000 !important; }
          #challan-printable .bg-[#0b1220] { background: transparent !important; }
        }
      `}</style>

      <div className="space-y-6 px-4 md:px-8 py-4 md:py-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Challan</h2>
              <p className="text-muted-foreground flex items-center gap-2">
                Create and manage transport challans
                {searchQuery.trim() && <span className="text-xs font-mono text-[#2388ff]">{filteredRows.length} of {rows.length} rows</span>}
              </p>
            </div>
          </div>

          {/* Action bar */}
          <div id="challan-action-bar" className="flex flex-wrap items-center gap-3 justify-end">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 transition-all"
            >
              {saving ? <><Save className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save</>}
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="h-9 px-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-2 transition-all"
            >
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button
              size="sm"
              onClick={handleDownloadPDF}
              className="h-9 px-5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold flex items-center gap-2 transition-all"
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={waPhone}
                onChange={(e) => setWaPhone(e.target.value)}
                placeholder="Phone"
                className="h-9 w-28 bg-slate-800 border border-slate-700 rounded-lg px-2.5 text-xs text-white outline-none placeholder:text-slate-500"
              />
              <Button
                size="sm"
                onClick={handleWhatsApp}
                disabled={sendingWa || !waPhone.trim()}
                className="h-9 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition-all"
              >
                {sendingWa ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Challan Card */}
        <div className="flex justify-center w-full">
          <div id="challan-printable" ref={receiptRef} className="challan-wrapper w-full max-w-[1100px] rounded-xl border border-slate-800 bg-[#0b1220] shadow-xl font-mono mb-8 p-6 text-sm">

            {/* HEADER */}
            <div className="text-center border-b border-blue-900/50 pb-4 mb-4">
              <div className="text-[10px] tracking-widest text-[#2388ff] mb-2 opacity-80 uppercase">
                Subject to BHILWARA Jurisdiction
              </div>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="w-16 h-12 border border-[#2388ff]/40 rounded flex items-center justify-center text-[9px] text-[#2388ff]/80 text-center p-1 leading-tight shrink-0 uppercase font-bold">
                  SANT KANWAR<br />RAM<br />TRANSPORT
                </div>
                <div className="text-2xl md:text-3xl font-black tracking-wide text-rose-500 uppercase">
                  Sant Kanwar Ram Transport Corp. (BHL.)
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 mt-2 text-xs text-[#2388ff]">
                <span>123-124, Transport Nagar, BHILWARA - 311001 (RAJ.)</span>
                <span className="font-bold">Mob.: 96809-92567, 86196-06627</span>
              </div>
            </div>

            {/* FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-4">
              <div className="flex items-end gap-2 border-b border-slate-700/50 pb-1">
                <span className="text-xs font-bold text-[#2388ff] whitespace-nowrap">From BHILWARA  to</span>
                <input type="text" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="Destination city" className="flex-1 bg-transparent border-0 border-b border-blue-800 text-white text-xs outline-none px-1 py-0.5 placeholder:text-slate-500 placeholder:italic" />
              </div>
              <div className="flex items-end gap-2 border-b border-slate-700/50 pb-1">
                <span className="text-xs font-bold text-[#2388ff] whitespace-nowrap">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 bg-transparent border-0 border-b border-blue-800 text-white text-xs outline-none px-1 py-0.5" style={{ colorScheme: "dark" }} />
              </div>
              <div className="flex items-end gap-2 border-b border-slate-700/50 pb-1">
                <span className="text-xs font-bold text-[#2388ff] whitespace-nowrap">Challan No.</span>
                <input type="text" value={challanNo} onChange={(e) => setChallanNo(e.target.value)} placeholder="323" className="flex-1 bg-transparent border-0 border-b border-blue-800 text-white text-xs outline-none px-1 py-0.5 placeholder:text-slate-500 placeholder:italic" />
              </div>
              <div className="flex items-end gap-2 border-b border-slate-700/50 pb-1">
                <span className="text-xs font-bold text-[#2388ff] whitespace-nowrap">Vehicle No.</span>
                {customVehicle ? (
                  <>
                    <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="Enter vehicle number" className="flex-1 bg-transparent border-0 border-b border-blue-800 text-white text-xs outline-none px-1 py-0.5 placeholder:text-slate-500 placeholder:italic" />
                    <button type="button" onClick={() => { setCustomVehicle(false); setVehicleNo(""); }} className="text-[10px] text-[#2388ff] hover:text-blue-300 whitespace-nowrap shrink-0">List</button>
                  </>
                ) : (
                  <>
                    <select
                      value={vehicleNo}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "__others__") {
                          setCustomVehicle(true);
                          setVehicleNo("");
                          setDriverName("");
                        } else {
                          setVehicleNo(val);
                          const driver = driverMap.get(val);
                          setDriverName(driver || "");
                          if (driver && customDriver) setCustomDriver(false);
                        }
                      }}
                      className="flex-1 bg-[#0b1220] border-0 text-white text-xs outline-none px-1 py-0.5 appearance-none cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="" className="bg-[#0b1220] text-slate-500">Select vehicle...</option>
                      {vehicleList.map((d) => (
                        <option key={d._id} value={d.vehicleNumber} className="bg-[#0b1220] text-white">{d.vehicleNumber} — {d.name}</option>
                      ))}
                      <option value="__others__" className="bg-[#0b1220] text-slate-400">Others (custom entry)</option>
                    </select>
                  </>
                )}
              </div>
              <div className="flex items-end gap-2 border-b border-slate-700/50 pb-1">
                <span className="text-xs font-bold text-[#2388ff] whitespace-nowrap">Owner's Name</span>
                <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" className="flex-1 bg-transparent border-0 border-b border-blue-800 text-white text-xs outline-none px-1 py-0.5 placeholder:text-slate-500 placeholder:italic" />
              </div>
              <div className="flex items-end gap-2 border-b border-slate-700/50 pb-1 md:col-span-2">
                <span className="text-xs font-bold text-[#2388ff] whitespace-nowrap">Driver's Name</span>
                {customDriver ? (
                  <>
                    <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Enter driver name" className="flex-1 bg-transparent border-0 border-b border-blue-800 text-white text-xs outline-none px-1 py-0.5 placeholder:text-slate-500 placeholder:italic" />
                    <button type="button" onClick={() => { setCustomDriver(false); setDriverName(""); }} className="text-[10px] text-[#2388ff] hover:text-blue-300 whitespace-nowrap shrink-0">List</button>
                  </>
                ) : (
                  <select
                    value={driverName}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__others__") {
                        setCustomDriver(true);
                        setDriverName("");
                      } else {
                        const selected = driverList.find(d => d.name === val);
                        setDriverName(val);
                        if (selected) setVehicleNo(selected.vehicleNumber);
                      }
                    }}
                    className="flex-1 bg-[#0b1220] border-0 text-white text-xs outline-none px-1 py-0.5 appearance-none cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="" className="bg-[#0b1220] text-slate-500">Select a driver...</option>
                    {driverList.map((d) => (
                      <option key={d._id} value={d.name} className="bg-[#0b1220] text-white">{d.name}</option>
                    ))}
                    <option value="__others__" className="bg-[#0b1220] text-slate-400">Others (custom entry)</option>
                  </select>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 mb-4 leading-relaxed border-l-2 border-blue-800 pl-3">
              Driver of this vehicle is responsible for goods which is loaded in this truck for safe & sound delivery as per conditions mentioned overleaf.
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto mb-4 border border-slate-700 rounded-md">
              <table className="w-full min-w-[700px] border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/80">
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[5%]">S.No.</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[10%]">G.R. NO.</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[7%]">PKG.</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[14%]">DESTINATION</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[14%]">CONTENT</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[16%]">CONSIGNOR</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[16%]">CONSIGNEE</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[8%]">TOTAL</th>
                    <th className="border border-slate-700 text-[#2388ff] font-bold p-2 w-[7%]">WT</th>
                    <th className="border border-slate-700 text-[#2388ff] w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {(searchQuery.trim() ? filteredRows : rows).map((row, idx) => (
                    <tr key={row.id} className={cn("transition-colors", rowMatches(row, searchQuery) ? "bg-[#2388ff]/10" : "hover:bg-slate-800/30")}>
                      <td className="border border-slate-700 p-1 text-center font-bold text-slate-400 bg-slate-900/30">{idx + 1}</td>
                      <td className="border border-slate-700 p-0 relative">
                        <input
                          type="text"
                          value={row.grNo}
                          onBlur={() => handleGrBlur(idx, row.grNo)}
                          onChange={(e) => updateRow(idx, 'grNo', e.target.value)}
                          placeholder="GR No"
                          className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600"
                        />
                        {fetchingGr === idx && <Loader2 className="h-3 w-3 animate-spin text-[#2388ff] absolute right-1 top-1/2 -translate-y-1/2" />}
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="number" min="0" value={row.pkg} onChange={(e) => updateRow(idx, 'pkg', e.target.value)} placeholder="0" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.dest} onChange={(e) => updateRow(idx, 'dest', e.target.value)} placeholder="City" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.content} onChange={(e) => updateRow(idx, 'content', e.target.value)} placeholder="Item" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.consignor} onChange={(e) => updateRow(idx, 'consignor', e.target.value)} placeholder="Sender" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0">
                        <input type="text" value={row.consignee} onChange={(e) => updateRow(idx, 'consignee', e.target.value)} placeholder="Receiver" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0 bg-slate-900/40">
                        <input type="number" step="0.01" value={row.total} onChange={(e) => updateRow(idx, 'total', e.target.value)} placeholder="0.00" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0 bg-slate-900/40">
                        <input type="number" step="0.01" value={row.wt} onChange={(e) => updateRow(idx, 'wt', e.target.value)} placeholder="0.0" className="w-full h-full p-1.5 bg-transparent border-0 text-white text-center outline-none placeholder:text-slate-600" />
                      </td>
                      <td className="border border-slate-700 p-0 text-center">
                        <button onClick={() => deleteRow(idx)} className="delete-btn text-rose-500 hover:text-rose-400 p-1.5" title="Remove">
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={addRow} className="add-row-btn w-full block bg-transparent border border-dashed border-blue-900 text-blue-400 hover:bg-blue-900/20 hover:border-blue-500 hover:text-blue-300 font-bold p-2 text-xs rounded transition-all mb-6">
              <Plus className="h-3 w-3 inline mr-1" /> Add New Row
            </button>

            {/* CHARGES */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 border border-slate-700 bg-slate-900/20 rounded-md p-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">COMMISSION RS. & P.</label>
                <input type="number" step="0.01" value={charges.commission} onChange={(e) => setCharges({ ...charges, commission: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">LABOUR CHARGE RS.</label>
                <input type="number" step="0.01" value={charges.labour} onChange={(e) => setCharges({ ...charges, labour: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">G.R.</label>
                <input type="number" step="0.01" value={charges.gr} onChange={(e) => setCharges({ ...charges, gr: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">CROSSING / COLLECTION RS.</label>
                <input type="number" step="0.01" value={charges.crossing} onChange={(e) => setCharges({ ...charges, crossing: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">TRUCK FREIGHT</label>
                <input type="number" step="0.01" value={charges.truckFreight} onChange={(e) => setCharges({ ...charges, truckFreight: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">ADVANCE</label>
                <input type="number" step="0.01" value={charges.advance} onChange={(e) => setCharges({ ...charges, advance: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">T.F CREDITY</label>
                <input type="number" step="0.01" value={charges.tfCredit} onChange={(e) => setCharges({ ...charges, tfCredit: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">TOTAL TO PAY</label>
                <input type="number" step="0.01" value={charges.totalToPay} onChange={(e) => setCharges({ ...charges, totalToPay: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">OTHER CHARGE</label>
                <input type="number" step="0.01" value={charges.otherCharge} onChange={(e) => setCharges({ ...charges, otherCharge: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">LC/DC</label>
                <input type="number" step="0.01" value={charges.lcdc} onChange={(e) => setCharges({ ...charges, lcdc: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">CROSSING</label>
                <input type="number" step="0.01" value={charges.crossing2} onChange={(e) => setCharges({ ...charges, crossing2: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">DOOR DELIVERY</label>
                <input type="number" step="0.01" value={charges.doorDelivery} onChange={(e) => setCharges({ ...charges, doorDelivery: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">BALANCE FREIGHT</label>
                <input type="number" step="0.01" value={charges.balanceFreight} onChange={(e) => setCharges({ ...charges, balanceFreight: e.target.value })} placeholder="0.00" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-bold text-[#2388ff] uppercase">NOTE</label>
                <input type="text" value={charges.note} onChange={(e) => setCharges({ ...charges, note: e.target.value })} placeholder="Optional note" className="bg-transparent border-b border-blue-800 text-white text-sm outline-none py-1 placeholder:text-slate-600" />
              </div>
            </div>

            {/* TOTALS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 border-2 border-slate-700 bg-slate-800/50 p-4 rounded-md">
              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] font-bold text-[#2388ff] tracking-wide">TOTAL PACKAGES</div>
                <div className="text-2xl font-black text-rose-500">{totalPkg}</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] font-bold text-[#2388ff] tracking-wide">TOTAL WEIGHT</div>
                <div className="text-2xl font-black text-rose-500">{totalWt.toFixed(1)}</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-[10px] font-bold text-[#2388ff] tracking-wide">GRAND TOTAL (RS.)</div>
                <div className="text-2xl font-black text-rose-500">{grandTotal.toFixed(2)}</div>
              </div>
            </div>

            {/* FOOTER */}
            <div className="text-center text-xs text-slate-400 mb-4 tracking-wide">
              Quantity & Goods of this memo received in safe and sound condition
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-end border-t border-slate-700 pt-6 mt-2 gap-8">
              <div className="text-xs text-slate-400 leading-relaxed">
                GST No. :<br />
                <strong className="text-[#2388ff] text-sm tracking-widest">08AAHPN5613K1ZH</strong>
              </div>

              <div className="flex flex-col items-end gap-6 text-right w-full sm:w-auto">
                <div className="text-xs font-bold text-[#2388ff]">
                  FOR : Sant Kanwar Ram Transport Corp. (BHL.)
                </div>
                <div className="border-t border-slate-600 pt-1 text-xs text-slate-400 text-center w-48 mx-auto sm:mx-0">
                  Owner or Driver's Signature
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
