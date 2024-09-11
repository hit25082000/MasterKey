import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StudentManagementService } from '../../services/student-management.service';
import { CommonModule } from '@angular/common';
import { StudentService } from '../../services/student.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ClassSelectorComponent } from '../../../class/components/class-selector/class-selector.component';
import { CourseSelectorComponent } from '../../../class/components/course-selector/course-selector.component';
import { PackageSelectorComponent } from '../../../class/components/package-selector/package-selector.component';
import { PackageService } from '../../../package/services/package.service';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, CourseSelectorComponent, PackageSelectorComponent, ReactiveFormsModule,ModalComponent,ClassSelectorComponent],
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.scss']
})
export class StudentDetailsComponent implements OnInit {
  studentForm!: FormGroup;
  studentId!: string;
  loading: boolean = true;
  error: string = '';
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private studentService: StudentService,
    private studentManagementService: StudentManagementService,
    private packageService: PackageService
  ) {}

  async ngOnInit() {
    this.studentId = this.route.snapshot.paramMap.get('id')!;

    if (!this.studentId) {
      this.error = 'ID do estudante não encontrado';
      this.loading = false;
      return;
    }

    try {
      const student = await this.studentService.getById(this.studentId);
      this.courses.set(student.courses == undefined ? [''] : student.courses)
      this.packages.set(student.packages == undefined ? [''] : student.packages)

      // Inicializar o formulário após os dados serem carregados
      this.studentForm = this.fb.group({
        nome: [student?.name || '', Validators.required],
        phone1: [student?.phone1 || ''],
        phone2: [student?.phone2 || ''],
        email: [student?.email || '', [Validators.required, Validators.email]],
        cpf: [student?.cpf || '', Validators.required],
        rg: [student?.rg || ''],
        cep: [student?.cep || ''],
        street: [student?.street || ''],
        neighborhood: [student?.neighborhood || ''],
        city: [student?.city || ''],
        state: [student?.state || ''],
        number: [student?.number || ''],
        birthday: [student?.birthday || ''],
        yearsOld: [student?.yearsOld || ''],
        password: [student?.password || '', Validators.required],
        status: [student?.status || 'ativo', Validators.required],
        responsible: [student?.responsible || ''],
        responsibleRg: [student?.rgResponsible || ''],
        responsibleCpf: [student?.cpfResponsible || ''],
        profilePic: [null],
        sex: [student?.sex || 'masculino', Validators.required],
        polo: [student?.polo || ''],
        description: [student?.description || '']
      });

      this.loading = false; // Dados carregados, ocultar indicador de carregamento
    } catch (err) {
      this.error = 'Erro ao carregar os dados do aluno';
      console.error(err);
      this.loading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.studentForm.valid && this.studentForm.dirty) {
      try {
        await this.studentManagementService.update(this.studentId, this.studentForm.value,this.selectedFile);
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

  packages = signal<string[]>([]);
  courses = signal<string[]>([]);

  async onPackageSelectionChange(newSelectedPackages: string[]) {
    const student = await this.studentService.getById(this.studentId);
    const addedPackages = newSelectedPackages.filter(id => !this.packages().includes(id));

    // Atualizar pacotes
    this.packages.set(newSelectedPackages);

    // Adicionar cursos dos novos pacotes
    const allPackages = await this.packageService.getAll();
    const coursesToAdd = allPackages
      .filter(pkg => addedPackages.includes(pkg.id))
      .flatMap(pkg => pkg.courses.map(course => course.id)); // Assume que cada curso tem uma propriedade 'id'

    const updatedCourses = [...new Set([...this.courses(), ...coursesToAdd])];
    this.courses.set(updatedCourses);

    // Atualizar o estudante no banco de dados
    student.packages = newSelectedPackages;
    student.courses = updatedCourses;
    await this.studentManagementService.update(this.studentId, student);
  }
}
