import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Firestore, collection, collectionData, CollectionReference, doc, getDoc, query, where, DocumentReference } from '@angular/fire/firestore';
import { Class } from '../../../core/models/class.model';
import { EmployeeService } from '../../employees/services/employee.service';
import { Observable, from, map } from 'rxjs';

const CLASSES_PATH = 'classes';
const CLASS_STUDENTS_PATH = 'class_students';
const STUDENT_CLASSES_PATH = 'student_classes';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  firestore = inject(Firestore);
  employeeService = inject(EmployeeService);

  classesCollection = collection(
    this.firestore,
    CLASSES_PATH
  ) as CollectionReference<Class>;

  classes = signal<Class[]>([]);
  selectedClass = signal<Class | undefined>(undefined);
  isLoading = signal<boolean>(true);

  constructor() {
    // Carrega todas as turmas
    collectionData(this.classesCollection, { idField: 'id' }).subscribe(
      (data) => {
        this.classes.set(data);
        this.isLoading.set(false);
      },
      (error) => {
        console.error("Erro ao buscar turmas:", error);
        this.isLoading.set(false);
      }
    );
  }

  async selectClass(id: string): Promise<WritableSignal<Class | undefined>> {
    while (this.isLoading()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const classItem = this.classes().find(c => c.id === id);
    this.selectedClass.set(classItem);
    return this.selectedClass;
  }

  async getById(id: string): Promise<Class> {
    while (this.isLoading()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const classItem = this.classes().find(c => c.id === id);
    if (!classItem) {
      throw new Error('Turma não encontrada');
    }
    return classItem;
  }

  async getTeacherName(teacherId: string): Promise<string> {
    try {
      const teacher = await this.employeeService.getById(teacherId);
      return teacher?.name || 'Professor não encontrado';
    } catch (error) {
      console.error('Erro ao buscar nome do professor:', error);
      return 'Professor não encontrado';
    }
  }

  // Métodos para relacionamento many-to-many
  async getClassStudents(classId: string): Promise<string[]> {
    try {
      const classStudentsRef = doc(this.firestore, CLASS_STUDENTS_PATH, classId) as DocumentReference<{ students: string[] }>;
      const docSnap = await getDoc(classStudentsRef);
      return docSnap.exists() ? docSnap.data().students : [];
    } catch (error) {
      console.error('Erro ao buscar alunos da turma:', error);
      return [];
    }
  }

  async getStudentClasses(studentId: string): Promise<string[]> {
    try {
      const studentClassesRef = doc(this.firestore, STUDENT_CLASSES_PATH, studentId) as DocumentReference<{ classes: string[] }>;
      const docSnap = await getDoc(studentClassesRef);
      return docSnap.exists() ? docSnap.data().classes : [];
    } catch (error) {
      console.error('Erro ao buscar turmas do aluno:', error);
      return [];
    }
  }

  getClassesByStudentId(studentId: string): Observable<Class[]> {
    return from(this.getStudentClasses(studentId)).pipe(
      map(classIds => {
        return this.classes().filter(c => classIds.includes(c.id!));
      })
    );
  }
}
