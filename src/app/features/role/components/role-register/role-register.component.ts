import { RoleManagementService } from './../../service/role-management.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Permission } from '../permission-select/permission.enum';
import { Role } from '../../../../core/models/role.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-role-creator',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './role-register.component.html',
  styleUrls: ['./role-register.component.scss']
})
export class RoleRegisterComponent implements OnInit {
  roleForm!: FormGroup;
  permissionsList = Object.values(Permission); // Converte os valores do enum em um array

  constructor(private fb: FormBuilder, private roleManagementService : RoleManagementService) {}

  ngOnInit(): void {
    this.roleForm = this.fb.group({
      name: ['', Validators.required], // Campo nome, obrigatório
      permissions: new FormControl([], Validators.required) // Permissões, também obrigatório
    });
  }

  onSubmit() {
    if (this.roleForm.valid) {
      this.roleManagementService.create(this.roleForm.value)
    }
  }
}
