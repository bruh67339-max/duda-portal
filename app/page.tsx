import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Globe, Users, Zap, Shield } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">S</span>
            </div>
            <span className="text-xl font-bold text-white">SiteManager</span>
          </div>
          <Link href="/login">
            <Button variant="outline" className="border-slate-700 text-white hover:bg-slate-800">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span className="text-sm text-emerald-400">Client Portal System</span>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
          Empower Your Clients to
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
            Manage Their Content
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Give your clients the power to update their website content without touching code.
          Simple, secure, and seamless.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
              Get Started
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-slate-700 text-white hover:bg-slate-800 px-8">
            Learn More
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={Globe}
            title="Multi-Site Support"
            description="Manage unlimited client sites from a single dashboard"
          />
          <FeatureCard
            icon={Users}
            title="Client Access"
            description="Give each client their own login to manage their site"
          />
          <FeatureCard
            icon={Zap}
            title="Real-time Updates"
            description="Changes publish instantly to your client's website"
          />
          <FeatureCard
            icon={Shield}
            title="Granular Permissions"
            description="Control exactly what each client can edit"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container mx-auto px-6 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} SiteManager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
      <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-emerald-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  );
}
