"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Calendar, 
  Globe, 
  Github, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  User,
  Mail,
  Code,
  Target,
  Lightbulb
} from "lucide-react";
import { Application } from "@/lib/api";
import { toast } from "sonner";

interface ApplicationReviewModalProps {
  application: Application | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (applicationId: string, newStatus: string) => Promise<void>;
}

export function ApplicationReviewModal({ 
  application, 
  isOpen, 
  onClose, 
  onStatusUpdate 
}: ApplicationReviewModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!application) return null;

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      await onStatusUpdate(application.id, newStatus);
      toast.success(`Application status updated to ${newStatus}`);
      onClose();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update application status');
    } finally {
      setIsUpdating(false);
    }
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
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold text-foreground pr-8">
                {application.title}
              </DialogTitle>
              <DialogDescription className="mt-2 text-muted-foreground">
                Review and manage this hackathon application
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(application.status)} shadow-sm`}>
                <span className="flex items-center gap-1">
                  {getStatusIcon(application.status)}
                  {application.status.replace("_", " ")}
                </span>
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-6">
            {/* Applicant Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Applicant Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{application.user?.name || 'Unknown User'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{application.user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Team Size: <span className="font-medium">{application.teamSize}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Submitted: {application.submittedAt ? formatDate(application.submittedAt) : formatDate(application.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Project Description */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Project Description
              </h3>
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-foreground leading-relaxed">{application.description}</p>
              </div>
            </div>

            {/* Problem Statement */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Problem Statement
              </h3>
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-foreground leading-relaxed">{application.problemStatement}</p>
              </div>
            </div>

            {/* Solution */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Solution
              </h3>
              <div className="p-4 bg-muted/20 rounded-lg">
                <p className="text-foreground leading-relaxed">{application.solution}</p>
              </div>
            </div>

            {/* Technology Stack */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Technology Stack
              </h3>
              <div className="flex flex-wrap gap-2">
                {application.techStack.map((tech, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Team Members */}
            {application.teamMembers && application.teamMembers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Team Members
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {application.teamMembers.map((member, index) => (
                    <div key={index} className="p-3 bg-muted/20 rounded-lg">
                      <span className="text-foreground">{member}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links */}
            {(application.githubRepo || application.demoUrl) && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ExternalLink className="h-5 w-5 text-primary" />
                  Project Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {application.githubRepo && (
                    <a 
                      href={application.githubRepo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <Github className="h-4 w-4" />
                      <span className="text-sm">GitHub Repository</span>
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                  {application.demoUrl && (
                    <a 
                      href={application.demoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-muted/20 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      <span className="text-sm">Live Demo</span>
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="p-6 pt-0">
          <Separator className="mb-4" />
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Update Status
              </label>
              <Select onValueChange={handleStatusUpdate} disabled={isUpdating}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select new status" />
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
            
            <div className="flex gap-2 sm:items-end">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={isUpdating}
                className="flex-1 sm:flex-none"
              >
                Close
              </Button>
              <Button 
                onClick={() => handleStatusUpdate("ACCEPTED")}
                disabled={isUpdating || application.status === "ACCEPTED"}
                className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept
              </Button>
              <Button 
                variant="destructive"
                onClick={() => handleStatusUpdate("REJECTED")}
                disabled={isUpdating || application.status === "REJECTED"}
                className="flex-1 sm:flex-none"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
