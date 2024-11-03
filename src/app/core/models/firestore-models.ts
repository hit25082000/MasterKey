import { Timestamp } from "@angular/fire/firestore";
import { CourseReview } from "./course.model";

export interface FirestoreStudentPackages {
  [packageId: string]: boolean;
}

export interface FirestoreCategorys {
  courses: string[],
  image: string,
  name: string,
  packages: string[]
}

export interface FirestoreClasses {
  dayWeek: string[],
  finishDate: string,
  id: string,
  name: string[],
  room: string[],
  startDate: Timestamp,
  status: boolean,
  students: string[],
  teacher: string,
  time: string
}

export interface FirestoreCourseReviews {
  reviews: CourseReview[],
}


