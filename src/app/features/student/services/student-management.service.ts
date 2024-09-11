import { QuerySnapshot } from '@angular/fire/firestore';
import { Student } from './../../../core/models/student.model';
import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../auth/services/auth.service';
import { StudentService } from './student.service';

@Injectable({
  providedIn: 'root'
})
export class StudentManagementService {
  constructor(private firestore: FirestoreService, private storage : StorageService, private auth : AuthService, private admin : AdminService,private studentService : StudentService) {}

  async create(student: Student,icon : File | null): Promise<void> {
     const emailAlreadyUsed = await (await this.firestore.getDocumentsByAttribute('users','email',student.email)).length > 0

      if(!emailAlreadyUsed){
          if(icon != null){
            student.profilePic = await this.storage.uploadFile(icon, student.id)
          }
            this.firestore.addToCollection('users', student).then((querySnapshot)=>{
              student.id = querySnapshot.id
              this.admin.createUser(student)
          })
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
