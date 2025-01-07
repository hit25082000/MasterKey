import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Firestore, collection, collectionData, CollectionReference, doc, getDoc, query, where } from '@angular/fire/firestore';
import { Class } from '../../../core/models/class.model';
import { EmployeeService } from '../../employees/services/employee.service';
import { switchMap } from 'rxjs/operators';

const CLASSES_PATH = 'classes';
const CLASS_STUDENTS_PATH = 'class_students';

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

  async getClassStudents(classId: string): Promise<any> {
    const docRef = doc(this.firestore, CLASS_STUDENTS_PATH, classId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : { students: [] };
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

  async getStudentClasses(studentId: string): Promise<Class[]> {
    const studentClasses = await this.getClassStudents(studentId);
    return this.classes().filter(c =>
      studentClasses.students?.includes(studentId)
    );
  }

  getClassesByStudentId(studentId: string) {
    return collectionData(
      query(
        collection(this.firestore, CLASS_STUDENTS_PATH),
        where('studentId', '==', studentId)
      )
    ).pipe(
      switchMap(async (classStudents) => {
        const classIds = classStudents.map(cs => cs['classId']);
        const classes: Class[] = [];
        
        for (const classId of classIds) {
          const classDoc = await getDoc(doc(this.classesCollection, classId));
          if (classDoc.exists()) {
            classes.push({ id: classDoc.id, ...classDoc.data() });
          }
        }
        
        return classes;
      })
    );
  }
}
