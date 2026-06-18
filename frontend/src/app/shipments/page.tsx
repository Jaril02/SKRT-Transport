"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Eye,
  Edit,
  User,
  Search,
  Plus,
  Filter,
  Download,
  Printer,
  FileText,
  MessageCircle,
  Loader2
} from "lucide-react";

import { CreateShipmentDialog } from "@/components/shipments/CreateShipmentDialog";
import { ViewShipmentDialog } from "@/components/shipments/ViewShipmentDialog";
import { ViewContactDialog } from "@/components/shipments/ViewContactDialog";
import api from "@/lib/api";
import { toast } from "sonner";
import { useHeader } from "@/context/HeaderContext";
import { generateAndSendPDF } from "@/lib/whatsapp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";



const statusColors: Record<string, string> = {
  "In Transit": "bg-primary/20 text-primary border-primary/30",
  "Delivered": "bg-accent/20 text-accent border-accent/30",
  "Booked": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Inventory": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const outgoingStatusOptions = [
  'Pending', 'Loaded', 'Dispatched', 'In Transit',
  'Arrived at Branch', 'Out for Delivery', 'Delivered'
];

const outgoingStatusColors: Record<string, string> = {
  "Pending": "text-yellow-400",
  "Loaded": "text-orange-400",
  "Dispatched": "text-blue-400",
  "In Transit": "text-cyan-400",
  "Arrived at Branch": "text-indigo-400",
  "Out for Delivery": "text-violet-400",
  "Delivered": "text-green-400",
};

