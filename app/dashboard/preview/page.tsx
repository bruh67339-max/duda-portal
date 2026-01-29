"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingPage } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw, Maximize2 } from "lucide-react";

export default function PreviewPage() {
  const [loading, setLoading] = useState(true);
  const [site, setSite] = useState<{ name: string; replit_url: string | null } | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    fetchSite();
  }, []);

  const fetchSite = async () => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: siteData } = await supabase
      .from("sites")
      .select("name, replit_url")
      .eq("client_id", user.id)
      .single();

    setSite(siteData);
    setLoading(false);
  };

  const handleRefresh = () => {
    setIframeKey((prev) => prev + 1);
  };

  if (loading) return <LoadingPage />;

  if (!site) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No site assigned to your account.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      <PageHeader title="Preview" description="Preview your site with the latest changes">
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {site.replit_url && (
            <a href={site.replit_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="border-slate-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </a>
          )}
        </div>
      </PageHeader>

      {site.replit_url ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden h-[calc(100%-5rem)]">
          <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
              </div>
              <span className="text-sm text-slate-400 ml-4">{site.replit_url}</span>
            </div>
            <a
              href={site.replit_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white"
            >
              <Maximize2 className="w-4 h-4" />
            </a>
          </div>
          <iframe
            key={iframeKey}
            src={site.replit_url}
            className="w-full h-[calc(100%-52px)] bg-white"
            title="Site Preview"
          />
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <p className="text-slate-400">
            No preview URL configured for this site.
            <br />
            Contact your administrator to set up a preview URL.
          </p>
        </div>
      )}

      <p className="text-center text-sm text-slate-500 mt-4">
        Note: Changes are saved but not published. Use the Publish button to make changes live.
      </p>
    </div>
  );
}
