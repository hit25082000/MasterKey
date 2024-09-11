import { Course } from './course.model';

export interface Package {
  id: string,
  courses : Course[],
  name: string,
  price: number,
  description : string,
  status : string,
  workHours : number,
}
