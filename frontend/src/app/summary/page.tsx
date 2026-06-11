"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Printer, X, Plus, Trash2, Save, Edit as EditIcon, Loader2, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useHeader } from "@/context/HeaderContext";
import { cn } from "@/lib/utils";

type SummaryRow = {
  id?: number | string;
  sno: string;
  truckNo: string;
  driverName: string;
  from: string;
  to: string;
  transportName: string;
  challanNo: string;
  totalCount: string;
  fareDelivery: string;
  crossing: string;
  crossingFare: string;
  labor: string;
  deliveryCommission: string;
  credit: string;
  debit: string;
  note: string;
  note2: string;
};

const emptyRow = (id: number, sno?: string): SummaryRow => ({
  id, sno: sno || "", truckNo: "", driverName: "", from: "", to: "",
  transportName: "", challanNo: "", totalCount: "", fareDelivery: "",
  crossing: "", crossingFare: "", labor: "", deliveryCommission: "",
  credit: "", debit: "", note: "", note2: ""
});

/* ── Field helper (defined OUTSIDE component to prevent remount on every keystroke) ── */
const SlipField = ({
  label, value, onChange, placeholder, isCurrency
}: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; isCurrency?: boolean;
}) => (
  <div className="flex items-center gap-2 min-h-[32px]">
    <span className="text-[11px] font-bold text-[#2388ff] whitespace-nowrap" style={{ minWidth: 110 }}>
      {label}
    </span>
    <div className="flex-1 relative min-w-0">
      <div className="absolute bottom-0 left-0 right-0 border-b border-dotted border-blue-800/50" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder || "—"}
        className="w-full bg-transparent border-0 text-[13px] font-semibold text-white outline-none py-1 px-1 relative z-10 placeholder:text-slate-600/60"
      />
    </div>
  </div>
);

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function SummaryPage() {
  const router = useRouter();
  const { searchQuery } = useHeader();
  const [date] = useState(today());
  const [matchCount, setMatchCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [vehicleList, setVehicleList] = useState<string[]>([]);
  const [driverMap, setDriverMap] = useState<Record<string, string>>({});
  const [customVehicleRows, setCustomVehicleRows] = useState<Set<number>>(new Set());

  const getMaxSno = async (): Promise<number> => {
    try {
      const { data } = await api.get("/summary");
      if (!data.success) return 0;
      let maxSno = 0;
      for (const reg of data.data) {
        for (const entry of (reg.entries || [])) {
          const num = parseInt(entry.sno, 10);
          if (!isNaN(num) && num > maxSno) maxSno = num;
        }
      }
      return maxSno;
    } catch {
      return 0;
    }
  };

  useEffect(() => {
    (async () => {
      const maxSno = await getMaxSno();
      setRows(Array.from({ length: 1 }, (_, i) => emptyRow(Date.now() + i, String(maxSno + i + 1))));
      setInitialized(true);
    })();
  }, []);

  // Fetch drivers for vehicle dropdown + driver name auto-fill
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/drivers/entry');
        if (res.data.success) {
          const seen = new Set<string>();
          const vehicles: string[] = [];
          const map: Record<string, string> = {};
          res.data.data.forEach((d: any) => {
            if (d.vehicleNumber && !seen.has(d.vehicleNumber)) {
              seen.add(d.vehicleNumber);
              vehicles.push(d.vehicleNumber);
              map[d.vehicleNumber] = d.name;
            }
          });
          setVehicleList(vehicles);
          setDriverMap(map);
        }
      } catch {
        // silently fail
      }
    })();
  }, []);

  // Search highlighting
  useEffect(() => {
    if (!searchQuery.trim()) { setMatchCount(0); return; }
    const lowerQ = searchQuery.toLowerCase();
    let count = 0;
    rows.forEach(r => {
      if (Object.values(r).some(val => String(val).toLowerCase().includes(lowerQ))) count++;
    });
    setMatchCount(count);
  }, [searchQuery, rows]);

  const rowMatches = (row: SummaryRow, q: string) => {
    if (!q.trim()) return false;
    const lower = q.toLowerCase();
    return Object.values(row).some((v) => String(v).toLowerCase().includes(lower));
  };

  const updateRow = (index: number, field: keyof SummaryRow, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };

    if (field === 'sno') {
      const newRows2 = [...newRows];
      const startNum = parseInt(newRows2[index].sno, 10);
      if (!isNaN(startNum)) {
        for (let i = index + 1; i < newRows2.length; i++) {
          newRows2[i] = { ...newRows2[i], sno: String(startNum + (i - index)) };
        }
      }
      setRows(newRows2);
    } else {
      setRows(newRows);
    }
  };

  const addRow = () => {
    setRows(prev => [
      ...prev,
      emptyRow(Date.now(), String(prev.length + 1))
    ]);
  };

  const deleteRow = (index: number) => setRows(rows.filter((_, i) => i !== index));

  const deleteLastRow = () => {
    if (rows.length === 0) return;
    setRows(rows.slice(0, -1));
  };

  const clearAll = async () => {
    if (confirm("Clear all entries?")) {
      const maxSno = await getMaxSno();
      setRows(Array.from({ length: 1 }, (_, i) => emptyRow(Date.now() + i, String(maxSno + i + 1))));
    }
  };

  const formatDateDisplay = (ds: string) => {
    if (!ds) return "";
    const p = ds.split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : ds;
  };

  const getSlipTotal = (r: SummaryRow) => {
    const fareDelivery = parseFloat(r.fareDelivery) || 0;
    const crossingFare = parseFloat(r.crossingFare) || 0;
    const deliveryCommission = parseFloat(r.deliveryCommission) || 0;
    const crossing = parseFloat(r.crossing) || 0;
    const labor = parseFloat(r.labor) || 0;
    return fareDelivery + crossingFare + deliveryCommission - crossing - labor;
  };

  const buildSummaryHtml = () => {
    const formatDate = (ds: string) => {
      if (!ds) return "";
      const p = ds.split("-");
      return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : ds;
    };
    const filledRows = rows.filter(r =>
      r.truckNo || r.driverName || r.from || r.to ||
      r.transportName || r.challanNo || r.totalCount ||
      r.fareDelivery || r.crossing || r.crossingFare ||
      r.labor || r.deliveryCommission || r.credit || r.debit || r.note || r.note2
    );
    const slipsHtml = filledRows.map((r, idx) => {
      const credit = parseFloat(r.credit) || 0;
      const debit = parseFloat(r.debit) || 0;
      const total = getSlipTotal(r);
      return `
      <div class="slip-paper">
        <div class="slip-contacts">
          <span class="mob-left">Mob. 96809-92567</span>
          <span class="mob-right">Mob.: 86196-06627</span>
        </div>
        <div class="slip-tagline">All disputes subject to Bhilwara jurisdiction</div>
        <div class="slip-headers">
          <h2 class="company-title-en">SANT KANWAR RAM TRANSPORT CORP. (BHL.)</h2>
          <p class="company-address">Bhilwara - 311001 (Raj.)</p>
        </div>
        <div class="slip-subtitle-container">
          <div class="subtitle-line"></div>
          <span class="slip-subtitle">SUMMARY</span>
          <div class="subtitle-line"></div>
        </div>
        <div class="slip-metadata">
          <div class="meta-item serial">
            <span class="label">No.</span>
            <span class="colon">:</span>
            <span class="value stamped-num">${r.sno || idx + 1}</span>
          </div>
          <div class="meta-item date">
            <span class="label">Date</span>
            <span class="dotted-spacer-inline"></span>
            <span class="value written-text">${formatDate(date)}</span>
          </div>
        </div>
        <div class="slip-fields-grid">
          <div class="field-row double">
            <div class="field-col">
              <span class="field-label">Truck No.</span>
              <span class="dotted-underlines-spacer"></span>
              <span class="field-value written-text">${r.truckNo}</span>
            </div>
            <div class="field-col">
              <span class="field-label">Driver Name</span>
              <span class="dotted-underlines-spacer"></span>
              <span class="field-value written-text">${r.driverName}</span>
            </div>
          </div>
          <div class="field-row double">
            <div class="field-col">
              <span class="field-label">From</span>
              <span class="dotted-underlines-spacer"></span>
              <span class="field-value written-text">${r.from}</span>
            </div>
            <div class="field-col">
              <span class="field-label">To</span>
              <span class="dotted-underlines-spacer"></span>
              <span class="field-value written-text">${r.to}</span>
            </div>
          </div>
          <div class="field-row double">
            <div class="field-col">
              <span class="field-label">Transport Name</span>
              <span class="dotted-underlines-spacer"></span>
              <span class="field-value written-text">${r.transportName}</span>
            </div>
            <div class="field-col">
              <span class="field-label">Challan No.</span>
              <span class="dotted-underlines-spacer"></span>
              <span class="field-value written-text">${r.challanNo}</span>
            </div>
          </div>
          <div class="field-row single">
            <div class="field-col">
              <span class="field-label">Total Count</span>
              <span class="dotted-underlines-spacer"></span>
              <span class="field-value written-text">${r.totalCount}</span>
            </div>
          </div>
          <div class="field-row double">
            <div class="field-col">
              <span class="field-label">Fare Delivery</span>
              <span class="dotted-underlines-spacer"></span>
              <span class="field-value written-text currency">${r.fareDelivery}</span>
            </div>
            <div class="field-col">
              <span class="field-label">Crossing</span>
              <span class="dotted-underlines-spacer"></span>
              <span class="field-value written-text currency">${r.crossing}</span>
            </div>
          </div>
          <div class="field-row double">
            <div class="field-col">
              <span class="field-label">Crossing Fare</span>
              <span class="dotted-underlines-spacer"></span>
              <span class="field-value written-text currency">${r.crossingFare}</span>
            </div>
            <div class="field-col">
              <span class="field-label">Labor</span>
              <span class="dotted-underlines-spacer"></span>
              <span class="field-value written-text currency">${r.labor}</span>
            </div>
          </div>
          <!-- DELIVERY COMMISSION -->
<div style="padding:4px 0;width:100%;">
  <div style="
    display:flex;
    align-items:center;
    width:100%;
    gap:10px;
    font-size:14.5px;
    font-weight:700;
  ">
    <span style="white-space:nowrap;">
      Delivery Commission
    </span>
    <div style="
      flex:1;
      border-bottom:1px dotted #000;
      position:relative;
      height:24px;
    ">
      <span style="
        position:absolute;
        left:10px;
        top:-2px;
        padding:0 4px;
      ">
        ₹ ${r.deliveryCommission}
      </span>
    </div>
  </div>
</div>
<!-- NOTE -->
<div style="padding:4px 0;width:100%;">
  <div style="display:flex;align-items:center;width:100%;gap:10px;font-size:14.5px;font-weight:700;">
    <span style="white-space:nowrap;">Note</span>
    <div style="flex:1;border-bottom:1px dotted #000;position:relative;height:24px;">
      <span style="position:absolute;left:10px;top:-2px;padding:0 4px;">${r.note || '—'}</span>
    </div>
  </div>
</div>
<!-- ADJUSTMENTS separator -->
<div style="display:flex;align-items:center;gap:8px;padding:6px 0 2px 0;">
  <div style="flex:1;height:1px;background:rgba(0,0,0,0.15);"></div>
  <span style="font-size:9px;font-weight:700;letter-spacing:3px;text-transform:uppercase;opacity:0.5;">Adjustments</span>
  <div style="flex:1;height:1px;background:rgba(0,0,0,0.15);"></div>
</div>
<!-- CREDIT -->
<div style="padding:4px 0;width:100%;">
  <div style="display:flex;align-items:center;width:100%;gap:10px;font-size:14.5px;font-weight:700;">
    <span style="white-space:nowrap;">Credit</span>
    <div style="flex:1;border-bottom:1px dotted #000;position:relative;height:24px;">
      <span style="position:absolute;left:10px;top:-2px;padding:0 4px;">${r.credit ? '₹ ' + r.credit : '—'}</span>
    </div>
  </div>
</div>
<!-- DEBIT -->
<div style="padding:4px 0;width:100%;">
  <div style="display:flex;align-items:center;width:100%;gap:10px;font-size:14.5px;font-weight:700;">
    <span style="white-space:nowrap;">Debit</span>
    <div style="flex:1;border-bottom:1px dotted #000;position:relative;height:24px;">
      <span style="position:absolute;left:10px;top:-2px;padding:0 4px;">${r.debit ? '₹ ' + r.debit : '—'}</span>
    </div>
  </div>
</div>
<!-- NOTE -->
<div style="padding:4px 0;width:100%;">
  <div style="display:flex;align-items:center;width:100%;gap:10px;font-size:14.5px;font-weight:700;">
    <span style="white-space:nowrap;">Note</span>
    <div style="flex:1;border-bottom:1px dotted #000;position:relative;height:24px;">
      <span style="position:absolute;left:10px;top:-2px;padding:0 4px;">${r.note2 || '—'}</span>
    </div>
  </div>
</div>
<!-- GRAND TOTAL -->
<div style="padding:8px 0;width:100%;border-top:1.5px solid var(--slip-ink-print);margin-top:10px;">
  <div style="display:flex;align-items:center;width:100%;justify-content:space-between;font-size:16px;font-weight:900;">
    <span style="text-transform:uppercase;letter-spacing:1px;">Grand Total</span>
    <span>₹ ${total > 0 ? total.toFixed(2) : '—'}</span>
  </div>
</div>
        </div>
        <div class="slip-footer">
          <div class="signature-driver">Driver Signature</div>
          <div class="signature-company">For Sant Kanwar Ram Transport Corp. (BHL.)</div>
        </div>
      </div>`;
    }).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Summary</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hind:wght@400;500;700&family=Kalam:wght@700&family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --slip-paper-bg: #ffaec1;
      --slip-paper-gradient: linear-gradient(135deg, #ffb8c8 0%, #ffa3b7 100%);
      --slip-ink-print: #111e54;
      --slip-ink-write-blue: #0b22a2;
      --slip-ink-stamp: #d32f2f;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Poppins', sans-serif; background: #f3f4f6; padding: 20px; }
    .no-print { text-align: center; margin-bottom: 20px; }
    .no-print button { background: #111e54; color: #fff; border: none; padding: 10px 30px; font-size: 14px; font-weight: 600; border-radius: 6px; cursor: pointer; }
    .slip-paper {
      width: 600px; height: 850px;
      background: var(--slip-paper-bg);
      background-image: var(--slip-paper-gradient);
      color: var(--slip-ink-print);
      border-radius: 2px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.4), 0 5px 15px rgba(0,0,0,0.2);
      position: relative;
      padding: 30px 40px;
      display: flex;
      flex-direction: column;
      margin: 0 auto 60px;
      page-break-after: always;
    }
    .slip-contacts { display: flex; justify-content: space-between; font-size: 13px; font-weight: 500; margin-bottom: 4px; letter-spacing: 0.5px; }
    .slip-tagline { text-align: center; font-size: 11px; font-family: 'Hind', sans-serif; font-weight: 500; margin-bottom: 6px; }
    .slip-headers { text-align: center; display: flex; flex-direction: column; gap: 4px; }
    .company-title-en { font-family: 'Poppins', sans-serif; font-size: 18.5px; font-weight: 800; letter-spacing: 0.3px; }
    .company-address { font-family: 'Hind', sans-serif; font-size: 13.5px; font-weight: 500; }
    .slip-subtitle-container { display: flex; align-items: center; justify-content: center; margin: 12px 0 16px 0; }
    .subtitle-line { flex-grow: 1; height: 1.5px; background-color: var(--slip-ink-print); }
    .slip-subtitle { font-family: 'Hind', sans-serif; font-size: 17px; font-weight: 700; padding: 0 16px; letter-spacing: 1px; }
    .slip-metadata { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; font-size: 14px; }
    .meta-item { display: flex; align-items: flex-end; position: relative; }
    .meta-item.serial { font-family: 'Hind', sans-serif; font-weight: 700; }
    .meta-item.serial .colon { margin: 0 15px; font-weight: 400; }
    .meta-item.date { font-family: 'Hind', sans-serif; font-weight: 700; flex-grow: 1; max-width: 250px; justify-content: flex-end; }
    .dotted-spacer-inline { flex-grow: 1; border-bottom: 1.5px dotted var(--slip-ink-print); height: 1px; margin: 0 10px 4px 10px; opacity: 0.7; }
    .stamped-num { font-family: 'Poppins', sans-serif; font-size: 22px; font-weight: 800; color: var(--slip-ink-stamp); letter-spacing: 1px; display: inline-block; transform: rotate(-3deg) scale(1.05); margin-left: 2px; text-shadow: 0.5px 0.5px 0px rgba(0,0,0,0.1); }
    .slip-fields-grid { display: flex; flex-direction: column; gap: 16px; flex-grow: 1; }
    .field-row { display: flex; gap: 24px; width: 100%; }
    .field-row.double .field-col { width: 50%; }
    .field-row.single .field-col { width: 100%; }
    .field-row.indent-more { padding-left: 15%; }
    .field-col { display: flex; position: relative; align-items: flex-end; flex-grow: 1; }
    .field-col {
        display: flex;
        align-items: center;
        flex-grow: 1;
        gap: 8px;
      }

      .field-label {
        font-family: 'Hind', sans-serif;
        font-weight: 700;
        font-size: 14.5px;
        white-space: nowrap;
        min-width: 65px;
      }

      .dotted-underlines-spacer {
        flex-grow: 1;
        border-bottom: 1.5px dotted var(--slip-ink-print);
        height: 1px;
        margin-top: 10px;
      }

      .written-text {
        position: absolute;
        left: 120px;   /* adjust according to label */
        bottom: 2px;
        font-family: Arial, sans-serif;
        font-size: 15px;
        font-weight: 700;
        color: #000;
        background: transparent;
        padding: 0 4px;
        max-width: 60%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    .written-text.currency:not(:empty)::before { content: "₹ "; font-size: 15px; font-family: 'Poppins', sans-serif; font-weight: 500; }
    .slip-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; margin-bottom: 10px; font-family: 'Hind', sans-serif; font-weight: 700; font-size: 14px; }
    @media print {
      body { background: #fff; padding: 0; }
      .no-print { display: none !important; }
      .slip-paper { box-shadow: none; border: none; margin: 0 auto; page-break-after: always; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .stamped-num { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .written-text { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button onclick="window.print()">Print Summary</button>
  </div>
  ${slipsHtml}
</body>
</html>`;
  };

  const handlePrint = () => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    pw.document.write(buildSummaryHtml());
    pw.document.close();
  };

  const handleDownloadPDF = () => {
    const pw = window.open("", "_blank");
    if (!pw) return;
    const html = buildSummaryHtml().replace("</body>", `<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
<script>window.onload=function(){html2pdf().set({margin:5,filename:'summary-register.pdf'}).from(document.body).save();};<\/script></body>`);
    pw.document.write(html);
    pw.document.close();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const filledRows = rows.filter(r =>
        r.truckNo || r.driverName || r.from || r.to ||
        r.transportName || r.challanNo || r.totalCount ||
        r.fareDelivery || r.crossing || r.crossingFare ||
        r.labor || r.deliveryCommission || r.credit || r.debit || r.note || r.note2
      );

      // Removed Credit/Debit exclusivity validation check

      const entriesForApi = filledRows.map(({ id, ...rest }) => {
        const credit = parseFloat(rest.credit) || 0;
        const debit = parseFloat(rest.debit) || 0;
        const grandTotal = getSlipTotal(rest as SummaryRow);
        return {
          ...rest,
          credit,
          debit,
          grandTotal
        };
      });

      const payload = { date, entries: entriesForApi };
      await api.post("/summary", payload);
      toast.success("Summary saved successfully.");
      const maxSno = await getMaxSno();
      setRows(Array.from({ length: 1 }, (_, i) => emptyRow(Date.now() + i, String(maxSno + i + 1))));
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save summary.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPrint = async () => {
    const success = await handleSave();
    if (success) {
      handlePrint();
    }
  };

  const isMatch = (row: SummaryRow) => {
    if (!searchQuery.trim()) return false;
    const lowerQ = searchQuery.toLowerCase();
    return Object.values(row).some(val => String(val).toLowerCase().includes(lowerQ));
  };

  return (
    <DashboardLayout>
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body > * { display: none !important; }
          .summary-slip-grid { display: block !important; }
          .print-hide { display: none !important; }
          .sidebar-layout, nav, header, footer { display: none !important; }
          .slip-card { break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; border: 1px solid #333 !important; }
        }
      `}</style>

      <div className="space-y-6 px-4 md:px-8 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="h-9 w-9 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Summary</h2>
              <p className="text-muted-foreground flex items-center gap-2">
                Summary register — slip template view
                {searchQuery.trim() && <span className="text-xs font-mono text-[#2388ff]">{matchCount} match{matchCount !== 1 ? "es" : ""}</span>}
              </p>
            </div>
          </div>

          {/* ── Action bar ── */}
          <div className="flex flex-wrap items-center gap-2.5 print-hide">
            {searchQuery.trim() && (
              <span className="text-xs font-mono text-[#2388ff] bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700">
                {matchCount} match{matchCount !== 1 ? "es" : ""}
              </span>
            )}

            {/* Date */}
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700 pl-3 pr-1 py-1 rounded-lg h-9">
              <span className="text-[10px] font-bold text-[#2388ff] uppercase tracking-wider">Date</span>
              <span className="text-white text-sm font-mono">{date}</span>
            </div>

            <Button size="sm" onClick={handleSave} disabled={saving}
              className="h-9 px-4 rounded-lg font-medium transition-all bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-600"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Save
            </Button>

            <Button size="sm" onClick={handleSaveAndPrint} disabled={saving}
              className="h-9 px-4 rounded-lg font-semibold transition-all bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-600"
            >
              <Save className="h-4 w-4 mr-1.5" /> Save & Print
            </Button>

            <Button size="sm" onClick={deleteLastRow} className="h-9 px-3 rounded-lg bg-slate-800 text-slate-200 hover:bg-orange-600 hover:text-white border border-slate-700 font-medium transition-all">
              <Trash2 className="h-4 w-4 mr-1" /> Del Last
            </Button>
            <Button size="sm" onClick={clearAll} className="h-9 px-3 rounded-lg bg-slate-800 text-slate-200 hover:bg-red-600 hover:text-white border border-slate-700 font-medium transition-all">
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
            <Button size="sm" onClick={handlePrint} className="h-9 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 font-semibold transition-all">
              <Printer className="h-4 w-4 mr-1" /> Print
            </Button>
            <Button size="sm" onClick={handleDownloadPDF} className="h-9 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold transition-all">
              <Download className="h-4 w-4 mr-1" /> PDF
            </Button>
          </div>
        </div>

        {/* ── Slip Cards Grid ── */}
        <div className="summary-slip-grid flex flex-col items-center gap-6">
          {(searchQuery.trim() ? rows.filter(r => isMatch(r)) : rows).map((row, idx) => {
            const slipTotal = getSlipTotal(row);
            return (
              <div
                key={row.id}
                className="slip-card group relative rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl border-2 border-[#2388ff] shadow-lg shadow-blue-500/20"
                style={{ background: "linear-gradient(145deg, #0a1628 0%, #0d1f3c 50%, #091425 100%)" }}
              >
                {/* Delete button */}
                <button
                  onClick={() => deleteRow(idx)}
                  className="print-hide absolute top-3 right-3 z-20 h-7 w-7 flex items-center justify-center rounded-full bg-slate-800/90 hover:bg-rose-600 text-slate-500 hover:text-white border border-slate-700 hover:border-rose-500 transition-all opacity-0 group-hover:opacity-100"
                  title="Remove slip"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <div className="p-6 md:p-7">
                  {/* ── Contact strip ── */}
                  <div className="flex justify-between text-[10px] text-[#2388ff]/60 font-medium tracking-wide mb-1">
                    <span>Mob. 96809-92567</span>
                    <span>Mob.: 86196-06627</span>
                  </div>
                  <div className="text-center text-[9px] text-slate-500/80 mb-3 italic tracking-wide">
                    All disputes subject to Bhilwara jurisdiction
                  </div>

                  {/* ── Company Header ── */}
                  <div className="text-center mb-1">
                    <div className="text-[12px] font-black uppercase tracking-wide text-[#2388ff] leading-tight">
                      Sant Kanwar Ram Transport Corp. (BHL.)  <span className="text-slate-400">(BHL.)</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 tracking-wider">
                      Bhilwara – 311001 (Raj.)
                    </div>
                  </div>

                  {/* ── SUMMARY title with decorative lines ── */}
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-[1.5px] bg-gradient-to-r from-transparent via-[#2388ff]/40 to-[#2388ff]/40" />
                    <span className="text-xs font-extrabold uppercase tracking-[5px] text-[#2388ff] px-2">
                      Summary
                    </span>
                    <div className="flex-1 h-[1.5px] bg-gradient-to-l from-transparent via-[#2388ff]/40 to-[#2388ff]/40" />
                  </div>

                  {/* ── Serial No & Date ── */}
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-[#2388ff]">No.</span>
                      <span className="text-xs text-slate-500 mx-2">:</span>

                      <input
                        type="text"
                        value={row.sno || String(idx + 1)}
                        onChange={(e) => updateRow(idx, "sno", e.target.value)}
                        className="w-16 bg-transparent border-0 text-xl font-black text-rose-500 outline-none text-center tracking-wider"
                        style={{ transform: "rotate(-2deg)" }}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#2388ff]">Date</span>
                      <span className="text-[11px] border-b border-dotted border-blue-800/40 px-3 py-0.5 text-white font-mono min-w-[80px] text-center">
                        {formatDateDisplay(date) || "—"}
                      </span>
                    </div>
                  </div>

                  {/* ── Fields Grid ── */}
                  <div className="space-y-1">
                    {/* Row: Vehicle No / Driver Name */}
                    <div className="grid grid-cols-2 gap-x-5">
                      <div className="flex items-center gap-2 min-h-[32px]">
                        <span className="text-[11px] font-bold text-[#2388ff] whitespace-nowrap" style={{ minWidth: 110 }}>
                          Vehicle No.
                        </span>
                        <div className="flex-1 relative min-w-0">
                          {customVehicleRows.has(idx) ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={row.truckNo}
                                onChange={(e) => updateRow(idx, "truckNo", e.target.value)}
                                placeholder="Type vehicle no"
                                className="w-full bg-transparent border-0 text-[13px] font-semibold text-white outline-none py-1 px-1 relative z-10 placeholder:text-slate-600/60"
                              />
                              <button
                                onClick={() => {
                                  setCustomVehicleRows(prev => { const n = new Set(prev); n.delete(idx); return n; });
                                }}
                                className="shrink-0 text-[10px] text-[#2388ff] hover:text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/50 bg-blue-900/20"
                                title="Show vehicle list"
                              >
                                List
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="absolute bottom-0 left-0 right-0 border-b border-dotted border-blue-800/50" />
                              <select
                                value={row.truckNo}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "__others__") {
                                    setCustomVehicleRows(prev => new Set([...prev, idx]));
                                    const newRows = [...rows];
                                    newRows[idx] = { ...newRows[idx], truckNo: "" };
                                    setRows(newRows);
                                  } else {
                                    const newRows = [...rows];
                                    newRows[idx] = { ...newRows[idx], truckNo: val, driverName: driverMap[val] || newRows[idx].driverName };
                                    setRows(newRows);
                                  }
                                }}
                                className="w-full bg-transparent border-0 text-[13px] font-semibold text-white outline-none py-1 px-1 relative z-10 appearance-none cursor-pointer"
                              >
                                <option value="" className="bg-slate-900 text-slate-400">—</option>
                                {vehicleList.map(v => (
                                  <option key={v} value={v} className="bg-slate-900 text-white">{v}</option>
                                ))}
                                <option value="__others__" className="bg-slate-900 text-amber-400">Others (type manually)</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                      <SlipField label="Driver Name" value={row.driverName} onChange={(e) => updateRow(idx, 'driverName', e.target.value)} placeholder="Driver name" />
                    </div>

                    {/* Row: From / To */}
                    <div className="grid grid-cols-2 gap-x-5">
                      <SlipField label="From" value={row.from} onChange={(e) => updateRow(idx, 'from', e.target.value)} placeholder="Origin" />
                      <SlipField label="To" value={row.to} onChange={(e) => updateRow(idx, 'to', e.target.value)} placeholder="Destination" />
                    </div>

                    {/* Row: Transport Name / Challan No */}
                    <div className="grid grid-cols-2 gap-x-5">
                      <SlipField label="Transport Name" value={row.transportName} onChange={(e) => updateRow(idx, 'transportName', e.target.value)} placeholder="Transport" />
                      <SlipField label="Challan No." value={row.challanNo} onChange={(e) => updateRow(idx, 'challanNo', e.target.value)} placeholder="Challan" />
                    </div>

                    {/* Row: Total Count (full width) */}
                    <SlipField label="Total Count" value={row.totalCount} onChange={(e) => updateRow(idx, 'totalCount', e.target.value)} placeholder="Count" />

                    {/* ── Charges separator ── */}
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <div className="flex-1 h-px bg-blue-900/30" />
                      <span className="text-[9px] font-bold uppercase tracking-[3px] text-slate-500">Charges</span>
                      <div className="flex-1 h-px bg-blue-900/30" />
                    </div>

                    {/* Row: Fare Delivery / Crossing */}
                    <div className="grid grid-cols-2 gap-x-5">
                      <SlipField label="Fare Delivery" value={row.fareDelivery} onChange={(e) => updateRow(idx, 'fareDelivery', e.target.value)} placeholder="₹ 0" isCurrency />
                      <SlipField label="Crossing" value={row.crossing} onChange={(e) => updateRow(idx, 'crossing', e.target.value)} placeholder="₹ 0" isCurrency />
                    </div>

                    {/* Row: Crossing Fare / Labor */}
                    <div className="grid grid-cols-2 gap-x-5">
                      <SlipField label="Crossing Fare" value={row.crossingFare} onChange={(e) => updateRow(idx, 'crossingFare', e.target.value)} placeholder="₹ 0" isCurrency />
                      <SlipField label="Labor" value={row.labor} onChange={(e) => updateRow(idx, 'labor', e.target.value)} placeholder="₹ 0" isCurrency />
                    </div>

                    {/* Row: Delivery Commission (full width) */}
                    <SlipField label="Del. Commission" value={row.deliveryCommission} onChange={(e) => updateRow(idx, 'deliveryCommission', e.target.value)} placeholder="₹ 0" isCurrency />

                    <SlipField label="Note" value={row.note} onChange={(e) => updateRow(idx, 'note', e.target.value)} placeholder="Optional note" />

                    {/* ── Extra fields separator ── */}
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <div className="flex-1 h-px bg-blue-900/30" />
                      <span className="text-[9px] font-bold uppercase tracking-[3px] text-slate-500">Adjustments</span>
                      <div className="flex-1 h-px bg-blue-900/30" />
                    </div>

                    <div className="grid grid-cols-2 gap-x-5">
                      <SlipField label="Credit" value={row.credit} onChange={(e) => updateRow(idx, 'credit', e.target.value)} placeholder="₹ 0" isCurrency />
                      <SlipField label="Debit" value={row.debit} onChange={(e) => updateRow(idx, 'debit', e.target.value)} placeholder="₹ 0" isCurrency />
                    </div>

                    <SlipField label="Note" value={row.note2} onChange={(e) => updateRow(idx, 'note2', e.target.value)} placeholder="Optional note" />
                  </div>

                  {/* ── Grand Total ── */}
                  <div className="mt-4 pt-3 border-t border-blue-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#2388ff] uppercase tracking-[3px]">Grand Total</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-500">₹</span>
                        <span className="text-xl font-black text-rose-500 tracking-wide">
                          {slipTotal > 0 ? slipTotal.toFixed(2) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Footer / Signatures ── */}
                  <div className="flex justify-between items-end mt-6 pt-4 border-t border-blue-900/30">
                    <div className="text-center">
                      <div className="w-28 border-t border-dotted border-slate-600/60 pt-1.5 mt-6">
                        <span className="text-[9px] text-slate-500 font-semibold tracking-wider">Driver Signature</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] text-[#2388ff]/80 font-bold leading-relaxed mb-1">
                        For Sant Kanwar Ram<br />Transport Corp. (BHL.)
                      </div>
                      <div className="w-36 border-t border-dotted border-slate-600/60 pt-1.5 mt-4 ml-auto">
                        <span className="text-[9px] text-slate-500 font-semibold tracking-wider">Auth. Signature</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtle watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" aria-hidden>
                  <span className="text-[60px] font-black tracking-[8px] uppercase select-none" style={{ color: "rgba(35,136,255,0.02)" }}>
                    SUMMARY
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Add Row ── */}
        <div className="flex justify-center print-hide pt-2 pb-4">
          <button
            onClick={addRow}
            className="group/add flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-900/40 to-blue-800/20 border border-dashed border-blue-800/60 hover:border-[#2388ff] hover:from-blue-900/60 hover:to-blue-800/40 text-blue-400 hover:text-[#2388ff] font-semibold text-sm transition-all duration-300"
          >
            <Plus className="h-4 w-4 group-hover/add:rotate-90 transition-transform duration-300" />
            Add New Summary Slip
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
