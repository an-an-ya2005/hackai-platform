"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { ReviewTimeline } from "@/components/review-timeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Globe, 
  Github, 
  ExternalLink, 
  Calendar,
  XCircle,
  FileText,
  Users,
  Code
} from "lucide-react";
import Link from "next/link";
import { ApiClient, type Application } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

export default function ApplicationDetailPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <ApplicationDetailContent />
      </div>
    </ProtectedRoute>
  );
}

function ApplicationDetailContent() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applicationId = params.id as string;

  // Redirect admin users to admin panel - they shouldn't access participant features
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      router.replace('/admin');
      return;
    }
  }, [user, router]);

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        setError(null);
        const app = await ApiClient.getApplication(applicationId);
        setApplication(app);
      } catch (err) {
        console.error('Failed to fetch application:', err);
        setError(err instanceof Error ? err.message : 'Failed to load application');
        toast.error('Failed to load application details');
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      fetchApplication();
    }
  }, [applicationId]);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUBMITTED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "UNDER_REVIEW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-8 h-8 border-2 border-muted border-t-foreground rounded-full animate-spin"></div>
            <p className="text-sm text-muted-foreground">Loading application...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Application not found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {error || 'The application you are looking for could not be found.'}
              </p>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => router.back()} size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button asChild size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            className="mb-6 -ml-3 text-muted-foreground hover:text-foreground"
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">{application.title}</h1>
              <Badge 
                variant="outline" 
                className={`${getStatusColor(application.status)} border-none`}
              >
                {application.status?.toUpperCase() || 'UNKNOWN'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {application.submittedAt 
                  ? new Date(application.submittedAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : new Date(application.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                }
              </span>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Application Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Project Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Description</h4>
                  <p className="text-foreground leading-relaxed">{application.description}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Problem Statement</h4>
                  <p className="text-foreground leading-relaxed">{application.problemStatement}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Solution</h4>
                  <p className="text-foreground leading-relaxed">{application.solution}</p>
                </div>
              </CardContent>
            </Card>

            {/* Technical Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Technical Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Tech Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {application.techStack.map((tech) => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {(application.githubRepo || application.demoUrl) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {application.githubRepo && (
                        <Button variant="outline" asChild className="justify-start h-auto p-4">
                          <a href={application.githubRepo} target="_blank" rel="noopener noreferrer">
                            <div className="flex items-center gap-3">
                              <Github className="h-5 w-5" />
                              <div className="text-left">
                                <div className="font-medium">Repository</div>
                                <div className="text-xs text-muted-foreground">View source code</div>
                              </div>
                            </div>
                            <ExternalLink className="ml-auto h-4 w-4 opacity-50" />
                          </a>
                        </Button>
                      )}
                      
                      {application.demoUrl && (
                        <Button variant="outline" asChild className="justify-start h-auto p-4">
                          <a href={application.demoUrl} target="_blank" rel="noopener noreferrer">
                            <div className="flex items-center gap-3">
                              <Globe className="h-5 w-5" />
                              <div className="text-left">
                                <div className="font-medium">Live Demo</div>
                                <div className="text-xs text-muted-foreground">Try the app</div>
                              </div>
                            </div>
                            <ExternalLink className="ml-auto h-4 w-4 opacity-50" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Team Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Team Size</h4>
                    <div className="text-2xl font-bold">
                      {application.teamSize} {application.teamSize === 1 ? 'member' : 'members'}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Submitted</h4>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {application.submittedAt 
                          ? new Date(application.submittedAt).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : new Date(application.createdAt).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {application.submittedAt 
                          ? new Date(application.submittedAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : new Date(application.createdAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">Team Members</h4>
                  <div className="space-y-3">
                    {application.teamMembers.map((member, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                          {member.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{member}</div>
                          {index === 0 && (
                            <div className="text-xs text-muted-foreground">Team Leader</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-start gap-3 pt-4">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              {application.status?.toUpperCase() === 'DRAFT' && (
                <Button asChild>
                  <Link href={`/applications/${application.id}/edit`}>
                    Continue Editing
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Right Column - Review Timeline */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <ReviewTimeline 
                applicationId={application.id}
                currentStatus={application.status}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
