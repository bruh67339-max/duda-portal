import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { StatsCard } from "@/components/admin/stats-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Users, CheckCircle, Edit3, Plus, ArrowRight } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch stats
  const [sitesResult, clientsResult, publishedSitesResult] = await Promise.all([
    supabase.from("sites").select("id", { count: "exact" }),
    supabase.from("clients").select("id", { count: "exact" }),
    supabase.from("sites").select("id", { count: "exact" }).eq("status", "published"),
  ]);

  const totalSites = sitesResult.count || 0;
  const totalClients = clientsResult.count || 0;
  const publishedSites = publishedSitesResult.count || 0;

  // Fetch recent sites
  const { data: recentSites } = await supabase
    .from("sites")
    .select(`
      id,
      name,
      slug,
      status,
      updated_at,
      clients (
        name
      )
    `)
    .order("updated_at", { ascending: false })
    .limit(5);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your client portal"
      >
        <Link href="/admin/sites/new">
          <Button className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="w-4 h-4 mr-2" />
            New Site
          </Button>
        </Link>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Sites"
          value={totalSites}
          icon={Globe}
        />
        <StatsCard
          title="Active Clients"
          value={totalClients}
          icon={Users}
        />
        <StatsCard
          title="Published Sites"
          value={publishedSites}
          icon={CheckCircle}
        />
        <StatsCard
          title="Edits Today"
          value={0}
          description="Content changes"
          icon={Edit3}
        />
      </div>

      {/* Recent Sites */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent Sites</h2>
          <Link
            href="/admin/sites"
            className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="divide-y divide-slate-800">
          {recentSites && recentSites.length > 0 ? (
            recentSites.map((site: any) => (
              <Link
                key={site.id}
                href={`/admin/sites/${site.id}`}
                className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{site.name}</p>
                    <p className="text-sm text-slate-500">
                      {site.clients?.name || "Unassigned"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      site.status === "published"
                        ? "success"
                        : site.status === "draft"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {site.status}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    {new Date(site.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-400 mb-4">No sites yet</p>
              <Link href="/admin/sites/new">
                <Button variant="outline" className="border-slate-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create your first site
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
