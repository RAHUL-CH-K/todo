export type Priority = 'low' | 'medium' | 'high';

export type FilterStatus = 'all' | 'active' | 'completed';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  due_date: string | null;
  completed: boolean;
  created_at: string;
}
