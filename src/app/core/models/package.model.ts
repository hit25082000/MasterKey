import { Course } from './course.model';
import { Entity } from "./entity";

export interface Package extends Entity {
  courses: string[];
  name: string;
  price: number;
  description: string;
  workHours: number;
}
