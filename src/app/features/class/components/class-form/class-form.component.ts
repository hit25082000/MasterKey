import { Component, OnInit, signal, ViewChild, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormFieldConfig } from '../../../../shared/models/form-field-config';
import { ClassManagementService } from '../../services/class-management.service';
import { ClassService } from '../../services/class.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { Router, ActivatedRoute } from '@angular/router';
import { GenericFormComponent } from '../../../../shared/components/generic-form/generic-form.component';
import { Validators } from '@angular/forms';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TeacherSelectorComponent } from '../../../employees/components/teacher-selector/teacher-selector.component';
import { StudentsSelectorComponent } from '../../../student/components/students-selector/students-selector.component';
import { DayWeekSelectorComponent } from '../day-week-selector/day-week-selector.component';
import { Class } from '../../../../core/models/class.model';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-class-form',
  standalone: true,
  imports: [
    CommonModule,
    GenericFormComponent,
    ModalComponent,
    TeacherSelectorComponent,
    StudentsSelectorComponent
  ],
  template: `
    @if (loading()) {
      <div class="loading">Carregando...</div>
    } @else {
      <div class="class-form-container">
        <!-- Seção de Seletores -->
        <div class="selectors-section">
          <!-- Professor -->
          <div class="selector-item">
            <button type="button" class="selector-button" (click)="teacherModal.toggle()">
              <span class="button-icon">
                <i class="fas fa-chalkboard-teacher"></i>
              </span>
              <span class="button-text">
                {{ selectedTeacherName() || 'Selecionar Professor' }}
              </span>
            </button>
          </div>

          <!-- Alunos -->
          <div class="selector-item">
            <button type="button" class="selector-button" (click)="studentsModal.toggle()">
              <span class="button-icon">
                <i class="fas fa-users"></i>
              </span>
              <span class="button-text">
                {{ selectedStudentsCount() > 0 ? selectedStudentsCount() + ' alunos selecionados' : 'Selecionar Alunos' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Formulário -->
        <app-generic-form
          [config]="formConfig()"
          [submitButtonText]="isEditMode() ? 'Atualizar Turma' : 'Criar Turma'"
          (formSubmit)="onSubmit($event)"
          [formTitle]="isEditMode() ? 'Editar Turma' : 'Nova Turma'"
        >
        </app-generic-form>

        <!-- Modais -->
        <app-modal #teacherModal position="center">
          <div class="modal-body">
            <app-teacher-selector
              (teacherSelected)="onTeacherSelected($event)"
            ></app-teacher-selector>
          </div>
        </app-modal>

        <app-modal #studentsModal position="center">
          <div class="modal-body">
            <app-student-selector
              [classId]="classId()!"
              (studentsSelected)="onStudentsSelected($event)"
            ></app-student-selector>
          </div>
        </app-modal>
      </div>
    }
  `,
  styleUrls: ['./class-form.component.scss']
})
export class ClassFormComponent implements OnInit {
  formConfig = signal<FormFieldConfig[]>([]);
  loading = signal(true);
  classId = signal<string | null>(null);
  selectedTeacherName = signal<string>('');
  selectedTeacherId = signal<string>('');
  selectedStudents = signal<string[]>([]);
  selectedStudentsCount = computed(() => this.selectedStudents().length);

  @ViewChild('genericForm') genericForm!: GenericFormComponent;

  constructor(
    private classManagementService: ClassManagementService,
    private classService: ClassService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.classId.set(id);

    if (this.isEditMode()) {
      await this.loadClass();
    } else {
      this.initNewClass();
    }
  }

  private async loadClass() {
    try {
      const classData = await this.classService.getById(this.classId()!);

      // Carrega dados do professor
      if (classData.teacher) {
        const teacherName = await this.classService.getTeacherName(classData.teacher);
        this.selectedTeacherName.set(teacherName);
        this.selectedTeacherId.set(classData.teacher);
      }

      // Carrega alunos
      const classStudents = await this.classService.getClassStudents(this.classId()!);
      if (classStudents) {
        this.selectedStudents.set(classStudents);
      }

      this.initFormConfig(classData);
    } catch (error) {
      this.notificationService.error('Erro ao carregar turma');
    } finally {
      this.loading.set(false);
    }
  }

