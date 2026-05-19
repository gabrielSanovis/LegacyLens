export interface Project {
  id: string;
  name: string;
  repoUrl: string | null;
  status: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  name: string;
  repoUrl?: string;
}
