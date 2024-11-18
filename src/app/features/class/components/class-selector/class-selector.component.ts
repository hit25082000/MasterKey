import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  computed,
  input,
  inject,
  Output,
  EventEmitter
} from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { Class } from '../../../../core/models/class.model';
import { ClassService } from '../../services/class.service';
import { StudentService } from '../../../student/services/student.service';
import { FindPipe } from '../../../../shared/pipes/find.pipe';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ClassManagementService } from '../../services/class-management.service';

@Component({
  selector: 'app-class-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, FindPipe],
  template: `
    <div class="class-selector">
      @if (studentId()) {
        <div class="selector-content">
          <h4>Selecionar Turmas</h4>
          <app-search-bar
            [dataList]="nonSelectedClasses()"
            #searchBarComponent
          ></app-search-bar>

          <div class="items-grid">
            @for (classItem of searchBarComponent.filteredList(); track classItem.id) {
              <div class="selector-item">
                <label>
                  <input
                    type="checkbox"
                    [checked]="selectedClassIds().has(classItem.id)"
                    (change)="onCheckboxChange(classItem.id, $event)"
                  />
                  <span class="item-name">{{ classItem.name }}</span>
                </label>
              </div>
            }
          </div>

          <div class="selected-section">
            <h4>Turmas Selecionadas</h4>
            <div class="selected-items">
              @for (classItem of selectedClasses(); track classItem.id) {
                <div class="selected-item">
                  <span>{{ classItem.name }}</span>
                  <button class="btn-remove" (click)="removeClass(classItem.id!)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              }
            </div>
          </div>

          <button
            class="btn-save"
            (click)="updateStudentClasses()"
            [disabled]="isSaving()"
          >
            @if (isSaving()) {
              <i class="fas fa-spinner fa-spin"></i>
            }
            {{ isSaving() ? 'Salvando...' : 'Salvar Turmas' }}
          </button>
        </div>
      }

      @if (classId()) {
        <div class="selector-content">
          <h4>Selecionar Estudantes</h4>
          <app-search-bar
            [dataList]="allStudents()"
            #searchBarStudents
          ></app-search-bar>

          <div class="items-grid">
            @for (student of searchBarStudents.filteredList(); track student.id) {
              <div class="selector-item">
                <label>
                  <input
                    type="checkbox"
                    [checked]="selectedStudentIds().has(student.id)"
                    (change)="onCheckboxChange(student.id, $event)"
                  />
                  <span class="item-name">{{ student.name }}</span>
                </label>
              </div>
            }
          </div>

          <div class="selected-section">
            <h4>Estudantes Selecionados</h4>
            <div class="selected-items">
              @for (studentId of selectedStudentIds(); track studentId) {
                <div class="selected-item">
                  <span>{{ (allStudents() | find:studentId)?.name }}</span>
                  <button class="btn-remove" (click)="removeStudent(studentId)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              }
            </div>
          </div>

          <button
            class="btn-save"
            (click)="updateClassStudents()"
            [disabled]="isSaving()"
          >
            @if (isSaving()) {
              <i class="fas fa-spinner fa-spin"></i>
            }
            {{ isSaving() ? 'Salvando...' : 'Salvar Estudantes' }}
          </button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./class-selector.component.scss']
})
export class ClassSelectorComponent implements OnInit {
  // Inputs
  studentId = input<string>('');
  classId = input<string>('');

  // Signals
  allClasses = signal<Class[]>([]);
  selectedClassIds = signal<Set<string>>(new Set());
  allStudents = signal<any[]>([]);
  selectedStudentIds = signal<Set<string>>(new Set());
  isSaving = signal(false);

  // Computed
  selectedClasses = computed(() =>
    this.allClasses().filter(c => this.selectedClassIds().has(c.id!))
  );

  nonSelectedClasses = computed(() =>
    this.allClasses().filter(c => !this.selectedClassIds().has(c.id!))
  );

  // Services
  private classService = inject(ClassService);
  private classManagementService = inject(ClassManagementService);
  private notificationService = inject(NotificationService);
  private studentService = inject(StudentService);

  // Outputs
  @Output() selectionChange = new EventEmitter<string[]>();

  async ngOnInit() {
    await this.loadAllClasses();

    if (this.studentId()) {
      await this.loadSelectedClasses();
    }

    if (this.classId()) {
      await this.loadAllStudents();
      await this.loadSelectedStudents();
    }
  }

  private async loadAllClasses() {
    this.allClasses = this.classService.classes;
  }

  private async loadSelectedClasses() {
    const classes = await this.classService.getStudentClasses(this.studentId());
    this.selectedClassIds.set(new Set(classes.map(c => c.id!)));
  }

  private async loadAllStudents() {
    this.allStudents = this.studentService.students;
  }

  private async loadSelectedStudents() {
    const students = await this.classService.getClassStudents(this.classId());
    this.selectedStudentIds.set(new Set(students.students || []));
  }

  onCheckboxChange(id: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const updatedSelection = new Set(
      this.studentId() ? this.selectedClassIds() : this.selectedStudentIds()
    );

    if (checkbox.checked) {
      updatedSelection.add(id);
    } else {
      updatedSelection.delete(id);
    }

    if (this.studentId()) {
      this.selectedClassIds.set(updatedSelection);
    } else {
      this.selectedStudentIds.set(updatedSelection);
    }

    this.selectionChange.emit(Array.from(updatedSelection));
  }

  async updateStudentClasses() {
    if (!this.studentId()) return;

    this.isSaving.set(true);
    try {
      await this.classManagementService.updateStudentClasses(
        this.studentId(),
        Array.from(this.selectedClassIds())
      );
      this.notificationService.success('Turmas atualizadas com sucesso');
      await this.loadAllClasses();
      await this.loadSelectedClasses();
    } catch (error) {
      this.notificationService.error('Erro ao atualizar turmas');
      console.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async updateClassStudents() {
    if (!this.classId()) return;

    this.isSaving.set(true);
    try {
      await this.classManagementService.updateClassStudents(
        this.classId(),
        Array.from(this.selectedStudentIds())
      );
      this.notificationService.success('Estudantes atualizados com sucesso');
      await this.loadAllStudents();
      await this.loadSelectedStudents();
    } catch (error) {
      this.notificationService.error('Erro ao atualizar estudantes');
      console.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async removeClass(classId: string) {
    const updatedSelection = new Set(this.selectedClassIds());
    updatedSelection.delete(classId);
    this.selectedClassIds.set(updatedSelection);

    try {
      await this.classManagementService.removeStudentFromClass(classId, this.studentId());
      this.notificationService.success('Turma removida com sucesso');
    } catch (error) {
      this.notificationService.error('Erro ao remover turma');
      console.error(error);
    }
  }

  async removeStudent(studentId: string) {
    const updatedSelection = new Set(this.selectedStudentIds());
    updatedSelection.delete(studentId);
    this.selectedStudentIds.set(updatedSelection);

    try {
      await this.classManagementService.removeStudentFromClass(this.classId()!, studentId);
      this.notificationService.success('Estudante removido com sucesso');
    } catch (error) {
      this.notificationService.error('Erro ao remover estudante');
      console.error(error);
    }
  }
}
