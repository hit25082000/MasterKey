import { RoleService } from '../../service/role.service';
import { RoleManagementService } from './../../service/role-management.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Permission } from '../permission-select/permission.enum';
import { Role } from '../../../../core/models/role.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-role-editor',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './role-details.component.html',
  styleUrls: ['./role-details.component.scss']
})
export class RoleEditorComponent implements OnInit {
  roleForm!: FormGroup;
  permissions = Object.values(Permission); // Converte os valores do enum em um array
  roleId!: string;
  loading: boolean = true;
  error: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private roleManagementService : RoleManagementService,
    private roleService : RoleService
  ) {}

  async ngOnInit(): Promise<void> {
    this.roleId = this.route.snapshot.paramMap.get('id')!;

    try {
      const role = await this.roleService.getById(this.roleId!);
      this.roleForm = this.fb.group({
        name: [role.name, Validators.required], // Campo nome, obrigatório
        selectedPermissions: new FormControl(role.permissions, Validators.required) // Preenche as permissões atuais
      });
      this.loading = false; // Dados carregados, ocultar indicador de carregamento
    } catch (err) {
      this.error = 'Erro ao carregar os dados da função';
      console.error(err);
      this.loading = false;
    }
}

  onSubmit() {
    if (this.roleForm.valid) {
      this.roleManagementService.update(this.roleId!,this.roleForm.value)
    }
  }
}
