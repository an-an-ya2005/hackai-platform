export class ApplicationResponseDto {
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
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;

  constructor(application: any) {
    this.id = application.id;
    this.title = application.title;
    this.description = application.description;
    this.problemStatement = application.problemStatement;
    this.solution = application.solution;
    this.techStack = application.techStack;
    this.teamSize = application.teamSize;
    this.teamMembers = application.teamMembers;
    this.githubRepo = application.githubRepo;
    this.demoUrl = application.demoUrl;
    this.status = application.status;
    this.submittedAt = application.submittedAt;
    this.createdAt = application.createdAt;
    this.updatedAt = application.updatedAt;
    this.user = application.user ? {
      id: application.user.id,
      name: application.user.name,
      email: application.user.email,
    } : null;
  }
}
