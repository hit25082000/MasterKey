import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StudentManagementService } from '../../services/student-management.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './student-register.component.html',
  styleUrls: ['./student-register.component.scss']
})
export class StudentRegisterComponent implements OnInit {
  studentForm!: FormGroup;
  selectedFile: File | null = null;

  constructor(private notificationService: NotificationService,private fb: FormBuilder, private studentManagement : StudentManagementService, private router : Router) {}

  ngOnInit(): void {
    this.studentForm = this.fb.group({
      name: ['', Validators.required],
      phone1: [''],
      phone2: [''],
      email: ['', [Validators.required, Validators.email]],
      cpf: [''],
      rg: [''],
      cep: [''],
      street: [''],
      neighborhood: [''],
      city: [''],
      state: [''],
      number: [''],
      birthday: [''],
      yearsOld: [''],
      password: ['', Validators.required],
      status: ['ativo', Validators.required],
      responsible: [''],
      responsibleRg: [''],
      responsibleCpf: [''],
      profilePic: [null],
      sex: ['masculino', Validators.required],
      polo: [''],
      description: [''],
      role: ['student']
    });
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onSubmit() {
    if (this.studentForm.valid) {
      this.studentManagement.create(this.studentForm.value, this.selectedFile).then(()=>{
        this.notificationService.showNotification('Operação realizada com sucesso!', 'success');
        //this.router.navigate(['/admin/student-list']);
      })
    }
  }
}
