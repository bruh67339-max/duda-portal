import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Type,
  List,
  Image,
  ArrowRight,
  CheckCircle,
  Clock,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[Dashboard] Auth user:", user?.id, user?.email);

  if (!user) redirect("/login");

  // Get client info
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", user.id)
    .single();

  console.log("[Dashboard] Client query result:", { client, clientError });

  if (!client) redirect("/login");

  // Get assigned site
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, name, slug, status, updated_at")
    .eq("client_id", client.id)
    .single();

  console.log("[Dashboard] Site query result:", { site, siteError });

  // Get content counts if site exists
  let textContentCount = 0;
  let collectionsCount = 0;
  let imagesCount = 0;

  if (site) {
    console.log("[Dashboard] Fetching content counts for site:", site.id);

    const [textContent, collections, images] = await Promise.all([
      supabase.from("text_content").select("id", { count: "exact" }).eq("site_id", site.id),
      supabase.from("collections").select("id", { count: "exact" }).eq("site_id", site.id),
      supabase.from("images").select("id", { count: "exact" }).eq("site_id", site.id),
    ]);

    console.log("[Dashboard] Query results:", { textContent, collections, images });

    textContentCount = textContent.count || 0;
    collectionsCount = collections.count || 0;
    imagesCount = images.count || 0;
  } else {
    console.log("[Dashboard] No site found for client:", client.id);
  }

  return (
    <div>
      <PageHeader
        title={`Welcome, ${client.name.split(" ")[0]}!`}
        description="Manage your website content"
      />

      {site ? (
        <>
          {/* Site Status Card */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">{site.name}</h2>
                <p className="text-slate-400">/{site.slug}</p>
              </div>
              <div className="text-right">
                <Badge
                  variant={site.status === "published" ? "success" : "secondary"}
                  className="mb-2"
                >
                  {site.status === "published" ? (
                    <><CheckCircle className="w-3 h-3 mr-1" /> Live</>
                  ) : (
                    <><Clock className="w-3 h-3 mr-1" /> Draft</>
                  )}
                </Badge>
                <p className="text-xs text-slate-500">
                  Last updated {new Date(site.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              href="/dashboard/business"
              icon={Building2}
              title="Business Info"
              description="Update contact details, hours, and social links"
            />
            <QuickActionCard
              href="/dashboard/content"
              icon={Type}
              title="Text Content"
              description={`${textContentCount} editable text fields`}
            />
            <QuickActionCard
              href="/dashboard/menu"
              icon={List}
              title="Collections"
              description={`${collectionsCount} collections to manage`}
            />
            <QuickActionCard
              href="/dashboard/images"
              icon={Image}
              title="Images"
              description={`${imagesCount} image slots available`}
            />
          </div>
        </>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
          <h2 className="text-xl font-bold text-white mb-2">No Site Assigned</h2>
          <p className="text-slate-400">
            Contact your administrator to get a site assigned to your account.
          </p>
        </div>
      )}
    </div>
  );
}

function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 hover:bg-slate-900 transition-all group"
    >
      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
        <Icon className="w-6 h-6 text-emerald-400" />
      </div>
      <h3 className="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors flex items-center justify-between">
        {title}
        <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </h3>
      <p className="text-sm text-slate-400">{description}</p>
    </Link>
  );
}
