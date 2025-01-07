import BaseUser from "./base-user.model";
import { Student } from './student.model';

export interface Class {
  id?: string;
  name: string;
  time: string;
  daysWeek: string[];
  startDate: string;
  finishDate: string;
  status: boolean;
  room: string;
  teacher: string;
  studentIds: string[];
  students: { [id: string]: Student };
}

export interface ClassAttendance {
  classId: string;
  date: string;
  studentAttendance: {
    studentId: string;
    present: boolean;
  }[];
}
