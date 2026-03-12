"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, FileText, Users, Code, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { ApiClient, Application } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";

export function EditApplicationContent({ applicationId }: { applicationId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);

  // Redirect admin users to admin panel - they shouldn't access participant features
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      router.replace('/admin');
      return;
    }
  }, [user, router]);

  const [teamMemberErrors, setTeamMemberErrors] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problemStatement: "",
    solution: "",
    techStack: [] as string[],
    teamSize: "",
    teamMembers: [""],
    githubRepo: "",
    demoUrl: ""
  });

  const [newTech, setNewTech] = useState("");

  // Fetch application data on mount
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setInitialLoading(true);
        const app = await ApiClient.getApplication(applicationId);
        
        // Check if user owns this application
        if (app.user?.id !== user?.id) {
          toast.error("You don't have permission to edit this application");
          router.push('/applications');
          return;
        }

        // Check if application is editable (only DRAFT status)
        if (app.status !== 'DRAFT') {
          toast.error("Only draft applications can be edited");
          router.push(`/applications/${applicationId}`);
          return;
        }

        setApplication(app);
        
        console.log('Fetched application data:', app);
        
        // Pre-fill form with existing data
        const newFormData = {
          title: app.title || "",
          description: app.description || "",
          problemStatement: app.problemStatement || "",
          solution: app.solution || "",
          techStack: app.techStack || [],
          teamSize: app.teamSize ? app.teamSize.toString() : "",
          teamMembers: app.teamMembers && app.teamMembers.length > 0 ? app.teamMembers : [""],
          githubRepo: app.githubRepo || "",
          demoUrl: app.demoUrl || ""
        };
        
        console.log('Setting form data:', newFormData);
        setFormData(newFormData);
      } catch (error) {
        console.error('Failed to fetch application:', error);
        toast.error("Failed to load application data");
        router.push('/applications');
      } finally {
        setInitialLoading(false);
      }
    };

    if (applicationId && user) {
      fetchApplication();
    }
  }, [applicationId, user, router]);

  // Debug effect to log form data changes
  useEffect(() => {
    console.log('Form data updated:', formData);
  }, [formData]);

  const addTechStack = () => {
    if (newTech.trim() && !formData.techStack.includes(newTech.trim())) {
      setFormData(prev => ({
        ...prev,
        techStack: [...prev.techStack, newTech.trim()]
      }));
      setNewTech("");
    }
  };

  const removeTechStack = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      techStack: prev.techStack.filter(t => t !== tech)
    }));
  };

  const addTeamMember = () => {
    const maxMembers = getMaxTeamMembers();
    if (formData.teamMembers.length < maxMembers) {
      setFormData(prev => ({
        ...prev,
        teamMembers: [...prev.teamMembers, ""]
      }));
      
      // Add empty error for new member
      setTeamMemberErrors(prev => [...prev, ""]);
    }
  };

  const removeTeamMember = (index: number) => {
    const minMembers = getMinTeamMembers();
    if (formData.teamMembers.length > minMembers && index > 0) {
      setFormData(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.filter((_, i) => i !== index)
      }));
      
      // Remove corresponding error
      setTeamMemberErrors(prev => prev.filter((_, i) => i !== index));
    }
  };

  const getMinTeamMembers = () => {
    const teamSize = parseInt(formData.teamSize) || 1;
    return teamSize === 5 ? 5 : teamSize; // 5+ means minimum 5, others are exact
  };

  const getMaxTeamMembers = () => {
    const teamSize = parseInt(formData.teamSize) || 1;
    return teamSize === 5 ? 20 : teamSize; // 5+ allows up to 20 members, others are exact
  };

  const canAddMoreMembers = () => {
    return formData.teamMembers.length < getMaxTeamMembers();
  };

  const canRemoveMembers = () => {
    return formData.teamMembers.length > getMinTeamMembers() && formData.teamMembers.length > 1;
  };

  // Adjust team members when team size changes
  const handleTeamSizeChange = (value: string) => {
    const newTeamSize = parseInt(value) || 1;
    const minMembers = newTeamSize === 5 ? 5 : newTeamSize;
    
    setFormData(prev => {
      const currentMembers = prev.teamMembers.length;
      let newTeamMembers = [...prev.teamMembers];
      
      // If new team size requires more members, add empty slots
      if (currentMembers < minMembers) {
        const membersToAdd = minMembers - currentMembers;
        newTeamMembers = [...newTeamMembers, ...Array(membersToAdd).fill("")];
      }
      // If new team size requires fewer members, remove excess members
      else if (currentMembers > newTeamSize && newTeamSize !== 5) {
        newTeamMembers = newTeamMembers.slice(0, newTeamSize);
      }
      
      return {
        ...prev,
        teamSize: value,
        teamMembers: newTeamMembers
      };
    });

    // Reset error state to match new team member count
    setTeamMemberErrors(prev => {
      const newErrors = [...prev];
      const newTeamSize = parseInt(value) || 1;
      const minMembers = newTeamSize === 5 ? 5 : newTeamSize;
      
      // Adjust errors array length to match team members
      if (prev.length < minMembers) {
        // Add empty errors for new members
        const errorsToAdd = minMembers - prev.length;
        return [...newErrors, ...Array(errorsToAdd).fill("")];
      } else if (prev.length > newTeamSize && newTeamSize !== 5) {
        // Remove excess errors
        return newErrors.slice(0, newTeamSize);
      }
      
      return newErrors;
    });
  };

  const validateTeamMemberName = (name: string): string | null => {
    if (!name.trim()) {
      return null; // Empty is handled separately
    }
    
    if (name.trim().length < 2) {
      return "Name must be at least 2 characters long";
    }
    
    if (name.trim().length > 50) {
      return "Name must not exceed 50 characters";
    }
    
    const namePattern = /^[a-zA-Z\s\-']{2,50}$/;
    if (!namePattern.test(name.trim())) {
      return "Name can only contain letters, spaces, hyphens, and apostrophes";
    }
    
    return null;
  };

  const checkForDuplicateNames = (): boolean => {
    const filledNames = formData.teamMembers
      .map(member => member.trim().toLowerCase())
      .filter(name => name);
    
    const duplicates = filledNames.filter((name, index) => filledNames.indexOf(name) !== index);
    return duplicates.length > 0;
  };

  const updateTeamMember = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => 
        i === index ? value : member
      )
    }));

    // Validate the specific team member name
    const newErrors = [...teamMemberErrors];
    const error = validateTeamMemberName(value);
    newErrors[index] = error || '';
    setTeamMemberErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    
    console.log('Form submission started, isDraft:', isDraft);
    console.log('Current form data:', formData);
    
    // Basic validation - only require for final submission, not drafts
    if (!isDraft) {
      console.log('Performing full validation for submission');
      
      if (!formData.title.trim()) {
        toast.error("Please enter a project title");
        return;
      }
      
      if (!formData.description.trim()) {
        toast.error("Please enter a project description");
        return;
      }

      if (!formData.problemStatement.trim()) {
        toast.error("Please enter a problem statement");
        return;
      }

      if (!formData.solution.trim()) {
        toast.error("Please enter your proposed solution");
        return;
      }

      if (!formData.teamSize) {
        toast.error("Please select team size");
        return;
      }

      // Validate team members
      if (formData.teamSize) {
        const minMembers = getMinTeamMembers();
        const maxMembers = getMaxTeamMembers();
        const filledMembers = formData.teamMembers.filter(member => member.trim());
        const currentMembers = filledMembers.length;
        
        // Check if minimum team members requirement is met
        if (currentMembers < minMembers) {
          toast.error(`Please add at least ${minMembers} team member${minMembers > 1 ? 's' : ''}`);
          return;
        }
        
        // Check if maximum team members limit is exceeded
        if (currentMembers > maxMembers) {
          toast.error(`Maximum ${maxMembers} team members allowed for this team size`);
          return;
        }

        // Check for empty team member names
        if (formData.teamMembers.some(member => !member.trim())) {
          toast.error("Please fill in all team member names or remove empty entries");
          return;
        }

        // Validate team member names (minimum 2 characters, no special characters except spaces, hyphens, and apostrophes)
        const namePattern = /^[a-zA-Z\s\-']{2,50}$/;
        const invalidMembers = filledMembers.filter(member => !namePattern.test(member.trim()));
        if (invalidMembers.length > 0) {
          toast.error("Team member names must be 2-50 characters long and contain only letters, spaces, hyphens, and apostrophes");
          return;
        }

        // Check for duplicate names (case-insensitive)
        const memberNames = filledMembers.map(member => member.trim().toLowerCase());
        const duplicates = memberNames.filter((name, index) => memberNames.indexOf(name) !== index);
        if (duplicates.length > 0) {
          toast.error("Team member names must be unique. Please remove duplicate entries");
          return;
        }

        // Ensure team leader (first member) is filled
        if (!formData.teamMembers[0]?.trim()) {
          toast.error("Team leader name (first member) is required");
          return;
        }
      }
      
      console.log('All validations passed for submission');
    } else {
      console.log('Performing draft validation (title only)');
      // For drafts, only require a title
      if (!formData.title.trim()) {
        toast.error("Please enter a project title to save as draft");
        return;
      }
      console.log('Draft validation passed');
    }

    console.log('Starting API call...');
    setLoading(true);

    try {
      console.log('Starting submission with isDraft:', isDraft);
      
      // Prepare data for submission
      const submissionData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        problemStatement: formData.problemStatement.trim() || undefined,
        solution: formData.solution.trim() || undefined,
        techStack: formData.techStack,
        teamSize: formData.teamSize ? parseInt(formData.teamSize) : undefined,
        teamMembers: formData.teamMembers.filter(member => member.trim()),
        githubRepo: formData.githubRepo.trim() || undefined,
        demoUrl: formData.demoUrl.trim() || undefined,
        status: isDraft ? 'DRAFT' : 'SUBMITTED',
      };

      console.log('Submission data:', submissionData);

      // Validate URLs if provided
      if (submissionData.githubRepo && !isValidUrl(submissionData.githubRepo)) {
        toast.error("Please enter a valid GitHub repository URL");
        return;
      }

      if (submissionData.demoUrl && !isValidUrl(submissionData.demoUrl)) {
        toast.error("Please enter a valid demo URL");
        return;
      }

      const updatedApplication = await ApiClient.updateApplication(applicationId, submissionData);
      
      console.log('Application updated successfully:', updatedApplication);
      
      if (isDraft) {
        console.log('Showing draft success toast');
        toast.success("Draft updated successfully!");
      } else {
        console.log('Showing submission success toast');
        toast.success("Application submitted successfully! Good luck with your project!");
      }
      
      // Add a small delay to ensure toast is visible before redirect
      setTimeout(() => {
        router.push(`/applications/${updatedApplication.id}`);
      }, 1500); // 1.5 second delay
      
    } catch (error) {
      console.error('Failed to update application:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  if (initialLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center min-h-[400px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!application) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <Navigation />
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Application Not Found</h1>
              <p className="text-muted-foreground mt-2">
                The application you're trying to edit doesn't exist or you don't have permission to edit it.
              </p>
              <Button asChild className="mt-4">
                <Link href="/applications">Back to Applications</Link>
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/applications">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Applications
                </Link>
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Edit Application</h1>
            <p className="text-muted-foreground mt-2">
              Continue working on your AI project submission
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                <FileText className="h-3 w-3 mr-1" />
                Draft
              </Badge>
            </div>
          </div>

          {/* Only render form when application data is loaded */}
          {!initialLoading && application && (
            <>
              {console.log('Rendering form with formData:', formData)}
              <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle>Project Details</CardTitle>
                </div>
                <CardDescription>
                  Tell us about your AI project idea
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter your project title..."
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Project Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project in detail..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problem">Problem Statement</Label>
                  <Textarea
                    id="problem"
                    placeholder="What problem does your project solve?"
                    rows={3}
                    value={formData.problemStatement}
                    onChange={(e) => setFormData(prev => ({ ...prev, problemStatement: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="solution">Proposed Solution</Label>
                  <Textarea
                    id="solution"
                    placeholder="How does your project solve the problem?"
                    rows={3}
                    value={formData.solution}
                    onChange={(e) => setFormData(prev => ({ ...prev, solution: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  <CardTitle>Technical Details</CardTitle>
                </div>
                <CardDescription>
                  Specify the technologies and tools you'll use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tech Stack</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add technology (e.g., React, Python, TensorFlow)"
                      value={newTech}
                      onChange={(e) => setNewTech(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTechStack())}
                    />
                    <Button type="button" onClick={addTechStack}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.techStack.map((tech) => (
                        <Badge key={tech} variant="secondary" className="gap-1">
                          {tech}
                          <button
                            type="button"
                            onClick={() => removeTechStack(tech)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub Repository</Label>
                    <Input
                      id="github"
                      placeholder="https://github.com/username/repo"
                      value={formData.githubRepo}
                      onChange={(e) => setFormData(prev => ({ ...prev, githubRepo: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo">Demo URL</Label>
                    <Input
                      id="demo"
                      placeholder="https://your-demo-url.com"
                      value={formData.demoUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, demoUrl: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>Team Information</CardTitle>
                </div>
                <CardDescription>
                  Tell us about your team composition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size</Label>
                  <Select 
                    value={formData.teamSize} 
                    onValueChange={handleTeamSizeChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Solo (1 member)</SelectItem>
                      <SelectItem value="2">2 members</SelectItem>
                      <SelectItem value="3">3 members</SelectItem>
                      <SelectItem value="4">4 members</SelectItem>
                      <SelectItem value="5">5+ members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Team Members</Label>
                  {formData.teamSize && (
                    <p className="text-sm text-muted-foreground">
                      {parseInt(formData.teamSize) === 5 
                        ? `Add at least 5 team members (you can add more if needed)`
                        : `Add exactly ${formData.teamSize} team member${parseInt(formData.teamSize) > 1 ? 's' : ''}`
                      }
                    </p>
                  )}
                  <div className="space-y-2">
                    {formData.teamMembers.map((member, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              placeholder={index === 0 ? "Your name (team leader)" : `Team member ${index + 1} name`}
                              value={member}
                              onChange={(e) => updateTeamMember(index, e.target.value)}
                              className={teamMemberErrors[index] ? "border-red-500 focus:border-red-500" : ""}
                            />
                            {teamMemberErrors[index] && (
                              <p className="text-sm text-red-500 mt-1">{teamMemberErrors[index]}</p>
                            )}
                          </div>
                          {index > 0 && canRemoveMembers() && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => removeTeamMember(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Duplicate name warning */}
                    {checkForDuplicateNames() && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                        <p className="text-sm text-yellow-800">
                          ⚠️ Duplicate team member names detected. Please ensure all names are unique.
                        </p>
                      </div>
                    )}
                    
                    {canAddMoreMembers() && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTeamMember}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Team Member
                        {parseInt(formData.teamSize) === 5 && (
                          <span className="ml-1 text-xs">
                            ({formData.teamMembers.length}/∞)
                          </span>
                        )}
                        {parseInt(formData.teamSize) !== 5 && formData.teamSize && (
                          <span className="ml-1 text-xs">
                            ({formData.teamMembers.length}/{formData.teamSize})
                          </span>
                        )}
                      </Button>
                    )}
                    {!canAddMoreMembers() && parseInt(formData.teamSize) !== 5 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Maximum team members reached for selected team size
                      </p>
                    )}
                    
                    {/* Team member requirements info */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Team Member Requirements:</strong>
                      </p>
                      <ul className="text-sm text-blue-700 mt-1 ml-4 list-disc">
                        <li>Names must be 2-50 characters long</li>
                        <li>Only letters, spaces, hyphens (-), and apostrophes (') allowed</li>
                        <li>All team member names must be unique</li>
                        <li>Team leader name (first entry) is required</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save as Draft
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Application
              </Button>
            </div>
          </form>
          </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
