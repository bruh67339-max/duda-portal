import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Plus, Users, Mail, Phone, Globe } from "lucide-react";

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients } = await supabase
    .from("clients")
    .select(`
      id,
      name,
      email,
      company,
      phone,
      created_at,
      sites (id)
    `)
    .order("name");

  return (
    <div>
      <PageHeader title="Clients" description="Manage client accounts">
        <Link href="/admin/clients/new">
          <Button className="bg-emerald-500 hover:bg-emerald-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </Link>
      </PageHeader>

      {clients && clients.length > 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-sm font-medium text-slate-400 p-4">Client</th>
                <th className="text-left text-sm font-medium text-slate-400 p-4">Contact</th>
                <th className="text-left text-sm font-medium text-slate-400 p-4">Sites</th>
                <th className="text-left text-sm font-medium text-slate-400 p-4">Joined</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {clients.map((client: any) => (
                <tr key={client.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-slate-300">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{client.name}</p>
                        {client.company && (
                          <p className="text-sm text-slate-500">{client.company}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                        {client.email}
                      </div>
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Phone className="w-3.5 h-3.5" />
                          {client.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-300">{client.sites?.length || 0} sites</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-slate-500">
                      {new Date(client.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="p-4">
                    <Link href={`/admin/clients/${client.id}`}>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        Edit
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to get started"
          action={{
            label: "Add Client",
            onClick: () => {},
          }}
        />
      )}
    </div>
  );
}
