"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Search, Plus, Building2, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";

import api from "@/lib/api";
import { AddClientDialog } from "@/components/clients/AddClientDialog";
import { useAuth } from "@/context/AuthContext";

export default function ClientsPage() {
  const { can } = useAuth();
  const [clientList, setClientList] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/clients");
      if (data.success) {
        setClientList(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch clients", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clientList.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) || false
  );


  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Client Directory</h2>
            <p className="text-muted-foreground">Manage your business clients and their shipment history.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search clients..." 
                className="pl-10 w-64 bg-secondary/10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {can('clients', 'create') && <AddClientDialog onClientAdded={fetchClients} />}
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-64 animate-pulse bg-secondary/10 border-border/50" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <Card key={client._id} className="border-border/50 bg-secondary/10 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent border border-accent/20 capitalize">
                      {client.status}
                    </div>
                  </div>
                  
                  <h3 className="font-bold text-xl mb-1">{client.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Contact: {client.contactPerson || "N/A"}</p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Phone className="w-4 h-4" /> {client.phone}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Mail className="w-4 h-4" /> {client.email || "No email provided"}
                    </div>
                    <div className="pt-4 border-t border-border/50 mt-4 flex justify-between items-center">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Shipments</span>
                      <span className="text-lg font-bold text-primary">{client.totalShipments || 0}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs">View Invoices</Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs">Analytics</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
