"use client";

import { useEffect, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ApiClient, type BrochureMetadata } from "@/lib/api";
import { toast } from "sonner";

export default function BrochurePage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <BrochureContent />
      </div>
    </ProtectedRoute>
  );
}

function BrochureContent() {
  const [brochure, setBrochure] = useState<BrochureMetadata | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let currentObjectUrl: string | null = null;

    const loadBrochure = async () => {
      try {
        const metadata = await ApiClient.getBrochureMetadata();
        if (!metadata) {
          setBrochure(null);
          return;
        }
        const file = await ApiClient.getBrochureFile();
        currentObjectUrl = URL.createObjectURL(file);
        if (active) {
          setBrochure(metadata);
          setObjectUrl(currentObjectUrl);
        }
      } catch (err) {
        console.error('Failed to load hackathon brochure:', err);
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load the brochure');
          toast.error('Failed to load the hackathon brochure');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadBrochure();
    return () => {
      active = false;
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    };
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Hackathon Brochure
          </CardTitle>
          <CardDescription>
            View or download the latest brochure uploaded by the hackathon organizers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading brochure...
            </div>
          ) : error ? (
            <p className="py-8 text-sm text-destructive">{error}</p>
          ) : !brochure || !objectUrl ? (
            <p className="py-8 text-sm text-muted-foreground">
              The organizers have not uploaded a brochure yet.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{brochure.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    Uploaded {new Date(brochure.uploadedAt).toLocaleDateString()}
                    {' · '}
                    {(brochure.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <Button asChild>
                  <a href={objectUrl} download={brochure.fileName}>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </a>
                </Button>
              </div>
              <iframe
                src={objectUrl}
                title="Hackathon brochure PDF"
                className="h-[75vh] w-full rounded-md border"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
