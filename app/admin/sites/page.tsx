import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { SiteCard } from "@/components/admin/site-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Plus, Globe } from "lucide-react";

export default async function SitesPage() {
  const supabase = await createClient();

  const { data: sites } = await supabase
    .from("sites")
    .select(`
      id,
      name,
      slug,
      status,
      replit_url,
      updated_at,
      clients (
        name
      )
    `)
    .order("updated_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Sites" description="Manage all client sites">
        <Link href="/admin/sites/new">
          <Button className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="w-4 h-4 mr-2" />
            New Site
          </Button>
        </Link>
      </PageHeader>

      {sites && sites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site: any) => (
            <SiteCard
              key={site.id}
              id={site.id}
              name={site.name}
              slug={site.slug}
              status={site.status}
              clientName={site.clients?.name}
              replitUrl={site.replit_url}
              updatedAt={site.updated_at}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Globe}
          title="No sites yet"
          description="Create your first site to get started"
          action={{
            label: "Create Site",
            onClick: () => {},
          }}
        />
      )}
    </div>
  );
}
