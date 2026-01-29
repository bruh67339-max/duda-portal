"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingPage } from "@/components/shared/loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BusinessInfo {
  business_name: string;
  phone: string;
  email: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  hours: Record<string, string>;
  social: Record<string, string>;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const SOCIAL_PLATFORMS = ["facebook", "instagram", "twitter", "yelp", "linkedin", "youtube"];

export default function BusinessInfoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [siteSlug, setSiteSlug] = useState<string | null>(null);
  const [data, setData] = useState<BusinessInfo>({
    business_name: "",
    phone: "",
    email: "",
    address: { street: "", city: "", state: "", zip: "", country: "" },
    hours: {},
    social: {},
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get client's site
    const { data: site } = await supabase
      .from("sites")
      .select("slug")
      .eq("client_id", user.id)
      .single();

    if (!site) {
      setLoading(false);
      return;
    }

    setSiteSlug(site.slug);

    // Fetch business info
    const { data: businessInfo } = await supabase
      .from("business_info")
      .select("*")
      .eq("site_id", (await supabase.from("sites").select("id").eq("slug", site.slug).single()).data?.id)
      .single();

    if (businessInfo) {
      setData({
        business_name: businessInfo.business_name || "",
        phone: businessInfo.phone || "",
        email: businessInfo.email || "",
        address: businessInfo.address || { street: "", city: "", state: "", zip: "", country: "" },
        hours: businessInfo.hours || {},
        social: businessInfo.social || {},
      });
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!siteSlug) return;
    setSaving(true);

    try {
      const response = await fetch(`/api/client/sites/${siteSlug}/business-info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      toast.success("Business info saved successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to save business info");
    } finally {
      setSaving(false);
    }
  };

  const updateAddress = (field: keyof BusinessInfo["address"], value: string) => {
    setData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  };

  const updateHours = (day: string, value: string) => {
    setData((prev) => ({
      ...prev,
      hours: { ...prev.hours, [day]: value },
    }));
  };

  const updateSocial = (platform: string, value: string) => {
    setData((prev) => ({
      ...prev,
      social: { ...prev.social, [platform]: value },
    }));
  };

  if (loading) return <LoadingPage />;

  if (!siteSlug) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No site assigned to your account.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Business Info"
        description="Update your business details"
      >
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </PageHeader>

      <div className="max-w-3xl space-y-8">
        {/* Contact Details */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label className="text-slate-300">Business Name</Label>
              <Input
                value={data.business_name}
                onChange={(e) => setData((prev) => ({ ...prev, business_name: e.target.value }))}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                placeholder="Joe's Pizza"
              />
            </div>
            <div>
              <Label className="text-slate-300">Phone</Label>
              <Input
                value={data.phone}
                onChange={(e) => setData((prev) => ({ ...prev, phone: e.target.value }))}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={data.email}
                onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                placeholder="info@example.com"
              />
            </div>
          </div>
        </section>

        {/* Address */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Address</h3>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300">Street</Label>
              <Input
                value={data.address.street}
                onChange={(e) => updateAddress("street", e.target.value)}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-slate-300">City</Label>
                <Input
                  value={data.address.city}
                  onChange={(e) => updateAddress("city", e.target.value)}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                  placeholder="Brooklyn"
                />
              </div>
              <div>
                <Label className="text-slate-300">State</Label>
                <Input
                  value={data.address.state}
                  onChange={(e) => updateAddress("state", e.target.value)}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                  placeholder="NY"
                />
              </div>
              <div>
                <Label className="text-slate-300">ZIP</Label>
                <Input
                  value={data.address.zip}
                  onChange={(e) => updateAddress("zip", e.target.value)}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                  placeholder="11201"
                />
              </div>
              <div>
                <Label className="text-slate-300">Country</Label>
                <Input
                  value={data.address.country}
                  onChange={(e) => updateAddress("country", e.target.value)}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                  placeholder="USA"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Business Hours */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Business Hours</h3>
          <div className="space-y-3">
            {DAYS.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <span className="w-28 text-slate-300 capitalize">{day}</span>
                <Input
                  value={data.hours[day] || ""}
                  onChange={(e) => updateHours(day, e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="9:00 AM - 5:00 PM or Closed"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Social Media */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Social Media</h3>
          <div className="space-y-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform}>
                <Label className="text-slate-300 capitalize">{platform}</Label>
                <Input
                  value={data.social[platform] || ""}
                  onChange={(e) => updateSocial(platform, e.target.value)}
                  className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                  placeholder={`https://${platform}.com/yourbusiness`}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
