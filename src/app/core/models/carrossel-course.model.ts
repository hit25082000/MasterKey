import { Entity } from "./entity";

export interface CarrosselCourse extends Entity {
  name: string;
  description: string;
  hidePrice: boolean;
  promotion: boolean;
  courses: string;
}