function buildReceiptHtml(shipment: any): string {
  const fmtDate = (ds: string) => {
    if (!ds) return "";
    const p = ds.split("T")[0].split("-");
    return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : ds;
  };
  const pkg = shipment.quantity && shipment.packageType ? `${shipment.quantity} ${shipment.packageType}` : '—';
  const baseAmt = shipment.totalFreight || 0;
  const hamali = shipment.hamali || 0;
  const cartags = shipment.cartags || 0;
  const stCh = 10;
  const misc = shipment.miscellaneousCharge || 0;
  const total = shipment.totalPayable || 0;
  const consignor = shipment.consignor || {};
  const consignee = shipment.consignee || {};

  const buildCopy = (copyLabel: string) => `
    <div class="receipt">
      <table>
        <tr>
          <td colspan="6">
            <div class="company">Sant Kanwar Ram Transport Corporation</div>
            <div class="sub">
              123,124 Transport Nagar, Bhilwara - 311001 (Raj.)<br>
              Mob: 96809-92567 / 86196-06627<br>
              <span class="bold">GST: 08AAHPN5613K1ZH</span>
            </div>
          </td>
          <td colspan="2" style="padding:0;">
            <table style="width:100%;border-collapse:collapse;height:100%;">
              <tr>
                <td class="bold">Date: ${fmtDate(shipment.bookedAt)}</td>
                <td class="bold">GR No: ${shipment.consignmentNumber || '—'}</td>
              </tr>
              <tr>
                <td class="bold">From: BHILWARA (BLW)</td>
                <td class="bold">To: ${(shipment.toBranch || '—').toUpperCase()}</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td colspan="4">
            <span class="bold">Consignor:</span> ${consignor.name || '—'}<br>
            GST No.: ${consignor.gst || '—'}
          </td>
          <td colspan="4">
            <span class="bold">Consignee:</span> ${consignee.name || '—'}<br>
            GST No.: ${consignee.gst || '—'}
          </td>
        </tr>
        <tr>
          <td class="center bold" width="10%">Packages</td>
          <td class="center bold" colspan="3">Description</td>
          <td class="center bold">Weight Actual</td>
          <td class="center bold">Weight Charged</td>
          <td class="center bold">Charges</td>
          <td class="center bold">Amount</td>
        </tr>
        <tr class="charges">
          <td class="center">${pkg}</td>
          <td colspan="3">${shipment.description || '—'}</td>
          <td class="center">${shipment.actualWeight || 0} Kg</td>
          <td class="center">${shipment.chargedWeight || 0} Kg</td>
          <td>
            Freight<br>
            Cartags<br>
            Labour<br>
            St.Ch.<br>
            Misc.
          </td>
          <td>
            Rs.${baseAmt}<br>
            Rs.${cartags}<br>
            Rs.${hamali}<br>
            Rs.${stCh}<br>
            Rs.${misc}
          </td>
        </tr>
        <tr>
          <td colspan="2"><span class="bold">Private Number:</span> ${shipment.privateNumber || '—'}</td>
          <td colspan="2"><span class="bold">Value:</span> Rs.${shipment.invoiceValue || 0}</td>
          <td colspan="2"><span class="bold">EWB:</span> ${shipment.ewayParta || '—'}</td>
          <td class="center bold">TOTAL</td>
          <td class="bold">Rs.${total}</td>
        </tr>
        <tr>
          <td colspan="5" class="terms">
            <span class="bold">OWNER'S RISK</span><br>
            1. Booked at owner's risk<br>
            2. Goods to be insured by the party & to be sent at owner's risk<br>
            3. We are not responsible for breakage, leakage and damage<br>
            4. Subject to Bhilwara jurisdiction only
          </td>
          <td colspan="2" class="copy-box">${copyLabel}</td>
          <td class="sign">For Sant Kanwar Ram Transport Corp.,<br><br>Sign</td>
        </tr>
      </table>
    </div>`;

  const copies = ["ORIGINAL COPY", "RECORD COPY", "DRIVER COPY"];
  const allReceipts = copies.map(c => buildCopy(c)).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Receipt - ${shipment.consignmentNumber || ''}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0;font-family:Arial,sans-serif;}
    body{background:#fff;padding:0;margin:0;}
    .receipt{width:1000px;margin:0 auto 12px auto;background:#fff;border:2px solid #000;}
    table{width:100%;border-collapse:collapse;}
    td{border:1px solid #000;padding:6px;vertical-align:top;font-size:14px;}
    .company{text-align:center;font-size:28px;font-weight:bold;font-family:"Times New Roman",serif;margin-bottom:5px;}
    .sub{text-align:center;font-size:12px;line-height:1.5;}
    .bold{font-weight:bold;}
    .center{text-align:center;}
    .copy-box{text-align:center;font-size:24px;font-weight:bold;vertical-align:middle;height:90px;}
    .terms{font-size:12px;line-height:1.6;}
    .sign{height:90px;text-align:center;vertical-align:bottom;padding-bottom:10px;}
    .charges td{height:32px;}
    @page{size:A4 portrait;margin:5mm;}
    @media print{body{background:#fff;padding:0;margin:0;}.receipt{margin:0 auto 2px auto;}.receipt:last-child{page-break-after:avoid;break-after:avoid;}}
    @media not print{body{padding:0;margin:0;}.pdf-scale{transform:scale(0.7);transform-origin:top left;width:1000px;}.receipt{margin:0 auto 4px auto;}}
  </style>
</head>
<body><div class="pdf-scale">${allReceipts}</div></body>
</html>`;
}

export default function ShipmentsPage() {
  const router = useRouter();
  const { searchQuery } = useHeader();
  const [shipmentList, setShipmentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewConsignorOpen, setViewConsignorOpen] = useState(false);
  const [viewConsigneeOpen, setViewConsigneeOpen] = useState(false);

  const fetchLock = React.useRef(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState<string | null>(null);

  const fetchShipments = async () => {
    if (fetchLock.current) return;
    try {
      setLoading(true);
      fetchLock.current = true;
      const { data } = await api.get("/shipments");
      if (data.success) {
        setShipmentList(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch shipments", error);
    } finally {
      setLoading(false);
      fetchLock.current = false;
    }
  };

  React.useEffect(() => {
    fetchShipments();
  }, []);

  const exportCSV = () => {
    const headers = ["Consignment No", "Vehicle", "Consignor", "Consignee", "Branch", "Package Type", "Quantity", "Charged Weight", "Payment Mode", "Freight", "Status", "Outgoing Status"];
    const rows = filteredShipments.map((s: any) => [
      s.consignmentNumber || s.shipmentId || s.id || "",
      s.vehicleNumber || "",
      s.consignor?.name || s.sender?.name || s.sender || "",
      s.consignee?.name || s.receiver?.name || s.receiver || "",
      s.toBranch || s.origin || "",
      s.packageType || s.dest || "",
      s.quantity ?? "",
      s.chargedWeight ?? "",
      s.paymentMode || "",
      s.totalFreight ?? "",
      s.status || "Booked",
      s.outgoingStatus || "Pending",
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" +
      [headers, ...rows].map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shipments_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Shipments data exported successfully");
  };

  const filteredShipments = shipmentList.filter((s) => {
    const lowerSearch = searchQuery.toLowerCase();
    if (!lowerSearch) return true;
    const idMatch = s.consignmentNumber?.toLowerCase().includes(lowerSearch) || false;
    const consignorMatch = s.consignor?.name?.toLowerCase().includes(lowerSearch) || s.consignor?.gst?.toLowerCase().includes(lowerSearch) || false;
    const consigneeMatch = s.consignee?.name?.toLowerCase().includes(lowerSearch) || s.consignee?.gst?.toLowerCase().includes(lowerSearch) || false;
    const branchMatch = s.toBranch?.toLowerCase().includes(lowerSearch) || false;
    const vehicleMatch = s.vehicleNumber?.toLowerCase().includes(lowerSearch) || false;
    return idMatch || consignorMatch || consigneeMatch || branchMatch || vehicleMatch;
  });

  const handleOutgoingStatusChange = useCallback(async (shipmentId: string, newStatus: string) => {
    try {
      await api.put(`/shipments/${shipmentId}`, { outgoingStatus: newStatus });
      setShipmentList(prev => prev.map(s => s._id === shipmentId ? { ...s, outgoingStatus: newStatus } : s));
      toast.success(`Outgoing status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update outgoing status');
    }
  }, []);

  const handlePrintReceipt = useCallback((shipment: any) => {
    const html = buildReceiptHtml(shipment);
    const pw = window.open("", "_blank");
    if (pw) {
      pw.document.write(html);
      pw.document.close();
    }
  }, []);

  const handleSendWhatsApp = useCallback(async (shipment: any) => {
    setSendingWhatsApp(shipment._id);
    try {
      const phone = prompt("Enter client WhatsApp number (with or without country code):");
      if (!phone) { setSendingWhatsApp(null); return; }
      const html = buildReceiptHtml(shipment);
      await generateAndSendPDF(phone, html, `receipt-${shipment.consignmentNumber || shipment.shipmentId || shipment._id}.pdf`, "portrait");
    } catch {
      // error already handled by generateAndSendPDF
    } finally {
      setSendingWhatsApp(null);
    }
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Shipments</h2>
            <p className="text-muted-foreground">Manage and track all consignments in real-time.</p>
          </div>
          <div className="flex items-center gap-2">

            <Button variant="outline" size="sm" onClick={() => router.push("/challan")}>
              <FileText className="h-4 w-4 mr-2" /> Challan
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <CreateShipmentDialog onShipmentCreated={fetchShipments} />
          </div>
        </div>

        <Card className="border-border/50 bg-secondary/10">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {searchQuery.trim() && (
                <span className="text-xs font-mono text-[#2388ff] bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700">
                  {filteredShipments.length} result{filteredShipments.length !== 1 ? "s" : ""}
                </span>
              )}
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4 mr-2" /> Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="text-[10px] w-[13%]">Consignment No</TableHead>
                  <TableHead className="text-[10px] w-[8%]">Vehicle</TableHead>
                  <TableHead className="text-[10px] w-[11%]">Consignor</TableHead>
                  <TableHead className="text-[10px] w-[11%]">Consignee</TableHead>
                  <TableHead className="text-[10px] w-[8%]">Branch</TableHead>
                  <TableHead className="text-[10px] w-[8%]">Pkg Type</TableHead>
                  <TableHead className="text-[10px] w-[5%]">Qty</TableHead>
                  <TableHead className="text-[10px] w-[7%]">Chg Wt</TableHead>
                  <TableHead className="text-[10px] w-[7%]">Payment</TableHead>
                  <TableHead className="text-[10px] w-[8%]">Freight</TableHead>
                  <TableHead className="text-[10px] w-[7%]">Status</TableHead>
                  <TableHead className="text-[10px] w-[10%]">Outgoing</TableHead>
                  <TableHead className="text-[10px] w-[7%] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment: any) => (
                  <TableRow key={shipment._id || shipment.id} className="border-border/50 hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium text-primary text-[10px] whitespace-nowrap">{shipment.consignmentNumber || shipment.shipmentId || shipment.id}</TableCell>
                    <TableCell className="font-mono text-[10px] text-foreground/90 font-bold whitespace-nowrap">{shipment.vehicleNumber || '-'}</TableCell>
                    <TableCell className="text-[10px] whitespace-nowrap">{shipment.consignor?.name || shipment.sender?.name || shipment.sender || '-'}</TableCell>
                    <TableCell className="text-[10px] whitespace-nowrap">{shipment.consignee?.name || shipment.receiver?.name || shipment.receiver || '-'}</TableCell>
                    <TableCell className="text-[10px] whitespace-nowrap">{shipment.toBranch || shipment.origin || '-'}</TableCell>
                    <TableCell className="text-[10px] whitespace-nowrap">{shipment.packageType || shipment.dest || '-'}</TableCell>
                    <TableCell className="text-[10px]">{shipment.quantity ?? '-'}</TableCell>
                    <TableCell className="text-[10px] whitespace-nowrap">{shipment.chargedWeight ?? '-'}</TableCell>
                    <TableCell className="text-[10px] whitespace-nowrap">{shipment.paymentMode || '-'}</TableCell>
                    <TableCell className="text-[10px] whitespace-nowrap">₹{shipment.totalFreight?.toLocaleString() || '-'}</TableCell>
                    <TableCell className="text-[10px]">
                      <Badge variant="outline" className={cn("px-1 py-0 whitespace-nowrap text-[10px]", statusColors[shipment.status] || 'bg-muted text-muted-foreground border-border')}>
                        {shipment.status || 'Booked'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px]">
                      <Select
                        value={shipment.outgoingStatus || 'Pending'}
                        onValueChange={(val) => handleOutgoingStatusChange(shipment._id, val)}
                      >
                        <SelectTrigger className={cn("h-7 text-[10px] font-semibold border-border/50 bg-transparent", outgoingStatusColors[shipment.outgoingStatus] || 'text-yellow-400')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {outgoingStatusOptions.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/20"
                          onClick={() => { setSelectedShipment(shipment); setViewOpen(true); }}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary">
                              <MoreVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 z-[9999]">
                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Actions</DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() => { setSelectedShipment(shipment); setViewOpen(true); }}
                            >
                              <Eye className="h-4 w-4 mr-2 text-primary" /> View Shipment
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => { setSelectedShipment(shipment); setEditOpen(true); }}
                            >
                              <Edit className="h-4 w-4 mr-2 text-yellow-500" /> Edit Shipment
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handlePrintReceipt(shipment)}
                            >
                              <Printer className="h-4 w-4 mr-2 text-foreground" /> Print Receipt
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => handleSendWhatsApp(shipment)}
                              disabled={sendingWhatsApp === shipment._id}
                            >
                              {sendingWhatsApp === shipment._id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin text-green-400" />
                              ) : (
                                <MessageCircle className="h-4 w-4 mr-2 text-green-400" />
                              )}
                              Send via WhatsApp
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider">Contact Info</DropdownMenuLabel>

                            <DropdownMenuItem
                              onClick={() => { setSelectedShipment(shipment); setViewConsignorOpen(true); }}
                            >
                              <User className="h-4 w-4 mr-2 text-blue-400" /> View Consignor
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => { setSelectedShipment(shipment); setViewConsigneeOpen(true); }}
                            >
                              <User className="h-4 w-4 mr-2 text-purple-400" /> View Consignee
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialogs */}
        <ViewShipmentDialog
          open={viewOpen}
          onOpenChange={setViewOpen}
          shipment={selectedShipment}
        />
        <CreateShipmentDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          shipmentData={selectedShipment}
          isEdit={true}
          onShipmentCreated={() => { fetchShipments(); setSelectedShipment(null); }}
        />
        <ViewContactDialog
          open={viewConsignorOpen}
          onOpenChange={setViewConsignorOpen}
          contact={selectedShipment?.consignor}
          title="Consignor Details"
        />
        <ViewContactDialog
          open={viewConsigneeOpen}
          onOpenChange={setViewConsigneeOpen}
          contact={selectedShipment?.consignee}
          title="Consignee Details"
        />
      </div>
    </DashboardLayout>
  );
}
