"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingPage } from "@/components/shared/loading";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Image as ImageIcon, Upload, X, Loader2, Trash2 } from "lucide-react";

interface ImageData {
  id: string;
  image_key: string;
  label: string;
  recommended_width: number | null;
  recommended_height: number | null;
  url: string | null;
  alt_text: string | null;
}

export default function ImagesPage() {
  const [loading, setLoading] = useState(true);
  const [siteSlug, setSiteSlug] = useState<string | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);

  // Upload dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [uploading, setUploading] = useState(false);
  const [altText, setAltText] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: site } = await supabase
      .from("sites")
      .select("id, slug")
      .eq("client_id", user.id)
      .single();

    if (!site) {
      setLoading(false);
      return;
    }

    setSiteSlug(site.slug);

    // Fetch images (combined slot definitions and content)
    const { data: imageData, error } = await supabase
      .from("images")
      .select("id, image_key, label, recommended_width, recommended_height, url, alt_text")
      .eq("site_id", site.id)
      .order("sort_order");

    console.log("[ImagesPage] Images query:", { imageData, error });

    setImages(imageData || []);
    setLoading(false);
  };

  const handleOpenUpload = (image: ImageData) => {
    setSelectedImage(image);
    setAltText(image.alt_text || "");
    setPreviewUrl(image.url);
    setSelectedFile(null);
    setUploadDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!siteSlug || !selectedImage) return;
    setUploading(true);

    try {
      // If there's a new file, upload it first
      let imageUrl = selectedImage.url;

      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("image_key", selectedImage.image_key);

        const uploadResponse = await fetch(`/api/client/sites/${siteSlug}/images/${selectedImage.image_key}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error("Failed to upload image");

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.data?.url || uploadData.url;
      }

      // Update the image content
      const response = await fetch(`/api/client/sites/${siteSlug}/images/${selectedImage.image_key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrl,
          alt_text: altText,
        }),
      });

      if (!response.ok) throw new Error("Failed to save image");

      toast.success("Image saved");
      setUploadDialogOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to save image");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async (imageKey: string) => {
    if (!siteSlug) return;

    if (!confirm("Are you sure you want to remove this image?")) return;

    try {
      const response = await fetch(`/api/client/sites/${siteSlug}/images/${imageKey}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove image");

      toast.success("Image removed");
      fetchData();
    } catch (error) {
      toast.error("Failed to remove image");
    }
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
        title="Images"
        description="Manage your website images"
      />

      {images.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div
              key={image.id}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden"
            >
              <div
                className="relative aspect-video bg-slate-800 cursor-pointer group"
                onClick={() => handleOpenUpload(image)}
              >
                {image.url ? (
                  <>
                    <img
                      src={image.url}
                      alt={image.alt_text || ""}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="sm" variant="secondary">
                        <Upload className="w-4 h-4 mr-2" />
                        Replace
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 group-hover:text-slate-300 transition-colors">
                    <ImageIcon className="w-12 h-12 mb-2" />
                    <span className="text-sm">Click to upload</span>
                  </div>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{image.label}</p>
                  {image.recommended_width && image.recommended_height && (
                    <p className="text-xs text-slate-500">
                      {image.recommended_width}x{image.recommended_height}
                    </p>
                  )}
                </div>
                {image.url && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(image.image_key);
                    }}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ImageIcon}
          title="No image slots configured"
          description="Contact your administrator to set up image slots."
        />
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedImage?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Preview */}
            <div
              className="relative aspect-video bg-slate-800 rounded-lg overflow-hidden cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <Upload className="w-12 h-12 mb-2" />
                  <span className="text-sm">Click or drag to upload</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div>
              <Label className="text-slate-300">Alt Text</Label>
              <Input
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                className="mt-1.5 bg-slate-800 border-slate-700 text-white"
                placeholder="Describe the image for accessibility"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-700"
              onClick={() => setUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
