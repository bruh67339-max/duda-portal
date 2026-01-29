"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingPage } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Rocket, CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react";

interface PublishVersion {
  id: string;
  version_number: number;
  published_at: string;
  notes: string | null;
}

export default function PublishPage() {
  const [loading, setLoading] = useState(true);
  const [siteSlug, setSiteSlug] = useState<string | null>(null);
  const [site, setSite] = useState<{ name: string; status: string } | null>(null);
  const [versions, setVersions] = useState<PublishVersion[]>([]);
  const [canPublish, setCanPublish] = useState(false);

  // Publish dialog states
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [publishNotes, setPublishNotes] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get site
    const { data: siteData } = await supabase
      .from("sites")
      .select("id, slug, name, status")
      .eq("client_id", user.id)
      .single();

    if (!siteData) {
      setLoading(false);
      return;
    }

    setSiteSlug(siteData.slug);
    setSite({ name: siteData.name, status: siteData.status });

    // Check permissions
    const { data: permissions } = await supabase
      .from("site_permissions")
      .select("can_publish")
      .eq("site_id", siteData.id)
      .eq("client_id", user.id)
      .single();

    setCanPublish(permissions?.can_publish || false);

    // Fetch publish history (mock data for now)
    setVersions([
      {
        id: "1",
        version_number: 3,
        published_at: new Date(Date.now() - 86400000).toISOString(),
        notes: "Updated menu prices",
      },
      {
        id: "2",
        version_number: 2,
        published_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        notes: "Added new hero image",
      },
      {
        id: "3",
        version_number: 1,
        published_at: new Date(Date.now() - 86400000 * 7).toISOString(),
        notes: "Initial publish",
      },
    ]);

    setLoading(false);
  };

  const handlePublish = async () => {
    if (!siteSlug) return;
    setPublishing(true);

    try {
      const response = await fetch(`/api/client/sites/${siteSlug}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: publishNotes }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to publish");
      }

      toast.success("Changes published successfully!");
      setPublishDialogOpen(false);
      setPublishNotes("");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <LoadingPage />;

  if (!siteSlug || !site) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No site assigned to your account.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Publish" description="Publish your changes to make them live">
        {canPublish && (
          <Button
            onClick={() => setPublishDialogOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            <Rocket className="w-4 h-4 mr-2" />
            Publish Now
          </Button>
        )}
      </PageHeader>

      {/* Current Status */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {site.status === "published" ? (
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
            ) : (
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{site.name}</h2>
              <p className="text-slate-400">
                {site.status === "published"
                  ? "Your site is live"
                  : "Your site is in draft mode"}
              </p>
            </div>
          </div>
          <Badge variant={site.status === "published" ? "success" : "warning"}>
            {site.status}
          </Badge>
        </div>
      </div>

      {!canPublish && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-yellow-400">Publishing Disabled</h3>
              <p className="text-slate-400 text-sm mt-1">
                You don't have permission to publish changes. Contact your administrator
                to enable publishing for your account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Publish History */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-semibold text-white">Publish History</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {versions.length > 0 ? (
            versions.map((version) => (
              <div key={version.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-mono text-slate-400">
                      v{version.version_number}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {version.notes || `Version ${version.version_number}`}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(version.published_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-500">
              No publish history yet.
            </div>
          )}
        </div>
      </div>

      {/* Publish Confirmation Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Publish Changes</DialogTitle>
            <DialogDescription className="text-slate-400">
              This will make all your changes live on your website.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label className="text-slate-300">Publish Notes (optional)</Label>
            <Textarea
              value={publishNotes}
              onChange={(e) => setPublishNotes(e.target.value)}
              className="mt-1.5 bg-slate-800 border-slate-700 text-white"
              placeholder="What changed in this update?"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700"
              onClick={() => setPublishDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublish}
              disabled={publishing}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {publishing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
