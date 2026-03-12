"use client";

import { useState, useEffect, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import { AdminProtectedRoute } from "@/components/admin-protected-route";
import { ApplicationReviewModal } from "@/components/application-review-modal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, FileText, Clock, CheckCircle, XCircle, Search, 
  Calendar, Eye, Star, RefreshCw, AlertCircle, Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ApiClient, type Application } from "@/lib/api";
import { toast } from "sonner";

export default function AdminPage() {
  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <AdminDashboardContent />
      </div>
    </AdminProtectedRoute>
  );
}

function AdminDashboardContent() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal state
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Always fetch all applications without status filter - let client-side handle filtering
      console.log('Fetching all applications (client-side filtering)');
      
      const response = await ApiClient.getAllApplications(); // No parameters needed
      console.log('Success! Received applications:', response.applications?.length || 0);
      setApplications(response.applications || []);
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Failed to fetch applications:', error);
      console.error('Error details:', {
        message: error.message,
        status: (error as { status?: number }).status,
        response: (error as { response?: unknown }).response
      });
      
      // Handle specific error cases
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Unauthorized: Please ensure you are logged in with admin privileges.');
        toast.error('Admin login required');
      } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
        setError('Access denied: Admin privileges required.');
        toast.error('Admin access required');
      } else {
        setError(`Failed to load applications: ${error.message || 'Unknown error'}`);
        toast.error('Failed to load applications');
      }
    } finally {
      setLoading(false);
    }
  }, []); // Remove statusFilter dependency since we're doing client-side filtering

  const refreshApplications = async () => {
    try {
      setRefreshing(true);
      // Fetch all applications, filtering will be done client-side
      const response = await ApiClient.getAllApplications();
      setApplications(response.applications || []);
      toast.success('Applications refreshed');
    } catch (err) {
      console.error('Failed to refresh applications:', err);
      toast.error('Failed to refresh applications');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Remove the separate status filter effect since we're doing client-side filtering now

  // Filter applications based on both search term and status filter (client-side filtering)
  const filteredApplications = applications.filter(app => {
    // First apply status filter
    const statusMatch = statusFilter === "all" || app.status === statusFilter;
    
    // Then apply search filter
    const searchMatch = searchTerm === "" || 
      app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  const stats = {
    totalApplications: applications.length, // Total from all fetched applications
    draft: applications.filter(app => app.status === "DRAFT").length,
    submitted: applications.filter(app => app.status === "SUBMITTED").length,
    underReview: applications.filter(app => app.status === "UNDER_REVIEW").length,
    accepted: applications.filter(app => app.status === "ACCEPTED").length,
    rejected: applications.filter(app => app.status === "REJECTED").length,
    averageScore: 0, // We'll need to add review scores later
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await ApiClient.updateApplicationStatus(applicationId, newStatus);
      toast.success(`Application status updated to ${newStatus}`);
      fetchApplications(); // Refresh the list
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update application status');
    }
  };

  // Modal handlers
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedApplication(null);
  };

  const handleModalStatusUpdate = async (applicationId: string, newStatus: string) => {
    await handleStatusUpdate(applicationId, newStatus);
    // The modal will close automatically from the ApplicationReviewModal component
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DRAFT":
        return <Clock className="h-4 w-4 text-gray-500" />;
      case "SUBMITTED":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "UNDER_REVIEW":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "UNDER_REVIEW":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "ACCEPTED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage all hackathon applications
        </p>
        {user && (
          <div className="mt-2 text-sm text-muted-foreground">
            Welcome back, <span className="font-medium">{user.name}</span> ({user.role})
            <div className="mt-1 text-xs text-green-600">
              ✨ Notification system is now active! You'll receive real-time updates for application status changes.
            </div>
          </div>
        )}
      </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-300">Total Applications</CardTitle>
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.totalApplications}</div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-orange-700 dark:text-orange-300">Under Review</CardTitle>
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.underReview}</div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Pending evaluation
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-300">Accepted</CardTitle>
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.accepted}</div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {stats.totalApplications > 0 ? ((stats.accepted / stats.totalApplications) * 100).toFixed(1) : 0}% acceptance rate
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-purple-700 dark:text-purple-300">Average Score</CardTitle>
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.averageScore.toFixed(1)}/10</div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Across reviewed applications
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 shadow-md border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by project, name, or email..."
                  className="pl-10 h-11 shadow-sm border-muted focus:border-primary transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
                          <Select onValueChange={setStatusFilter} value={statusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="ACCEPTED">Accepted</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
              <Button 
                variant="outline"
                onClick={refreshApplications}
                disabled={refreshing}
                className="h-11 px-6 shadow-sm hover:shadow-md transition-all border-muted hover:border-primary"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Applications Table */}
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  All Applications
                </CardTitle>
                <CardDescription className="mt-1">
                  Review, score, and manage submitted applications
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{filteredApplications.length}</div>
                <div className="text-sm text-muted-foreground">Total Results</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  <div className="absolute inset-0 h-16 w-16 animate-ping border-2 border-primary rounded-full opacity-20"></div>
                </div>
                <span className="mt-6 text-muted-foreground text-xl">Loading applications...</span>
                <span className="mt-2 text-sm text-muted-foreground">Please wait while we fetch the data</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
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
            ) : filteredApplications.length > 0 ? (
              <div className="overflow-x-auto border border-border/40 rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/15 hover:bg-muted/25 border-b border-border/40">
                      <TableHead className="font-semibold text-foreground py-4 px-4 border-r border-border/20 min-w-[250px]">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Project Details
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground py-4 px-4 border-r border-border/20 min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Applicant
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground py-4 px-4 text-center border-r border-border/20 min-w-[100px]">Team Size</TableHead>
                      <TableHead className="font-semibold text-foreground py-4 px-4 border-r border-border/20 min-w-[200px]">Status & Actions</TableHead>
                      <TableHead className="font-semibold text-foreground py-4 px-4 text-center border-r border-border/20 min-w-[100px]">
                        <div className="flex items-center justify-center gap-2">
                          <Star className="h-4 w-4" />
                          Score
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground py-4 px-4 border-r border-border/20 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Submitted
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground py-4 px-4 text-center min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application, index) => (
                    <TableRow 
                      key={application.id} 
                      className={`group hover:bg-muted/10 transition-all duration-200 border-b border-border/20 ${
                        index % 2 === 0 ? 'bg-background' : 'bg-muted/5'
                      }`}
                    >
                      <TableCell className="py-4 px-4 border-r border-border/15">
                        <div className="space-y-3 max-w-[240px]">
                          <div>
                            <div className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                              {application.title}
                            </div>
                            <div className="text-sm text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                              {application.description}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {application.techStack.slice(0, 3).map((tech) => (
                              <Badge 
                                key={tech} 
                                variant="secondary" 
                                className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors px-2 py-0.5"
                              >
                                {tech}
                              </Badge>
                            ))}
                            {application.techStack.length > 3 && (
                              <Badge variant="outline" className="text-xs bg-muted/50 px-2 py-0.5">
                                +{application.techStack.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 border-r border-border/15">
                        <div className="space-y-1">
                          <div className="font-medium text-foreground">{application.user?.name || 'Unknown User'}</div>
                          <div className="text-sm text-muted-foreground truncate">{application.user?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center border-r border-border/15">
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-muted/40 rounded-full text-sm">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{application.teamSize}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 border-r border-border/15">
                        <div className="space-y-2">
                          <Badge className={`${getStatusColor(application.status)} shadow-sm text-xs`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(application.status)}
                              {application.status.replace("_", " ")}
                            </span>
                          </Badge>
                          <Select onValueChange={(value) => handleStatusUpdate(application.id, value)}>
                            <SelectTrigger className="w-full h-8 text-xs border-dashed border-border/50 hover:border-solid hover:border-primary/50 transition-all">
                              <SelectValue placeholder="Update" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DRAFT">📝 Draft</SelectItem>
                              <SelectItem value="SUBMITTED">📄 Submitted</SelectItem>
                              <SelectItem value="UNDER_REVIEW">🔍 Under Review</SelectItem>
                              <SelectItem value="ACCEPTED">✅ Accepted</SelectItem>
                              <SelectItem value="REJECTED">❌ Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center border-r border-border/15">
                        <div className="flex flex-col items-center gap-1">
                          <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center border border-dashed border-muted-foreground/30">
                            <Star className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-xs text-muted-foreground">Not scored</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 border-r border-border/15">
                        <div className="text-sm">
                          <div className="font-medium">
                            {application.submittedAt ? formatDate(application.submittedAt).split(',')[0] : formatDate(application.createdAt).split(',')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {application.submittedAt ? formatDate(application.submittedAt).split(',')[1] : formatDate(application.createdAt).split(',')[1]}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 px-4 text-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedApplication(application);
                            setIsModalOpen(true);
                          }}
                          className="hover:bg-primary hover:text-primary-foreground transition-all shadow-sm border-border/40 hover:border-primary text-xs px-3 py-1 h-8"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="relative inline-block mb-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <FileText className="h-16 w-16 text-primary" />
                  </div>
                  <div className="absolute inset-0 w-32 h-32 bg-primary/10 rounded-full animate-ping"></div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-foreground">
                  {applications.length === 0 ? 'No applications yet' : 'No applications match your search'}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto text-lg leading-relaxed">
                  {applications.length === 0 
                    ? 'Applications will appear here once participants start submitting their innovative projects. The excitement is building!'
                    : 'Try adjusting your search terms or filters to find what you&apos;re looking for.'
                  }
                </p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')}
                    className="shadow-md hover:shadow-lg transition-all"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Application Review Modal */}
        <ApplicationReviewModal
          application={selectedApplication}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onStatusUpdate={handleModalStatusUpdate}
        />
      </div>
  );
}
