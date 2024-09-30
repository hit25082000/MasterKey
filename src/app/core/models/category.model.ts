import { Course } from './course.model';

export interface Category {
  id: string;
  name: string;
  image: string;
  courses: string[];
  packages: string[];
}
