import { QuerySnapshot, Firestore } from '@angular/fire/firestore';
import { Student } from './../../../core/models/student.model';
import { Injectable, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { AdminService } from '../../../core/services/admin.service';
import { StudentService } from './student.service';
import { AuthService } from '../../../core/services/auth.service';
import { SystemLogService } from '../../../core/services/system-log.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../../../shared/services/notification.service';
import { addDoc, collection, updateDoc, where } from '@angular/fire/firestore';

const STUDENT_PROGRESS_PATH = 'student_progress';
const STUDENT_COURSES_PATH = 'student_courses';

@Injectable({
  providedIn: 'root',
})
export class StudentManagementService {
  private firestore = inject(Firestore);
  private firestoreService = inject(FirestoreService);
  private notificationService = inject(NotificationService);
  private studentService = inject(StudentService);

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private systemLog: SystemLogService
  ) {}

  async create(newStudent: Student, icon: File | null): Promise<string> {
    try {
      const iconBase64 = icon ? await this.fileToBase64(icon) : null;
      return new Promise((resolve, reject) => {
        this.adminService.createUser(newStudent, iconBase64).subscribe(
          (student) => {
            this.logSuccessfulRegistration(student);
            resolve('Estudante criado com sucesso!');
          },
          (response) => {
            reject(this.handleError(response.error));
          }
        );
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async update(newStudent: Student, icon?: File | null): Promise<string> {
    try {
      const iconBase64 = icon ? await this.fileToBase64(icon) : null;
      const oldStudent = await this.studentService.selectStudent(newStudent.id);

      if(oldStudent() === undefined)
        throw new Error('Estudante não encontrado')

      var logDetails = this.getDifferences(newStudent, oldStudent()!);

      return new Promise((resolve, reject) => {
        this.adminService.updateUser(newStudent, iconBase64).subscribe(
          () => {
            this.logSuccessfulUpdate(newStudent, logDetails);
            resolve('Estudante atualizado com sucesso!');
          },
          (response) => {
            reject(this.handleError(response.error));
          }
        );
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(userId: string): Promise<string> {
    try {
      const student = await this.studentService.selectStudent(userId);

      if(student() === undefined)
        throw new Error('Estudante não encontrado');

      // 1. Remover registros de progresso do estudante
      const progressDocs = await this.firestoreService.getDocumentsByQuery<any>('student_progress', 
        where('studentId', '==', userId));
      
      for (const progressDoc of progressDocs) {
        await this.firestoreService.deleteDocument('student_progress', progressDoc.id);
      }

      // 2. Remover registros de cursos do estudante
      await this.firestoreService.deleteDocument('student_courses', userId);

      // 3. Remover registros de pacotes do estudante
      await this.firestoreService.deleteDocument('student_packages', userId);

      // 4. Remover registros de exames do estudante
      const studentExams = await this.firestoreService.getDocumentsByAttribute('student_exams', 'studentId', userId);
      for (const exam of studentExams) {
        await this.firestoreService.deleteDocument('student_exams', exam.id);
      }

      // 5. Finalmente, excluir o estudante
      return new Promise((resolve, reject) => {
        this.adminService.deleteUser(userId).subscribe({
          next: () => {
            this.logSuccessfulDelete(student()!);
            resolve('Estudante excluído com sucesso!');
          },
          error: (error) => {
            console.error('Erro ao excluir estudante:', error);
            reject(this.handleError(error));
          }
        });
      });
    } catch (error) {
      console.error('Erro ao excluir estudante:', error);
      throw this.handleError(error);
    }
  }

  getDifferences<T>(oldEmp: T, newEmp: T) {
    const differences: Partial<T> = {};
    for (const key in newEmp) {
      if (newEmp[key as keyof T] !== oldEmp[key as keyof T]) {
        differences[key as keyof T] = newEmp[key as keyof T] as any; // {{ edit_1 }}
      }
    }
    return differences;
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  private handleError(error: any): Error {
    if (error instanceof Error || error instanceof HttpErrorResponse) {
      return new Error(error.message);
    }
    if(error.message != null){
      return new Error(error.message);
    }
    if(error.error != null){
      return new Error(error.error);
    }
    return new Error('Erro desconhecido');
  }

  private logSuccessfulRegistration(student: any) {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.name} (ID: ${
      currentUser?.id
    }) cadastrou o estudante ${student.name} (ID: ${
      student.uid
    }) em ${new Date().toLocaleString()}`;

    this.systemLog.logUserRegistration(student.uid, logDetails);
  }

  private logSuccessfulUpdate(student: Student, chagedData: Partial<Student>) {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.name} (ID: ${
      currentUser?.id
    }) alterou os dados ${JSON.stringify(chagedData)} do funcionario ${
      student.name
    } (ID: ${student.id}) em ${new Date().toLocaleString()}`;

    this.systemLog.logUserEdit(student.id, logDetails);
  }

  private logSuccessfulDelete(student: Student) {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.name} (ID: ${
      currentUser?.id
    }) removeu o estudante ${student.name} (ID: ${
      student.id
    }) em ${new Date().toLocaleString()}`;

    this.systemLog.logUserDelete(student.id, logDetails);
  }

  async updateStudentCourses(studentId: string, courses: string[]): Promise<string> {
    try {
      await this.firestoreService.addToCollectionWithId('student_courses', studentId, { courses });
      return 'Cursos atualizados com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateStudentPackages(studentId: string, packages: string[]): Promise<string> {
    try {
      await this.firestoreService.addToCollectionWithId('student_packages', studentId, { packages });
      return 'Pacotes atualizados com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async saveVideoProgress(studentId: string, courseId: string, videoId: string): Promise<void> {
    try {
      await this.studentService.saveVideoProgress(studentId, courseId, videoId);
      this.logVideoProgress(studentId, courseId, videoId, 'watched');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeVideoProgress(studentId: string, courseId: string, videoId: string): Promise<void> {
    try {
      await this.studentService.removeVideoProgress(studentId, courseId, videoId);
      this.logVideoProgress(studentId, courseId, videoId, 'removed');
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async resetCourseProgress(studentId: string, courseId: string): Promise<void> {
    try {
      const progressId = `${courseId}_${studentId}`;
      await this.firestoreService.updateArrayField(STUDENT_PROGRESS_PATH, progressId, 'watchedVideos', []);
      this.logCourseProgressReset(studentId, courseId);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private logVideoProgress(studentId: string, courseId: string, videoId: string, action: 'watched' | 'removed') {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.name} (ID: ${currentUser?.id}) ${
      action === 'watched' ? 'marcou como assistido' : 'removeu a visualização do'
    } vídeo ${videoId} do curso ${courseId} para o estudante ${studentId} em ${new Date().toLocaleString()}`;

    this.systemLog.logVideoProgress(studentId, logDetails,videoId, action);
  }

  private logCourseProgressReset(studentId: string, courseId: string) {
    const currentUser = this.authService.getCurrentUser();
    const logDetails = `Usuário ${currentUser?.name} (ID: ${currentUser?.id}) resetou o progresso do curso ${courseId} para o estudante ${studentId} em ${new Date().toLocaleString()}`;

    this.systemLog.logCourseProgressReset(studentId, logDetails);
  }

  async addCourseToStudent(studentId: string, courseId: string) {
    try {
      // Busca os cursos atuais do aluno
      const studentCourses = await this.firestoreService.getDocument(STUDENT_COURSES_PATH, studentId);

      let courses = [];
      if (studentCourses && studentCourses.courses) {
        // Se já existem cursos, adiciona o novo
        courses = [...studentCourses.courses];
        if (!courses.includes(courseId)) {
          courses.push(courseId);
        }
      } else {
        // Se não tem cursos ainda, cria o array com o primeiro curso
        courses = [courseId];
      }

      // Cria/atualiza o documento de cursos do aluno
      const coursesRef = collection(this.firestore, STUDENT_COURSES_PATH);
      await addDoc(coursesRef, {
        id: studentId,
        courses: courses,
        updatedAt: new Date()
      });

      // Cria um registro de progresso vazio para o curso
      const progressRef = collection(this.firestore, STUDENT_PROGRESS_PATH);
      await addDoc(progressRef, {
        studentId,
        courseId,
        watchedVideos: [],
        lastAccess: new Date(),
        progress: 0
      });

      // Atualiza o signal de cursos no StudentService
      await this.studentService.selectStudent(studentId);

      this.notificationService.success('Curso adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar curso ao aluno:', error);
      this.notificationService.error('Erro ao adicionar curso');
      throw error;
    }
  }
}
