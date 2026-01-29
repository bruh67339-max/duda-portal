"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!data.user) {
        throw new Error("Login failed");
      }

      // Check if admin
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (adminUser) {
        router.push("/admin");
        router.refresh();
        return;
      }

      // Check if client
      const { data: clientUser } = await supabase
        .from("clients")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (clientUser) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Neither admin nor client
      setError("Account not found. Please contact support.");
      await supabase.auth.signOut();
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl mb-4">
                <span className="text-2xl font-bold text-white">S</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-slate-400 text-sm mt-1">Sign in to manage your sites</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            Forgot password?{" "}
            <Link href="/reset-password" className="text-emerald-400 hover:underline">
              Reset it here
            </Link>
          </p>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          <Link href="/" className="hover:text-slate-400">
            &larr; Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
