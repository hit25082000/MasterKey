import { NotificationService } from './../../../../shared/components/notification/notification.service';
import { LoadingOverlayComponent } from '../../../../shared/components/loading-overlay/loading-overlay.component';
import { NotificationType } from './../../../../shared/components/notification/notifications-enum';
import { Component, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
  imports: [
    CommonModule,
    CourseSelectorComponent,
    PackageSelectorComponent,
    ReactiveFormsModule,
    ModalComponent,
    ClassSelectorComponent,
    LoadingOverlayComponent,
  ],
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.scss'],
})
export class StudentDetailsComponent implements OnInit {
  studentForm!: FormGroup;
  studentId!: string;
  loading: boolean = true;
  selectedFile: File | null = null;
  packages = signal<string[]>([]);
  courses = signal<string[]>([]);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private studentService: StudentService,
    private studentManagementService: StudentManagementService,
    private packageService: PackageService,
    private notificationService: NotificationService
  ) {}

  async ngOnInit() {
    this.studentId = this.route.snapshot.paramMap.get('id')!;

    if (!this.studentId) {
      this.notificationService.showNotification(
        'Estudante não encontrado',
        NotificationType.ERROR
      );
      this.loading = false;
      return;
    }

    try {
      const student = await this.studentService.getById(this.studentId);
      this.courses.set(student.courses == undefined ? [''] : student.courses);
      this.packages.set(
        student.packages == undefined ? [''] : student.packages
      );

      this.studentForm = this.fb.group({
        id: [student.id],
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
        responsible: [student?.responsible || ''],
        responsibleRg: [student?.rgResponsible || ''],
        responsibleCpf: [student?.cpfResponsible || ''],
        profilePic: [null],
        sex: [student?.sex || 'masculino', Validators.required],
        polo: [student?.polo || ''],
        description: [student?.description || ''],
      });

      this.loading = false; // Dados carregados, ocultar indicador de carregamento
    } catch (error) {
      this.notificationService.showNotification(
        'Erro ao consultar dados do estudante: ' + error,
        NotificationType.ERROR
      );
      this.loading = false;
    }
  }

  async onSubmit(): Promise<void> {
    this.loading = true;
    if (this.studentForm.valid && this.studentForm.dirty) {
      try {
        const success = await this.studentManagementService.update(
          this.studentForm.value,
          this.selectedFile
        );
        this.notificationService.showNotification(
          success,
          NotificationType.SUCCESS
        );

        this.loading = false;
      } catch (error) {
        console.error(error);
        this.notificationService.showNotification(
          error instanceof Error
            ? error.message
            : 'Erro desconhecido ao atualizar estudante',
          NotificationType.ERROR
        );
        this.loading = false;
      }
    }
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async onPackageSelectionChange(newSelectedPackages: string[]) {
    const studentId = this.studentId; // Obter o ID do estudante
    this.packages.set(newSelectedPackages);

    // Salvar pacotes na nova coleção
    await this.studentManagementService.updateStudentPackages(studentId, newSelectedPackages);

    // Atualizar cursos com base nos pacotes selecionados
    const allPackages = await this.packageService.getAll();
    const coursesToAdd = allPackages
        .filter((pkg) => newSelectedPackages.includes(pkg.id))
        .flatMap((pkg) => pkg.courses.map((course) => course));

    const updatedCourses = [...new Set([...this.courses(), ...coursesToAdd])];
    this.courses.set(updatedCourses);


    await this.studentManagementService.updateStudentCourses(studentId, updatedCourses);
  }
}
