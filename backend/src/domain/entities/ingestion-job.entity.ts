export interface IngestionJob {
  id: string;
  projectId: string;
  status: string;
  stats: Record<string, unknown> | null;
  startedAt: Date | null;
  finishedAt: Date | null;
  error: string | null;
  createdAt: Date;
}
