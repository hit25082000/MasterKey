import { inject, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { Student } from '../../../core/models/student.model';
import { collection, collectionData, CollectionReference, Firestore } from '@angular/fire/firestore';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Package } from '../../../core/models/package.model';
import { Course } from '../../../core/models/course.model';
import { firstValueFrom } from 'rxjs';
import { NotificationService } from '../../../shared/services/notification.service';
import { Observable, map } from 'rxjs';
import { StudentExam } from '../../../core/models/exam.model';

const USERS_PATH = 'users';
const STUDENT_COURSES_PATH = 'student_courses';
const STUDENT_PACKAGES_PATH = 'student_packages';
const STUDENT_PROGRESS_PATH = 'student_progress';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  firestore = inject(Firestore);
  firestoreS = inject(FirestoreService);
  notificationService = inject(NotificationService);

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

  getStudentEmail(userId: string): string | null {
    const student = this.students().find(stu => stu.id === userId);
    return student?.email || null;
  }

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

  async getCourses(studentId: string): Promise<string[]> {
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

  async getWatchedVideos(studentId: string, courseId: string): Promise<string[]> {
    try {
      const progressId = `${courseId}_${studentId}`;
      const progress = await this.firestoreS.getDocument(STUDENT_PROGRESS_PATH, progressId);
      return progress?.watchedVideos || [];
    } catch (error) {
      console.error('Erro ao buscar vídeos assistidos:', error);
      return [];
    }
  }

  async saveVideoProgress(studentId: string, courseId: string, videoId: string): Promise<void> {
    try {
      const progressId = `${courseId}_${studentId}`;

      // Primeiro, verifica se o documento existe
      const existingProgress = await this.firestoreS.getDocument(STUDENT_PROGRESS_PATH, progressId);

      if (!existingProgress) {
        // Se não existe, cria o documento com o array inicial
        await this.firestoreS.addToCollectionWithId(STUDENT_PROGRESS_PATH, progressId, {
          watchedVideos: [videoId]
        });
      } else {
        // Se já existe, atualiza o array
        await this.firestoreS.updateArrayField(
          STUDENT_PROGRESS_PATH,
          progressId,
          'watchedVideos',
          videoId
        );
      }
    } catch (error) {
      console.error('Erro ao salvar progresso do vídeo:', error);
      throw error;
    }
  }

  async removeVideoProgress(studentId: string, courseId: string, videoId: string): Promise<void> {
    try {
      const progressId = `${courseId}_${studentId}`;
      const watchedVideos = await this.getWatchedVideos(studentId, courseId);
      const updatedVideos = watchedVideos.filter(id => id !== videoId);

      // Usa addToCollectionWithId ao invés de setDocument
      await this.firestoreS.addToCollectionWithId(
        STUDENT_PROGRESS_PATH,
        progressId,
        {
          watchedVideos: updatedVideos
        }
      );
    } catch (error) {
      console.error('Erro ao remover progresso do vídeo:', error);
      throw error;
    }
  }

  async getCourseProgress(studentId: string, courseId: string): Promise<number> {
    try {
      const watchedVideos = await this.getWatchedVideos(studentId, courseId);
      const course = await this.firestoreS.getDocument<Course>('courses', courseId);

      if (!course?.videos || course.videos.length === 0) {
        return 0;
      }

      return (watchedVideos.length / course.videos.length) * 100;
    } catch (error) {
      console.error('Erro ao calcular progresso do curso:', error);
      return 0;
    }
  }

  async isVideoWatched(studentId: string, courseId: string, videoId: string): Promise<boolean> {
    const watchedVideos = await this.getWatchedVideos(studentId, courseId);
    return watchedVideos.includes(videoId);
  }

  async getStudentExams(studentId: string, courseId: string): Promise<StudentExam[]> {
    try {
      // Busca os registros de exames do estudante para o curso específico
      return await this.firestoreS.getDocumentsByAttribute(
        'student_exams',
        'studentId',
        studentId
      );    
    } catch (error) {
      console.error('Erro ao buscar exames do estudante:', error);
      throw error;
    }
  }
}
