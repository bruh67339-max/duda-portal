"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingPage } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Type, Check, X } from "lucide-react";

interface TextContent {
  id: string;
  content_key: string;
  label: string;
  content_type: string;
  max_length: number | null;
  content: string;
}

export default function ContentPage() {
  const [loading, setLoading] = useState(true);
  const [siteSlug, setSiteSlug] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<TextContent[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get client's site
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

    // Fetch text content (combined field definitions and content)
    const { data: content, error } = await supabase
      .from("text_content")
      .select("id, content_key, label, content_type, max_length, content")
      .eq("site_id", site.id)
      .order("sort_order");

    console.log("[ContentPage] Text content query:", { content, error });

    setTextContent(content || []);
    setLoading(false);
  };

  const handleEdit = (field: TextContent) => {
    setEditingField(field.id);
    setEditValue(field.content || "");
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleSave = async (contentKey: string) => {
    if (!siteSlug) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/client/sites/${siteSlug}/text/${contentKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editValue }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save");
      }

      // Update local state
      setTextContent((prev) =>
        prev.map((f) =>
          f.id === editingField ? { ...f, content: editValue } : f
        )
      );

      toast.success("Content saved");
      setEditingField(null);
      setEditValue("");
    } catch (error: any) {
      toast.error(error.message || "Failed to save content");
    } finally {
      setSaving(false);
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
        title="Text Content"
        description="Edit your website text and copy"
      />

      {textContent.length > 0 ? (
        <div className="max-w-3xl space-y-4">
          {textContent.map((field) => (
            <div
              key={field.id}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-white">{field.label}</h3>
                  <p className="text-sm text-slate-500">{field.content_key}</p>
                </div>
                {field.max_length && (
                  <span className="text-xs text-slate-500">
                    {editingField === field.id
                      ? `${editValue.length}/${field.max_length}`
                      : `${(field.content || "").length}/${field.max_length}`}
                  </span>
                )}
              </div>

              {editingField === field.id ? (
                <div className="space-y-4">
                  {field.content_type === "rich_text" || field.content_type === "html" ? (
                    <Textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white min-h-[150px]"
                      maxLength={field.max_length || undefined}
                      autoFocus
                    />
                  ) : (
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white"
                      maxLength={field.max_length || undefined}
                      autoFocus
                    />
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleSave(field.content_key)}
                      disabled={saving}
                      className="bg-emerald-500 hover:bg-emerald-600"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={saving}
                      className="border-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => handleEdit(field)}
                  className="cursor-pointer p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors min-h-[48px]"
                >
                  {field.content ? (
                    <p className="text-slate-200 whitespace-pre-wrap">
                      {field.content}
                    </p>
                  ) : (
                    <p className="text-slate-500 italic">Click to add content...</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Type}
          title="No text fields configured"
          description="Contact your administrator to set up editable text fields."
        />
      )}
    </div>
  );
}
