"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Users, FileText, Clock, CheckCircle, XCircle, Search, Calendar, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { ApiClient } from "@/lib/api";
import { toast } from "sonner";

// Define the Application interface locally to match API response
interface Application {
  id: string;
  title: string;
  description: string;
  problemStatement: string;
  solution: string;
  techStack: string[];
  teamSize: number;
  teamMembers: string[];
  githubRepo?: string;
  demoUrl?: string;
  status: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function ApplicationsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <ApplicationsContent />
      </div>
    </ProtectedRoute>
  );
}

function ApplicationsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Redirect admin users to admin panel - they shouldn't access participant features
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      router.replace('/admin');
      return;
    }
  }, [user, router]);

  // Fetch user's applications
  useEffect(() => {
    const fetchApplications = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const data = await ApiClient.getUserApplications();
        setApplications(data.applications || []);
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        toast.error('Failed to load applications. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  // Filter applications based on search term and active tab
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = activeTab === "all" || app.status === activeTab;
    return matchesSearch && matchesStatus;
  });

  // Handle dropdown change - sync with tabs
  const handleStatusFilterChange = (status: string) => {
    setActiveTab(status);
  };

  // Handle tab change - sync with dropdown
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "UNDER_REVIEW":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "ACCEPTED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "DRAFT":
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "UNDER_REVIEW":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
      case "ACCEPTED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Not submitted";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const ApplicationCard = ({ application }: { application: Application }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{application.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {application.description}
            </CardDescription>
          </div>
          <Badge className={getStatusColor(application.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(application.status)}
              {application.status.replace("_", " ")}
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {application.teamSize} members
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(application.submittedAt)}
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {application.techStack.slice(0, 3).map((tech: string) => (
            <Badge key={tech} variant="outline" className="text-xs">
              {tech}
            </Badge>
          ))}
          {application.techStack.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{application.techStack.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/applications/${application.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              View Details
            </Link>
          </Button>
          {application.status === "DRAFT" && (
            <Button size="sm" asChild>
              <Link href={`/applications/${application.id}/edit`}>
                Edit & Submit
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Applications</h1>
            <p className="text-muted-foreground mt-2">
              Track and manage your hackathon submissions
            </p>
          </div>
          <Button asChild>
            <Link href="/submit">
              <FileText className="mr-2 h-4 w-4" />
              New Application
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={activeTab} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Applications</SelectItem>
              <SelectItem value="DRAFT">Drafts</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="ACCEPTED">Accepted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Applications Tabs */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading applications...</span>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
              <TabsTrigger value="DRAFT">
                Drafts ({applications.filter(app => app.status === "DRAFT").length})
              </TabsTrigger>
              <TabsTrigger value="SUBMITTED">
                Submitted ({applications.filter(app => app.status === "SUBMITTED").length})
              </TabsTrigger>
              <TabsTrigger value="UNDER_REVIEW">
                Under Review ({applications.filter(app => app.status === "UNDER_REVIEW").length})
              </TabsTrigger>
              <TabsTrigger value="ACCEPTED">
                Accepted ({applications.filter(app => app.status === "ACCEPTED").length})
              </TabsTrigger>
              <TabsTrigger value="REJECTED">
                Rejected ({applications.filter(app => app.status === "REJECTED").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredApplications.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredApplications.map((application: Application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No applications found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || activeTab !== "all" 
                      ? "Try adjusting your search or filters"
                      : "Get started by submitting your first hackathon idea"
                    }
                  </p>
                  {!searchTerm && activeTab === "all" && (
                    <Button asChild>
                      <Link href="/submit">
                        Create Your First Application
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="DRAFT" className="space-y-4">
              {filteredApplications.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredApplications.map((application: Application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No draft applications found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? "No draft applications match your search"
                      : "You don't have any draft applications yet."
                    }
                  </p>
                  {!searchTerm && (
                    <Button asChild>
                      <Link href="/submit">
                        Create New Application
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="SUBMITTED" className="space-y-4">
              {filteredApplications.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredApplications.map((application: Application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No submitted applications found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? "No submitted applications match your search"
                      : "You haven't submitted any applications yet."
                    }
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="UNDER_REVIEW" className="space-y-4">
              {filteredApplications.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredApplications.map((application: Application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No applications under review found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? "No applications under review match your search"
                      : "You don't have any applications currently under review."
                    }
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ACCEPTED" className="space-y-4">
              {filteredApplications.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredApplications.map((application: Application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No accepted applications found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? "No accepted applications match your search"
                      : "You don't have any accepted applications yet."
                    }
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="REJECTED" className="space-y-4">
              {filteredApplications.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredApplications.map((application: Application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No rejected applications found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm 
                      ? "No rejected applications match your search"
                      : "You don't have any rejected applications."
                    }
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