  private initFormConfig(classData?: Class) {
    const config: FormFieldConfig[] = [
      {
        name: 'name',
        label: 'Nome da Turma',
        type: 'text',
        value: classData?.name || '',
        validators: [Validators.required],
        errorMessages: { required: 'Nome é obrigatório' }
      },
      {
        name: 'time',
        label: 'Horário',
        type: 'text',
        value: classData?.time || '',
        validators: [Validators.required],
        errorMessages: { required: 'Horário é obrigatório' }
      },
      {
        name: 'daysWeek',
        label: 'Dias da Semana',
        type: 'multiselect',
        value: classData?.daysWeek || [],
        validators: [Validators.required],
        errorMessages: { required: 'Selecione pelo menos um dia da semana' },
        options: [
          { value: 'MONDAY', label: 'Segunda-feira' },
          { value: 'TUESDAY', label: 'Terça-feira' },
          { value: 'WEDNESDAY', label: 'Quarta-feira' },
          { value: 'THURSDAY', label: 'Quinta-feira' },
          { value: 'FRIDAY', label: 'Sexta-feira' },
          { value: 'SATURDAY', label: 'Sábado' },
          { value: 'SUNDAY', label: 'Domingo' }
        ]
      },
      {
        name: 'startDate',
        label: 'Data de Início',
        type: 'date',
        value: classData?.startDate || '',
        validators: [Validators.required],
        errorMessages: { required: 'Data de início é obrigatória' }
      },
      {
        name: 'finishDate',
        label: 'Data de Término',
        type: 'date',
        value: classData?.finishDate || '',
        validators: [Validators.required],
        errorMessages: { required: 'Data de término é obrigatória' }
      },
      {
        name: 'room',
        label: 'Sala',
        type: 'text',
        value: classData?.room || '',
        validators: [Validators.required],
        errorMessages: { required: 'Sala é obrigatória' }
      },
      {
        name: 'status',
        label: 'Ativo',
        type: 'checkbox',
        value: classData?.status ?? true
      }
    ];

    this.formConfig.set(config);
  }

  private initNewClass() {
    const config: FormFieldConfig[] = [
      {
        name: 'name',
        label: 'Nome da Turma',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: { required: 'Nome é obrigatório' }
      },
      {
        name: 'time',
        label: 'Horário',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: { required: 'Horário é obrigatório' }
      },
      {
        name: 'daysWeek',
        label: 'Dias da Semana',
        type: 'multiselect',
        value: [],
        validators: [Validators.required],
        errorMessages: { required: 'Selecione pelo menos um dia da semana' },
        options: [
          { value: 'MONDAY', label: 'Segunda-feira' },
          { value: 'TUESDAY', label: 'Terça-feira' },
          { value: 'WEDNESDAY', label: 'Quarta-feira' },
          { value: 'THURSDAY', label: 'Quinta-feira' },
          { value: 'FRIDAY', label: 'Sexta-feira' },
          { value: 'SATURDAY', label: 'Sábado' },
          { value: 'SUNDAY', label: 'Domingo' }
        ]
      },
      {
        name: 'startDate',
        label: 'Data de Início',
        type: 'date',
        value: '',
        validators: [Validators.required],
        errorMessages: { required: 'Data de início é obrigatória' }
      },
      {
        name: 'finishDate',
        label: 'Data de Término',
        type: 'date',
        value: '',
        validators: [Validators.required],
        errorMessages: { required: 'Data de término é obrigatória' }
      },
      {
        name: 'room',
        label: 'Sala',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: { required: 'Sala é obrigatória' }
      },
      {
        name: 'status',
        label: 'Ativo',
        type: 'checkbox',
        value: true
      }
    ];

    this.formConfig.set(config);
    this.loading.set(false);
  }

  onTeacherSelected(event: {teacherId: string, teacherName: string}) {
    this.selectedTeacherId.set(event.teacherId);
    this.selectedTeacherName.set(event.teacherName);
  }

  onStudentsSelected(students: string[]) {
    this.selectedStudents.set(students);
  }

  async onSubmit(formData: any) {
    try {
      const classData: Class = {
        ...formData,
        teacher: this.selectedTeacherId()
      };

      if (this.isEditMode()) {
        await this.classManagementService.updateClass(
          this.classId()!,
          classData,
          this.selectedStudents()
        );

        this.notificationService.success('Turma atualizada com sucesso');
      } else {
        await this.classManagementService.createClass(
          classData,
          this.selectedStudents()
        );

        this.notificationService.success('Turma criada com sucesso');
      }

      this.router.navigate(['/admin/class-list']);
    } catch (error) {
      this.notificationService.error(
        this.isEditMode()
          ? 'Erro ao atualizar turma'
          : 'Erro ao criar turma'
      );
    }
  }

  isEditMode(): boolean {
    return !!this.classId();
  }
}
