"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingPage } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { List, Plus, Trash2, Edit2, Loader2, GripVertical } from "lucide-react";

interface Collection {
  id: string;
  collection_key: string;
  label: string;
  schema: any;
}

interface CollectionItem {
  id: string;
  data: Record<string, any>;
  display_order: number;
}

export default function MenuPage() {
  const [loading, setLoading] = useState(true);
  const [siteSlug, setSiteSlug] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CollectionItem | null>(null);
  const [itemData, setItemData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: site } = await supabase
      .from("sites")
      .select("id, slug")
      .eq("client_id", user.id)
      .single();

    if (!site) {
      setLoading(false);
      return;
    }

    setSiteSlug(site.slug);

    const { data: collectionsData } = await supabase
      .from("collections")
      .select("id, collection_key, label, schema")
      .eq("site_id", site.id);

    setCollections(collectionsData || []);

    // Select first collection by default
    if (collectionsData && collectionsData.length > 0) {
      const firstCollection = collectionsData[0]!;
      setSelectedCollection(firstCollection);
      fetchItems(site.slug, firstCollection.collection_key);
    }

    setLoading(false);
  };

  const fetchItems = async (slug: string, collectionKey: string) => {
    setLoadingItems(true);
    try {
      const response = await fetch(`/api/client/sites/${slug}/collections/${collectionKey}/items`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    if (siteSlug) {
      fetchItems(siteSlug, collection.collection_key);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setItemData({});
    setEditDialogOpen(true);
  };

  const handleEditItem = (item: CollectionItem) => {
    setEditingItem(item);
    setItemData(item.data);
    setEditDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!siteSlug || !selectedCollection) return;
    setSaving(true);

    try {
      const url = editingItem
        ? `/api/client/sites/${siteSlug}/collections/${selectedCollection.collection_key}/items/${editingItem.id}`
        : `/api/client/sites/${siteSlug}/collections/${selectedCollection.collection_key}/items`;

      const response = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: itemData }),
      });

      if (!response.ok) throw new Error("Failed to save");

      toast.success(editingItem ? "Item updated" : "Item added");
      setEditDialogOpen(false);
      fetchItems(siteSlug, selectedCollection.collection_key);
    } catch (error) {
      toast.error("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!siteSlug || !selectedCollection) return;

    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(
        `/api/client/sites/${siteSlug}/collections/${selectedCollection.collection_key}/items/${itemId}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");

      toast.success("Item deleted");
      fetchItems(siteSlug, selectedCollection.collection_key);
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  if (loading) return <LoadingPage />;

  if (!siteSlug) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No site assigned to your account.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Collections"
        description="Manage your menu items, team members, and more"
      />

      {collections.length > 0 ? (
        <div className="flex gap-6">
          {/* Collection Tabs */}
          <div className="w-48 flex-shrink-0">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-2 space-y-1">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleSelectCollection(collection)}
                  className={`w-full text-left px-4 py-2 rounded-xl transition-colors ${
                    selectedCollection?.id === collection.id
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  {collection.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items List */}
          <div className="flex-1">
            {selectedCollection && (
              <div className="bg-slate-900/50 border border-slate-800 rounded-2xl">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-semibold text-white">{selectedCollection.label}</h3>
                  <Button
                    size="sm"
                    onClick={handleAddItem}
                    className="bg-emerald-500 hover:bg-emerald-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {loadingItems ? (
                  <div className="p-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
                  </div>
                ) : items.length > 0 ? (
                  <div className="divide-y divide-slate-800">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <GripVertical className="w-4 h-4 text-slate-600 cursor-grab" />
                          <div>
                            <p className="font-medium text-white">
                              {item.data.name || item.data.title || `Item ${item.id.slice(0, 8)}`}
                            </p>
                            {item.data.price && (
                              <p className="text-sm text-emerald-400">{item.data.price}</p>
                            )}
                            {item.data.description && (
                              <p className="text-sm text-slate-500 line-clamp-1">
                                {item.data.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditItem(item)}
                            className="text-slate-400 hover:text-white"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500">
                    No items yet. Add your first item.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={List}
          title="No collections configured"
          description="Contact your administrator to set up collections."
        />
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingItem ? "Edit Item" : "Add Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label className="text-slate-300">Name</Label>
              <Input
                value={itemData.name || ""}
                onChange={(e) => setItemData((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Price</Label>
              <Input
                value={itemData.price || ""}
                onChange={(e) => setItemData((prev) => ({ ...prev, price: e.target.value }))}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                placeholder="$0.00"
              />
            </div>
            <div>
              <Label className="text-slate-300">Description</Label>
              <Textarea
                value={itemData.description || ""}
                onChange={(e) => setItemData((prev) => ({ ...prev, description: e.target.value }))}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-300">Category</Label>
              <Input
                value={itemData.category || ""}
                onChange={(e) => setItemData((prev) => ({ ...prev, category: e.target.value }))}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveItem}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : editingItem ? (
                "Update"
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
