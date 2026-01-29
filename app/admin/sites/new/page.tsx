"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function NewSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    replitUrl: "",
    customDomain: "",
    clientId: "",
  });
  const [slugEdited, setSlugEdited] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");
      if (data) setClients(data);
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (!slugEdited && formData.name) {
      setFormData((prev) => ({ ...prev, slug: slugify(prev.name) }));
    }
  }, [formData.name, slugEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          replit_url: formData.replitUrl || null,
          custom_domain: formData.customDomain || null,
          client_id: formData.clientId || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create site");
      }

      toast.success("Site created successfully");
      router.push(`/admin/sites/${result.data.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create site");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/sites"
          className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sites
        </Link>
      </div>

      <PageHeader
        title="Create New Site"
        description="Set up a new site for a client"
      />

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <Label htmlFor="name" className="text-slate-300">
                Site Name
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                placeholder="Joe's Pizza"
                required
              />
            </div>

            <div>
              <Label htmlFor="slug" className="text-slate-300">
                Slug
              </Label>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-slate-500">/</span>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setFormData((prev) => ({
                      ...prev,
                      slug: slugify(e.target.value),
                    }));
                  }}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="joes-pizza"
                  required
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Used in the API URL: /api/public/sites/{formData.slug || "slug"}
                /content
              </p>
            </div>

            <div>
              <Label htmlFor="replitUrl" className="text-slate-300">
                Replit URL
              </Label>
              <Input
                id="replitUrl"
                value={formData.replitUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, replitUrl: e.target.value }))
                }
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                placeholder="https://joes-pizza.replit.app"
              />
            </div>

            <div>
              <Label htmlFor="customDomain" className="text-slate-300">
                Custom Domain (optional)
              </Label>
              <Input
                id="customDomain"
                value={formData.customDomain}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customDomain: e.target.value,
                  }))
                }
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                placeholder="www.joespizza.com"
              />
            </div>

            <div>
              <Label htmlFor="client" className="text-slate-300">
                Assign to Client (optional)
              </Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, clientId: value }))
                }
              >
                <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Site"
              )}
            </Button>
            <Link href="/admin/sites">
              <Button type="button" variant="outline" className="border-slate-700">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
