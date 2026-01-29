'use client';

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Globe, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteCardProps {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published" | "archived";
  clientName?: string;
  replitUrl?: string;
  updatedAt: string;
}

export function SiteCard({
  id,
  name,
  slug,
  status,
  clientName,
  replitUrl,
  updatedAt,
}: SiteCardProps) {
  return (
    <Link
      href={`/admin/sites/${id}`}
      className="block bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 hover:bg-slate-900 transition-all group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
          <Globe className="w-6 h-6 text-slate-400 group-hover:text-emerald-400 transition-colors" />
        </div>
        <Badge
          variant={
            status === "published"
              ? "success"
              : status === "draft"
              ? "secondary"
              : "outline"
          }
        >
          {status}
        </Badge>
      </div>

      <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">
        {name}
      </h3>
      <p className="text-sm text-slate-500 mb-3">/{slug}</p>

      {clientName && (
        <p className="text-sm text-slate-400 mb-2">
          Client: <span className="text-slate-300">{clientName}</span>
        </p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-slate-800 mt-4">
        <span className="text-xs text-slate-500">
          Updated {new Date(updatedAt).toLocaleDateString()}
        </span>
        {replitUrl && (
          <a
            href={replitUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"
          >
            View site <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </Link>
  );
}
