export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  storagePath: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
}

export type Priority = 'none' | 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'active' | 'completed' | 'archived';
export type Recurrence = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  scheduledDate?: string; // YYYY-MM-DD
  dueAt?: string; // ISO string
  reminderAt?: string; // ISO string
  recurrence?: Recurrence;
  categoryId?: string;
  categoryName?: string;
  labels: string[];
  priority: Priority;
  attachments: Attachment[];
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  archivedAt?: string;
}
