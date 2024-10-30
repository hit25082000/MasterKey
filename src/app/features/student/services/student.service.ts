import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Student } from '../../../core/models/student.model';
import { collection, collectionData, CollectionReference, Firestore } from '@angular/fire/firestore';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Package } from '../../../core/models/package.model';
import { Course } from '../../../core/models/course.model';
import { firstValueFrom } from 'rxjs';

const USERS_PATH = 'users';
const STUDENT_COURSES_PATH = 'student_courses';
const STUDENT_PACKAGES_PATH = 'student_packages';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  firestore = inject(Firestore);
  firestoreS = inject(FirestoreService);

  studentsCollection = collection(
    this.firestore,
    USERS_PATH
  ) as CollectionReference<Student>;

  studentsCoursesCollection = collection(
    this.firestore,
    STUDENT_COURSES_PATH
  ) as CollectionReference<string>;

  studentsPackagesCollection = collection(
    this.firestore,
    STUDENT_PACKAGES_PATH
  ) as CollectionReference<string>;

  students = signal<Student[]>([])
  selectedStudent = signal<Student | undefined>(undefined);
  selectedStudentPackages = signal<string[]>([]);
  selectedStudentCourses = signal<string[]>([]);

  isLoading = signal<boolean>(true);

  constructor() {
    collectionData(this.studentsCollection, { idField: 'id' }).subscribe(
      (data) => {
        const studentData = data.filter(user => user.role === 'student');
        this.students.set(studentData);
        this.isLoading.set(false);
      },
      (error) => {
        console.error("Erro ao buscar dados:", error);
        this.isLoading.set(false);
      }
    );
  }

  async selectStudent(id: string): Promise<WritableSignal<Student | undefined>> {
    while (this.isLoading()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const student = this.students().find(stu => stu.id === id);
    this.selectedStudent.set(undefined);
    this.selectedStudentPackages.set([]);
    this.selectedStudentCourses.set([]);

    if (student) {
      this.selectedStudent.set(student);

      var courses: string[] = []
      var packages: string[] = []

        courses = await this.getCourses(student.id);
        this.selectedStudentCourses.set(courses);

        packages = await this.getPackages(student.id);
        this.selectedStudentPackages.set(packages);
    }

    return this.selectedStudent;
  }

  private async getPackages(studentId: string): Promise<string[]> {
    if (!studentId) return [];

    try {
      const packageDoc = await this.firestoreS.getDocument(
        STUDENT_PACKAGES_PATH,
        studentId
      );

      return packageDoc?.packages || [];
    } catch (error) {
      console.error('Erro ao buscar pacotes:', error);
      return [];
    }
  }

  private async getCourses(studentId: string): Promise<string[]> {
    if (!studentId) return [];

    try {
      const courseDoc = await this.firestoreS.getDocument(
        STUDENT_COURSES_PATH,
        studentId
      );

      return courseDoc?.courses || [];
    } catch (error) {
      console.error('Erro ao buscar cursos:', error);
      return [];
    }
  }
}
