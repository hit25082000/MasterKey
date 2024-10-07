import BaseUser from "./base-user.model";
import { Course } from "./course.model";

export interface Teacher extends BaseUser {
  courses?: Course[];
}
