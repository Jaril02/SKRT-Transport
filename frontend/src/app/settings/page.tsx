"use client";

import React from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Bell, Shield, Building, Users, Plus, Pencil, Trash2, RefreshCw, Loader2, Check, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

// ─── User Management Tab ────────────────────────────────────────────────────
function UserManagementTab() {
  const [users, setUsers]           = React.useState<any[]>([]);
  const [loading, setLoading]       = React.useState(true);
  const [showForm, setShowForm]     = React.useState(false);
  const [editUser, setEditUser]     = React.useState<any>(null);
  const [resetUser, setResetUser]   = React.useState<any>(null);
  const [newPass, setNewPass]       = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm]             = React.useState({ name: "", email: "", password: "", role: "operator", phone: "" });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/users");
      if (res.data.success) setUsers(res.data.data);
    } catch { toast.error("Failed to load users"); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/auth/register", form);
      if (res.data.success) {
        toast.success("User created successfully");
        setShowForm(false);
        setForm({ name: "", email: "", password: "", role: "operator", phone: "" });
        loadUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally { setSubmitting(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put(`/auth/users/${editUser._id}`, {
        name: form.name, email: form.email, role: form.role, phone: form.phone
      });
      if (res.data.success) {
        toast.success("User updated");
        setEditUser(null);
        loadUsers();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      const res = await api.delete(`/auth/users/${id}`);
      if (res.data.success) { toast.success("User deleted"); loadUsers(); }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPass || newPass.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setSubmitting(true);
    try {
      const res = await api.post(`/auth/users/${resetUser._id}/reset-password`, { newPassword: newPass });
      if (res.data.success) {
        toast.success(`Password reset for ${resetUser.name}`);
        setResetUser(null);
        setNewPass("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally { setSubmitting(false); }
  };

  const openEdit = (user: any) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: "", role: user.role, phone: user.phone || "" });
    setShowForm(false);
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin:    "bg-red-500/10 text-red-400 border-red-500/20",
      manager:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
      operator: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      driver:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
      client:   "bg-purple-500/10 text-purple-400 border-purple-500/20"
    };
    return `text-xs px-2 py-0.5 rounded-full border ${colors[role] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">System Users</h3>
          <p className="text-sm text-muted-foreground">{users.length} users registered</p>
        </div>
        <Button size="sm" onClick={() => { setShowForm(true); setEditUser(null); setForm({ name: "", email: "", password: "", role: "operator", phone: "" }); }}>
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-3">
              <div><Label>Full Name</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required /></div>
              <div><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required minLength={6} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
              <div>
                <Label>Role</Label>
                <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
                  <option value="operator">Operator</option>
                  <option value="manager">Manager</option>
                  <option value="driver">Driver</option>
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={submitting} size="sm">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {submitting ? "Creating..." : "Create"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" /> Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {editUser && (
        <Card className="border-amber-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Edit User — {editUser.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="grid grid-cols-2 gap-3">
              <div><Label>Full Name</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} /></div>
              <div>
                <Label>Role</Label>
                <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
                  className="w-full h-10 px-3 rounded-md border border-border bg-background text-sm">
                  <option value="operator">Operator</option>
                  <option value="manager">Manager</option>
                  <option value="driver">Driver</option>
                  <option value="client">Client</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="col-span-2 flex gap-2">
                <Button type="submit" disabled={submitting} size="sm">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Changes
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditUser(null)}><X className="w-4 h-4" /> Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reset Password Form */}
      {resetUser && (
        <Card className="border-rose-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reset Password — {resetUser.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="flex gap-3 items-end">
              <div className="flex-1">
                <Label>New Password</Label>
                <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} minLength={6} required placeholder="Min 6 characters" />
              </div>
              <Button type="submit" disabled={submitting} size="sm">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Reset
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setResetUser(null)}><X className="w-4 h-4" /></Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-muted-foreground font-medium">Name</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Email</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Phone</th>
                  <th className="text-left p-4 text-muted-foreground font-medium">Role</th>
                  <th className="text-right p-4 text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No users found</td></tr>
                ) : users.map(u => (
                  <tr key={u._id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-muted-foreground">{u.email}</td>
                    <td className="p-4 text-muted-foreground">{u.phone || "—"}</td>
                    <td className="p-4"><span className={roleBadge(u.role)}>{u.role}</span></td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(u)} title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-400 hover:text-amber-300" onClick={() => { setResetUser(u); setNewPass(""); setEditUser(null); setShowForm(false); }} title="Reset Password">
                          <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive/80" onClick={() => handleDelete(u._id, u.name)} title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user } = useAuth();
  const [form, setForm]         = React.useState({ name: "", email: "", phone: "" });
  const [saving, setSaving]     = React.useState(false);

  React.useEffect(() => {
    if (user) setForm({ name: user.name, email: user.email, phone: (user as any).phone || "" });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/auth/profile", form);
      if (res.data.success) toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your profile details.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Security Tab ─────────────────────────────────────────────────────────────
function SecurityTab() {
  const [form, setForm]       = React.useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [submitting, setSub]  = React.useState(false);

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setSub(true);
    try {
      const res = await api.post("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword:     form.newPassword
      });
      if (res.data.success) {
        toast.success("Password changed successfully");
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally { setSub(false); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>Change your account password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleChange} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <Label htmlFor="currentPass">Current Password</Label>
            <Input id="currentPass" type="password" value={form.currentPassword} onChange={e => setForm(f => ({...f, currentPassword: e.target.value}))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPass">New Password</Label>
            <Input id="newPass" type="password" value={form.newPassword} onChange={e => setForm(f => ({...f, newPassword: e.target.value}))} required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPass">Confirm New Password</Label>
            <Input id="confirmPass" type="password" value={form.confirmPassword} onChange={e => setForm(f => ({...f, confirmPassword: e.target.value}))} required />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {submitting ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account and platform preferences.</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-secondary/10 p-1">
            <TabsTrigger value="profile"  className="gap-2"><User className="w-4 h-4" /> Profile</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Shield className="w-4 h-4" /> Security</TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users"  className="gap-2"><Users className="w-4 h-4" /> User Management</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile"><ProfileTab /></TabsContent>
          <TabsContent value="security"><SecurityTab /></TabsContent>
          {isAdmin && <TabsContent value="users"><UserManagementTab /></TabsContent>}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
