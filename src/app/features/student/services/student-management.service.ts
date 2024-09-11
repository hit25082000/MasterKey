import { QuerySnapshot } from '@angular/fire/firestore';
import { Student } from './../../../core/models/student.model';
import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { AdminService } from '../../../core/services/admin.service';
import { StudentService } from './student.service';
import { AuthService } from '../../../core/services/auth.service';
import { SystemLogService } from '../../../core/services/system-log.service';

@Injectable({
  providedIn: 'root'
})
export class StudentManagementService {
  constructor(private firestore: FirestoreService, private storage : StorageService, private auth : AuthService, private admin : AdminService,private studentService : StudentService) {}

  async create(student: Student, icon: File | null): Promise<Student> {
    try {
      const emailAlreadyUsed = await this.firestore.getDocumentsByAttribute('users', 'email', student.email);

      if (emailAlreadyUsed.length > 0) {
        throw new Error('Email já utilizado!');
      }

      if (icon != null) {
        student.profilePic = await this.storage.uploadFile(icon, student.id);
      }

      const querySnapshot = await this.firestore.addToCollection('users', student);
      student.id = querySnapshot.id;

      try {
        await this.admin.createUser(student).toPromise();
      } catch (adminError) {
        // Se falhar ao criar o usuário no Admin SDK, exclua o documento do Firestore
        await this.firestore.deleteDocument('users', student.id);
        throw adminError;
      }

      return student;
    } catch (error) {
      console.error('Erro ao criar estudante:', error);
      throw error;
    }
  }

  async update(id: string, newStudent: Student,icon? : File | null): Promise<void> {
    const oldStudent = await this.studentService.getById(id);

    if (oldStudent) {
        console.log('Diferenças encontradas. Atualizando o estudante...');

        if(icon != null){
          newStudent.profilePic = await this.storage.uploadFile(icon, newStudent.id)
        }

        this.admin.updateUser(newStudent).subscribe(()=>{
          this.firestore.updateDocument('users', id, newStudent)
        })
        console.log('Estudante atualizado com sucesso!');
      }else {
        console.error('Estudante não encontrado.');
      }
  }
}
