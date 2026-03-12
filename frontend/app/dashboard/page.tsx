"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Users, FileText, Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Plus, Calendar, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { ApiClient, type Application } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <DashboardContent />
      </div>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect admin users to admin panel - they shouldn't access participant dashboard
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      router.replace('/admin');
      return;
    }
  }, [user, router]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiClient.getUserApplications();
      setApplications(response.applications);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      setError('Failed to load applications. Please try again.');
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  // Listen for real-time application updates via WebSocket
  useEffect(() => {
    const handleApplicationUpdate = (event: CustomEvent) => {
      console.log('Dashboard received application update:', event.detail);
      
      // Refresh applications list to show latest status
      fetchApplications();
    };

    const handleAIReviewProgress = (event: CustomEvent) => {
      console.log('Dashboard received AI review progress:', event.detail);
      
      // Refresh applications list to show latest AI review status
      fetchApplications();
    };

    // Add event listeners for WebSocket events
    window.addEventListener('application-status-updated', handleApplicationUpdate as EventListener);
    window.addEventListener('application-rejected', handleApplicationUpdate as EventListener);
    window.addEventListener('ai-review-progress', handleAIReviewProgress as EventListener);

    return () => {
      window.removeEventListener('application-status-updated', handleApplicationUpdate as EventListener);
      window.removeEventListener('application-rejected', handleApplicationUpdate as EventListener);
      window.removeEventListener('ai-review-progress', handleAIReviewProgress as EventListener);
    };
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "SUBMITTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "DRAFT":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "UNDER_REVIEW":
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Enhanced Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Welcome back to your Dashboard!
              </h1>
              <p className="text-muted-foreground mt-3 text-lg">
                Track your hackathon journey and manage your innovations
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-2">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="font-semibold">{new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 animate-fade-in-up">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Applications</CardTitle>
              <div className="p-2 bg-blue-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <FileText className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{applications.length}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +1 from last month
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 animate-fade-in-up" style={{animationDelay: '100ms'}}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 dark:bg-green-800 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Submitted</CardTitle>
              <div className="p-2 bg-green-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                {applications.filter(app => app.status?.toUpperCase() === "SUBMITTED").length}
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                <Target className="h-3 w-3 mr-1" />
                Ready for review
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 animate-fade-in-up" style={{animationDelay: '200ms'}}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 dark:bg-purple-800 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Team Members</CardTitle>
              <div className="p-2 bg-purple-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {applications.reduce((total, app) => total + app.teamSize, 0)}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                <Users className="h-3 w-3 mr-1" />
                Across all projects
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 animate-fade-in-up" style={{animationDelay: '300ms'}}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200 dark:bg-orange-800 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Success Rate</CardTitle>
              <div className="p-2 bg-orange-500 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                <Trophy className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                {applications.length > 0 ? Math.round((applications.filter(app => app.status?.toUpperCase() === "APPROVED").length / applications.length) * 100) : 0}%
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center mt-1">
                <Trophy className="h-3 w-3 mr-1" />
                Approval rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Applications List */}
        <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm animate-fade-in-up" style={{animationDelay: '400ms'}}>
          <CardHeader className="bg-gradient-to-r from-muted/30 to-transparent border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  Your Applications
                </CardTitle>
                <CardDescription className="text-base mt-1">
                  Manage and track your hackathon submissions
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchApplications}
                  disabled={loading}
                  className="shadow-sm hover:shadow-md transition-shadow"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button asChild className="shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Link href="/submit">
                    <Plus className="mr-2 h-4 w-4" />
                    New Application
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 h-12 w-12 animate-ping border-2 border-primary rounded-full opacity-20"></div>
                </div>
                <span className="mt-4 text-muted-foreground text-lg">Loading your applications...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                  <div className="absolute inset-0 h-16 w-16 bg-red-500/10 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-red-600">Error Loading Applications</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={fetchApplications}
                  className="shadow-md hover:shadow-lg transition-all"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            ) : applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((application, index) => (
                  <div
                    key={application.id}
                    className="group relative overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
                    
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-lg">
                          <Trophy className="h-8 w-8 text-white" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                            {application.title}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              Team of {application.teamSize} members
                            </span>
                            {application.submittedAt && (
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge 
                          className={`${getStatusColor(application.status)} px-3 py-1 shadow-sm`}
                        >
                          <span className="flex items-center gap-2">
                            {getStatusIcon(application.status)}
                            {application.status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          asChild
                          className="shadow-sm hover:shadow-md transition-all hover:scale-105"
                        >
                          <Link href={`/applications/${application.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="relative inline-block mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full flex items-center justify-center mx-auto">
                    <Trophy className="h-12 w-12 text-primary" />
                  </div>
                  <div className="absolute inset-0 w-24 h-24 bg-primary/10 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-2xl font-semibold mb-3">No applications yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg">
                  Ready to showcase your innovative ideas? Start your hackathon journey today!
                </p>
                <Button asChild size="lg" className="shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Link href="/submit">
                    <Plus className="mr-2 h-5 w-5" />
                    Create Your First Application
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
