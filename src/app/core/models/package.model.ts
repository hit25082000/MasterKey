import { Course } from './course.model';

export interface Package {
  id: string;
  courses: string[];
  name: string;
  price: number;
  description: string;
  workHours: number;
}
