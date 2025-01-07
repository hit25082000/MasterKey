export interface Attendance {
  id?: string;
  classId: string;
  studentId: string;
  date: Date;
  present: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
