import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientSidebar } from "@/components/client/client-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[DashboardLayout] Auth user:", user?.id, user?.email);

  if (!user) {
    redirect("/login");
  }

  // Check if user is a client
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", user.id)
    .single();

  console.log("[DashboardLayout] Client query:", { client, clientError });

  if (!client) {
    // Check if admin and redirect to admin
    const { data: adminUser } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .single();

    if (adminUser) {
      redirect("/admin");
    }

    redirect("/login");
  }

  // Get the client's assigned site
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, name, slug")
    .eq("client_id", client.id)
    .single();

  console.log("[DashboardLayout] Site query:", { site, siteError });

  // Get permissions
  let canPublish = false;
  if (site) {
    const { data: permissions } = await supabase
      .from("site_permissions")
      .select("can_publish")
      .eq("site_id", site.id)
      .eq("client_id", client.id)
      .single();

    canPublish = permissions?.can_publish || false;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <ClientSidebar
        siteName={site?.name}
        siteSlug={site?.slug}
        canPublish={canPublish}
      />
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
