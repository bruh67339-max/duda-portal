"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Building2,
  Type,
  List,
  Image,
  Eye,
  LogOut,
  ChevronRight,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/business", label: "Business Info", icon: Building2 },
  { href: "/dashboard/content", label: "Text Content", icon: Type },
  { href: "/dashboard/menu", label: "Collections", icon: List },
  { href: "/dashboard/images", label: "Images", icon: Image },
];

interface ClientSidebarProps {
  siteName?: string;
  siteSlug?: string;
  canPublish?: boolean;
}

export function ClientSidebar({ siteName, siteSlug, canPublish }: ClientSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col min-h-screen fixed left-0 top-0">
      {/* Site info */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
            <span className="text-lg font-bold text-white">
              {siteName?.charAt(0) || "S"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-white truncate">{siteName || "Your Site"}</h1>
            {siteSlug && <p className="text-xs text-slate-500">/{siteSlug}</p>}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
            </Link>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="p-4 space-y-2 border-t border-slate-800">
        <Link href="/dashboard/preview" className="block">
          <Button
            variant="outline"
            className="w-full justify-start border-slate-700 text-slate-300"
          >
            <Eye className="w-4 h-4 mr-2" />
            Preview Site
          </Button>
        </Link>

        {canPublish && (
          <Link href="/dashboard/publish" className="block">
            <Button className="w-full justify-start bg-emerald-500 hover:bg-emerald-600">
              <Rocket className="w-4 h-4 mr-2" />
              Publish Changes
            </Button>
          </Link>
        )}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
