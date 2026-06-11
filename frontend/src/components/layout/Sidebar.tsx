"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  MapPin,
  Users,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Package,
  Warehouse
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Warehouse, label: "Inventory", href: "/inventory" },
  { icon: Package, label: "Shipments", href: "/shipments" },
  { icon: MapPin, label: "Live Tracking", href: "/tracking" },
  { icon: Truck, label: "Records", href: "/fleet" },
  // { icon: Users, label: "Drivers", href: "/drivers" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: FileText, label: "Expenses", href: "/expenses" },
  { icon: FileText, label: "Invoices", href: "/invoices" },
  // { icon: FileText, label: "Delivery Statement", href: "/delivery-statement" },
  { icon: BarChart3, label: "Analytics", href: "/analytics" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-64 h-screen bg-background border-r border-border flex flex-col fixed left-0 top-0 z-50">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          SKRT
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 group",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-5 h-5",
                isActive ? "text-primary-foreground" : "group-hover:text-primary transition-colors"
              )} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
