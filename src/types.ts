export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  categoryId?: string;
}