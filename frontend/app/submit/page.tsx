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
import { Plus, X, FileText, Users, Code, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApiClient } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

export default function SubmitPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <SubmitContent />
      </div>
    </ProtectedRoute>
  );
}

function SubmitContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Redirect admin users to admin panel - they shouldn't access participant features
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      router.replace('/admin');
      return;
    }
  }, [user, router]);

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
    }
  };

  const removeTeamMember = (index: number) => {
    const minMembers = getMinTeamMembers();
    if (formData.teamMembers.length > minMembers && index > 0) {
      setFormData(prev => ({
        ...prev,
        teamMembers: prev.teamMembers.filter((_, i) => i !== index)
      }));
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
  };

  const updateTeamMember = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member, i) => 
        i === index ? value : member
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    
    // Basic validation - only require for final submission, not drafts
    if (!isDraft) {
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

      const minMembers = getMinTeamMembers();
      const filledMembers = formData.teamMembers.filter(member => member.trim());
      
      if (filledMembers.length < minMembers) {
        const teamSizeText = parseInt(formData.teamSize) === 5 ? "at least 5" : formData.teamSize;
        toast.error(`Please add ${teamSizeText} team members`);
        return;
      }

      if (formData.teamMembers.some(member => member && !member.trim())) {
        toast.error("Please fill in all team member names or remove empty fields");
        return;
      }
    } else {
      // For drafts, only require a title
      if (!formData.title.trim()) {
        toast.error("Please enter a project title to save as draft");
        return;
      }
    }

    setLoading(true);

    try {
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

      // Validate URLs if provided
      if (submissionData.githubRepo && !isValidUrl(submissionData.githubRepo)) {
        toast.error("Please enter a valid GitHub repository URL");
        return;
      }

      if (submissionData.demoUrl && !isValidUrl(submissionData.demoUrl)) {
        toast.error("Please enter a valid demo URL");
        return;
      }

      const application = await ApiClient.createApplication(submissionData);
      
      if (isDraft) {
        toast.success("Draft saved successfully! You can continue editing later.");
      } else {
        toast.success("Application submitted successfully! Good luck with your project!");
      }
      
      // Redirect to dashboard or application detail page
      router.push(`/applications/${application.id}`);
      
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast.error(error instanceof Error ? error.message : "Failed to submit application. Please try again.");
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Submit Your Idea</h1>
          <p className="text-muted-foreground mt-2">
            Share your innovative AI project with the community
          </p>
        </div>

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
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={index === 0 ? "Your name (team leader)" : `Team member ${index + 1} name`}
                        value={member}
                        onChange={(e) => updateTeamMember(index, e.target.value)}
                      />
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
                  ))}
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
      </div>
    </div>
  );
}
