"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingPage } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Globe, KeyRound, Trash2 } from "lucide-react";

interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  created_at: string;
}

interface Site {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export default function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const supabase = createClient();

    // Fetch client
    const { data: clientData } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (clientData) {
      setClient(clientData);
      setFormData({
        name: clientData.name,
        email: clientData.email,
        company: clientData.company || "",
        phone: clientData.phone || "",
      });
    }

    // Fetch assigned sites
    const { data: sitesData } = await supabase
      .from("sites")
      .select("id, name, slug, status")
      .eq("client_id", id);

    if (sitesData) setSites(sitesData);

    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          company: formData.company || null,
          phone: formData.phone || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update client");
      }

      toast.success("Client updated successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      const response = await fetch(`/api/admin/clients/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) throw new Error("Failed to reset password");

      toast.success("Password reset successfully");
      setResetPasswordOpen(false);
      setNewPassword("");
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/admin/clients/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete client");

      toast.success("Client deleted");
      router.push("/admin/clients");
    } catch (error) {
      toast.error("Failed to delete client");
    }
  };

  if (loading) return <LoadingPage />;
  if (!client) return <div>Client not found</div>;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/clients"
          className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to clients
        </Link>
      </div>

      <PageHeader title={client.name} description={client.email}>
        <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-slate-700">
              <KeyRound className="w-4 h-4 mr-2" />
              Reset Password
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Reset Password</DialogTitle>
              <DialogDescription className="text-slate-400">
                Set a new password for {client.name}
              </DialogDescription>
            </DialogHeader>
            <div>
              <Label className="text-slate-300">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                placeholder="••••••••"
                minLength={8}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" className="border-slate-700" onClick={() => setResetPasswordOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleResetPassword}>
                Reset Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="border-red-900 text-red-400 hover:bg-red-500/10">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Delete Client</DialogTitle>
              <DialogDescription className="text-slate-400">
                Are you sure you want to delete {client.name}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" className="border-slate-700" onClick={() => setDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Details */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-semibold text-white">Client Details</h3>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-slate-300">Full Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Email</Label>
                <Input
                  value={formData.email}
                  disabled
                  className="mt-1.5 bg-slate-800 border-slate-700 text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-slate-300">Company</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>

        {/* Assigned Sites */}
        <div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="p-4 border-b border-slate-800">
              <h3 className="font-semibold text-white">Assigned Sites</h3>
            </div>
            <div className="divide-y divide-slate-800">
              {sites.length > 0 ? (
                sites.map((site) => (
                  <Link
                    key={site.id}
                    href={`/admin/sites/${site.id}`}
                    className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="font-medium text-white">{site.name}</p>
                        <p className="text-xs text-slate-500">/{site.slug}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        site.status === "published" ? "success" : site.status === "draft" ? "secondary" : "outline"
                      }
                    >
                      {site.status}
                    </Badge>
                  </Link>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No sites assigned
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
