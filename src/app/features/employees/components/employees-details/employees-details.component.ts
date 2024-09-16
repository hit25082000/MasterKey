import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeesManagementService } from '../../services/employees-management.service';
import { CommonModule } from '@angular/common';
import { EmployeesService } from '../../services/employees.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ClassSelectorComponent } from '../../../class/components/class-selector/class-selector.component';
import { CourseSelectorComponent } from '../../../class/components/course-selector/course-selector.component';
import { PackageSelectorComponent } from '../../../class/components/package-selector/package-selector.component';
import { PackageService } from '../../../package/services/package.service';

@Component({
  selector: 'app-employees-detail',
  standalone: true,
  imports: [CommonModule, CourseSelectorComponent, PackageSelectorComponent, ReactiveFormsModule,ModalComponent,ClassSelectorComponent],
  templateUrl: './employees-details.component.html',
  styleUrls: ['./employees-details.component.scss']
})
export class EmployeesDetailsComponent implements OnInit {
  employeeForm!: FormGroup;
  employeeId!: string;
  loading: boolean = true;
  error: string = '';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private employeesService: EmployeesService,
    private employeesManagementService: EmployeesManagementService,
    private packageService: PackageService
  ) {}

  async ngOnInit() {
    this.employeeId = this.route.snapshot.paramMap.get('id')!;

    if (!this.employeeId) {
      this.error = 'ID do estudante não encontrado';
      this.loading = false;
      return;
    }

    try {
      const employees = await this.employeesService.getById(this.employeeId);

      // Inicializar o formulário após os dados serem carregados
      this.employeeForm = this.fb.group({
        nome: [employees?.name || '', Validators.required],
        phone1: [employees?.phone1 || ''],
        phone2: [employees?.phone2 || ''],
        email: [employees?.email || '', [Validators.required, Validators.email]],
        cpf: [employees?.cpf || '', Validators.required],
        rg: [employees?.rg || ''],
        cep: [employees?.cep || ''],
        street: [employees?.street || ''],
        neighborhood: [employees?.neighborhood || ''],
        city: [employees?.city || ''],
        state: [employees?.state || ''],
        number: [employees?.number || ''],
        birthday: [employees?.birthday || ''],
        yearsOld: [employees?.yearsOld || ''],
        password: [employees?.password || '', Validators.required],
        status: [employees?.status || 'ativo', Validators.required],
        profilePic: [null],
        sex: [employees?.sex || 'masculino', Validators.required],
        polo: [employees?.polo || ''],
        description: [employees?.description || '']
      });

      this.loading = false; // Dados carregados, ocultar indicador de carregamento
    } catch (err) {
      this.error = 'Erro ao carregar os dados do aluno';
      console.error(err);
      this.loading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.employeeForm.valid && this.employeeForm.dirty) {
      try {
        await this.employeesManagementService.update(this.employeeId, this.employeeForm.value,this.selectedFile);
        console.log('Aluno atualizado com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar aluno:', error);
        this.error = 'Erro ao atualizar aluno';
      }
    }
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }
}
