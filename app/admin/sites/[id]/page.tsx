"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingPage } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Copy,
  RefreshCw,
  Plus,
  Trash2,
  GripVertical,
  ExternalLink,
} from "lucide-react";

interface Site {
  id: string;
  name: string;
  slug: string;
  status: string;
  replit_url: string | null;
  custom_domain: string | null;
  client_id: string | null;
  api_key: string;
  created_at: string;
  clients?: { id: string; name: string } | null;
}

interface TextField {
  id: string;
  content_key: string;
  label: string;
  content_type: string;
  max_length: number | null;
  sort_order: number;
}

interface Collection {
  id: string;
  collection_key: string;
  label: string;
  schema: any;
}

interface ImageSlot {
  id: string;
  image_key: string;
  label: string;
  recommended_width: number | null;
  recommended_height: number | null;
}

interface Permission {
  id: string;
  can_edit_business_info: boolean;
  can_edit_text: boolean;
  can_edit_images: boolean;
  can_edit_collections: boolean;
  can_add_collection_items: boolean;
  can_delete_collection_items: boolean;
  can_reorder_items: boolean;
  can_publish: boolean;
}

export default function SiteConfigPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [site, setSite] = useState<Site | null>(null);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [textFields, setTextFields] = useState<TextField[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([]);
  const [permissions, setPermissions] = useState<Permission | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    status: "",
    replitUrl: "",
    customDomain: "",
    clientId: "",
  });

  // Dialog states
  const [newFieldOpen, setNewFieldOpen] = useState(false);
  const [newField, setNewField] = useState({ key: "", label: "", maxLength: "" });
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [newCollection, setNewCollection] = useState({ key: "", label: "" });
  const [newImageOpen, setNewImageOpen] = useState(false);
  const [newImage, setNewImage] = useState({ key: "", label: "", width: "", height: "" });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const supabase = createClient();

    // Fetch site
    const { data: siteData } = await supabase
      .from("sites")
      .select("*, clients(id, name)")
      .eq("id", id)
      .single();

    if (siteData) {
      setSite(siteData);
      setFormData({
        name: siteData.name,
        slug: siteData.slug,
        status: siteData.status,
        replitUrl: siteData.replit_url || "",
        customDomain: siteData.custom_domain || "",
        clientId: siteData.client_id || "",
      });
    }

    // Fetch clients
    const { data: clientsData } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");
    if (clientsData) setClients(clientsData);

    // Fetch text fields
    const { data: fieldsData } = await supabase
      .from("text_content")
      .select("*")
      .eq("site_id", id)
      .order("sort_order");
    if (fieldsData) setTextFields(fieldsData);

    // Fetch collections
    const { data: collectionsData } = await supabase
      .from("collections")
      .select("*")
      .eq("site_id", id);
    if (collectionsData) setCollections(collectionsData);

    // Fetch image slots
    const { data: imagesData } = await supabase
      .from("images")
      .select("*")
      .eq("site_id", id)
      .order("sort_order");
    if (imagesData) setImageSlots(imagesData);

    // Fetch permissions
    if (siteData?.client_id) {
      const { data: permsData } = await supabase
        .from("site_permissions")
        .select("*")
        .eq("site_id", id)
        .eq("client_id", siteData.client_id)
        .single();
      if (permsData) setPermissions(permsData);
    }

    setLoading(false);
  };

  const handleSaveGeneral = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/sites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          status: formData.status,
          replit_url: formData.replitUrl || null,
          custom_domain: formData.customDomain || null,
          client_id: formData.clientId || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update site");
      }

      toast.success("Site updated successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyApiKey = () => {
    if (site?.api_key) {
      navigator.clipboard.writeText(site.api_key);
      toast.success("API key copied to clipboard");
    }
  };

  const handleRegenerateApiKey = async () => {
    try {
      const response = await fetch(`/api/admin/sites/${id}/api-key/regenerate`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to regenerate key");

      const data = await response.json();
      setSite((prev) => (prev ? { ...prev, api_key: data.api_key } : null));
      toast.success("API key regenerated");
    } catch (error) {
      toast.error("Failed to regenerate API key");
    }
  };

  const handleAddTextField = async () => {
    try {
      const response = await fetch(`/api/admin/sites/${id}/text-fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content_key: newField.key,
          label: newField.label,
          max_length: newField.maxLength ? parseInt(newField.maxLength) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to add field");

      toast.success("Text field added");
      setNewFieldOpen(false);
      setNewField({ key: "", label: "", maxLength: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to add text field");
    }
  };

  const handleDeleteTextField = async (fieldId: string) => {
    try {
      const response = await fetch(`/api/admin/sites/${id}/text-fields/${fieldId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete field");

      toast.success("Text field deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete text field");
    }
  };

  const handleAddCollection = async () => {
    try {
      const response = await fetch(`/api/admin/sites/${id}/collections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collection_key: newCollection.key,
          label: newCollection.label,
        }),
      });

      if (!response.ok) throw new Error("Failed to add collection");

      toast.success("Collection added");
      setNewCollectionOpen(false);
      setNewCollection({ key: "", label: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to add collection");
    }
  };

  const handleAddImageSlot = async () => {
    try {
      const response = await fetch(`/api/admin/sites/${id}/images`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_key: newImage.key,
          label: newImage.label,
          recommended_width: newImage.width ? parseInt(newImage.width) : null,
          recommended_height: newImage.height ? parseInt(newImage.height) : null,
        }),
      });

      if (!response.ok) throw new Error("Failed to add image slot");

      toast.success("Image slot added");
      setNewImageOpen(false);
      setNewImage({ key: "", label: "", width: "", height: "" });
      fetchData();
    } catch (error) {
      toast.error("Failed to add image slot");
    }
  };

  const handlePermissionChange = async (key: keyof Permission, value: boolean) => {
    if (!permissions || !site?.client_id) return;

    try {
      const response = await fetch(`/api/admin/sites/${id}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) throw new Error("Failed to update permission");

      setPermissions((prev) => (prev ? { ...prev, [key]: value } : null));
      toast.success("Permission updated");
    } catch (error) {
      toast.error("Failed to update permission");
    }
  };

  if (loading) return <LoadingPage />;
  if (!site) return <div>Site not found</div>;

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

      <PageHeader title={site.name} description={`/${site.slug}`}>
        {site.replit_url && (
          <a
            href={site.replit_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            View Site <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <Badge
          variant={
            site.status === "published" ? "success" : site.status === "draft" ? "secondary" : "outline"
          }
        >
          {site.status}
        </Badge>
      </PageHeader>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-800">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="fields">Content Fields</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-slate-300">Site Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Slug</Label>
                <Input
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="text-slate-300">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="mt-1.5 bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Assigned Client</Label>
                <Select
                  value={formData.clientId}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, clientId: value }))}
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

            <div>
              <Label className="text-slate-300">Replit URL</Label>
              <Input
                value={formData.replitUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, replitUrl: e.target.value }))}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                placeholder="https://site.replit.app"
              />
            </div>

            <div>
              <Label className="text-slate-300">Custom Domain</Label>
              <Input
                value={formData.customDomain}
                onChange={(e) => setFormData((prev) => ({ ...prev, customDomain: e.target.value }))}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                placeholder="www.example.com"
              />
            </div>

            <div>
              <Label className="text-slate-300">API Key</Label>
              <div className="flex gap-2 mt-1.5">
                <Input
                  value={site.api_key}
                  readOnly
                  className="bg-slate-800 border-slate-700 text-white font-mono text-sm"
                />
                <Button variant="outline" className="border-slate-700" onClick={handleCopyApiKey}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="border-slate-700" onClick={handleRegenerateApiKey}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Button
              onClick={handleSaveGeneral}
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
        </TabsContent>

        {/* Content Fields Tab */}
        <TabsContent value="fields">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-medium text-white">Text Fields</h3>
              <Dialog open={newFieldOpen} onOpenChange={setNewFieldOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Field
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Text Field</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Field Key</Label>
                      <Input
                        value={newField.key}
                        onChange={(e) => setNewField((prev) => ({ ...prev, key: e.target.value }))}
                        className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                        placeholder="hero_headline"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Label</Label>
                      <Input
                        value={newField.label}
                        onChange={(e) => setNewField((prev) => ({ ...prev, label: e.target.value }))}
                        className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                        placeholder="Hero Headline"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Max Length (optional)</Label>
                      <Input
                        type="number"
                        value={newField.maxLength}
                        onChange={(e) => setNewField((prev) => ({ ...prev, maxLength: e.target.value }))}
                        className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                        placeholder="255"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="border-slate-700" onClick={() => setNewFieldOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleAddTextField}>
                      Add Field
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="divide-y divide-slate-800">
              {textFields.length > 0 ? (
                textFields.map((field) => (
                  <div key={field.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <GripVertical className="w-4 h-4 text-slate-600 cursor-grab" />
                      <div>
                        <p className="font-medium text-white">{field.label}</p>
                        <p className="text-sm text-slate-500">{field.content_key}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {field.max_length && (
                        <span className="text-sm text-slate-500">Max: {field.max_length}</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleDeleteTextField(field.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No text fields yet. Add your first field.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-medium text-white">Collections</h3>
              <Dialog open={newCollectionOpen} onOpenChange={setNewCollectionOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Collection
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Collection</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Collection Key</Label>
                      <Input
                        value={newCollection.key}
                        onChange={(e) => setNewCollection((prev) => ({ ...prev, key: e.target.value }))}
                        className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                        placeholder="menu_items"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Label</Label>
                      <Input
                        value={newCollection.label}
                        onChange={(e) => setNewCollection((prev) => ({ ...prev, label: e.target.value }))}
                        className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                        placeholder="Menu Items"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="border-slate-700" onClick={() => setNewCollectionOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleAddCollection}>
                      Add Collection
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="divide-y divide-slate-800">
              {collections.length > 0 ? (
                collections.map((collection) => (
                  <div key={collection.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{collection.label}</p>
                      <p className="text-sm text-slate-500">{collection.collection_key}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-slate-400">
                      Edit Schema
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No collections yet. Add your first collection.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-medium text-white">Image Slots</h3>
              <Dialog open={newImageOpen} onOpenChange={setNewImageOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Image Slot
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add Image Slot</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-slate-300">Slot Key</Label>
                      <Input
                        value={newImage.key}
                        onChange={(e) => setNewImage((prev) => ({ ...prev, key: e.target.value }))}
                        className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                        placeholder="hero_background"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300">Label</Label>
                      <Input
                        value={newImage.label}
                        onChange={(e) => setNewImage((prev) => ({ ...prev, label: e.target.value }))}
                        className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                        placeholder="Hero Background"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-slate-300">Max Width (optional)</Label>
                        <Input
                          type="number"
                          value={newImage.width}
                          onChange={(e) => setNewImage((prev) => ({ ...prev, width: e.target.value }))}
                          className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                          placeholder="1920"
                        />
                      </div>
                      <div>
                        <Label className="text-slate-300">Max Height (optional)</Label>
                        <Input
                          type="number"
                          value={newImage.height}
                          onChange={(e) => setNewImage((prev) => ({ ...prev, height: e.target.value }))}
                          className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                          placeholder="1080"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="border-slate-700" onClick={() => setNewImageOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="bg-emerald-500 hover:bg-emerald-600" onClick={handleAddImageSlot}>
                      Add Slot
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="divide-y divide-slate-800">
              {imageSlots.length > 0 ? (
                imageSlots.map((slot) => (
                  <div key={slot.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{slot.label}</p>
                      <p className="text-sm text-slate-500">{slot.image_key}</p>
                    </div>
                    {(slot.recommended_width || slot.recommended_height) && (
                      <span className="text-sm text-slate-500">
                        {slot.recommended_width}x{slot.recommended_height}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  No image slots yet. Add your first image slot.
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          {!site.client_id ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
              <p className="text-slate-400">Assign a client to this site to configure permissions.</p>
            </div>
          ) : permissions ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl divide-y divide-slate-800">
              <PermissionRow
                label="Can edit business info"
                description="Allow client to edit business name, phone, email, address, hours, and social links"
                checked={permissions.can_edit_business_info}
                onChange={(checked) => handlePermissionChange("can_edit_business_info", checked)}
              />
              <PermissionRow
                label="Can edit text content"
                description="Allow client to edit text fields like headlines and descriptions"
                checked={permissions.can_edit_text}
                onChange={(checked) => handlePermissionChange("can_edit_text", checked)}
              />
              <PermissionRow
                label="Can edit images"
                description="Allow client to upload and replace images"
                checked={permissions.can_edit_images}
                onChange={(checked) => handlePermissionChange("can_edit_images", checked)}
              />
              <PermissionRow
                label="Can edit collections"
                description="Allow client to edit collection items like menu items"
                checked={permissions.can_edit_collections}
                onChange={(checked) => handlePermissionChange("can_edit_collections", checked)}
              />
              <PermissionRow
                label="Can add collection items"
                description="Allow client to add new items to collections"
                checked={permissions.can_add_collection_items}
                onChange={(checked) => handlePermissionChange("can_add_collection_items", checked)}
              />
              <PermissionRow
                label="Can delete collection items"
                description="Allow client to delete items from collections"
                checked={permissions.can_delete_collection_items}
                onChange={(checked) => handlePermissionChange("can_delete_collection_items", checked)}
              />
              <PermissionRow
                label="Can reorder items"
                description="Allow client to reorder collection items"
                checked={permissions.can_reorder_items}
                onChange={(checked) => handlePermissionChange("can_reorder_items", checked)}
              />
              <PermissionRow
                label="Can publish changes"
                description="Allow client to publish their changes to the live site"
                checked={permissions.can_publish}
                onChange={(checked) => handlePermissionChange("can_publish", checked)}
              />
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center">
              <p className="text-slate-400">Loading permissions...</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PermissionRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="p-4 flex items-center justify-between">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}