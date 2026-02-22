export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  jobCount: number;
  createdAt: Date;
  updatedAt: Date;
}
