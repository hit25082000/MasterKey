import { ClassManagementService } from './../../services/class-management.service';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  signal,
  computed,
  WritableSignal,
  input,
  inject,
} from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { Class } from '../../../../core/models/class.model';
import { ClassService } from '../../services/class.service';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';
import { StudentService } from '../../../student/services/student.service';
import { FindPipe } from '../../../../shared/pipes/find.pipe';

@Component({
  selector: 'app-class-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, FindPipe],
  templateUrl: './class-selector.component.html',
  styleUrls: ['./class-selector.component.scss'],
})
export class ClassSelectorComponent implements OnInit {
  studentId = input<string>('');
  classId = input<string>('');
  allClasses = signal<Class[]>([]);
  selectedClassIds = signal<Set<string>>(new Set());
  allStudents = signal<any[]>([]);
  selectedStudentIds = signal<Set<string>>(new Set());

  private classService = inject(ClassService);
  private classManagementService = inject(ClassManagementService);
  private notificationService = inject(NotificationService);
  private studentService = inject(StudentService);

  selectedClasses = computed(() => {
    return this.allClasses().filter((c) => this.selectedClassIds().has(c.id));
  });

  nonSelectedClasses = computed(() => {
    return this.allClasses().filter((c) => !this.selectedClassIds().has(c.id));
  });

  isSaving = signal(false);

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
    this.allClasses.set(await this.classService.getAll());
  }

  private async loadSelectedClasses() {
    const classes = await this.classService.getStudentClasses(this.studentId());
    this.selectedClassIds.set(new Set(classes.map((c) => c.id)));
  }

  onCheckboxChange(classId: string, isChecked: Event): void {
    const checkbox = isChecked.target as HTMLInputElement;

    const updatedSelection = new Set(this.selectedClassIds());
    checkbox.checked
      ? updatedSelection.add(classId)
      : updatedSelection.delete(classId);
    this.selectedClassIds.set(updatedSelection);
  }

  async updateStudentClasses() {
    const studentId = this.studentId();
    if (!studentId) return;

    this.isSaving.set(true);

    try {
      await this.classManagementService.updateStudentClasses(
        studentId,
        Array.from(this.selectedClassIds())
      );

      this.notificationService.showNotification(
        'Turmas atualizadas com sucesso',
        NotificationType.SUCCESS
      );
      await this.loadAllClasses();
      await this.loadSelectedClasses();
    } catch (error) {
      this.notificationService.showNotification(
        'Erro ao atualizar classes',
        NotificationType.ERROR
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async removeClass(classId: string) {
    const updatedSelection = new Set(this.selectedClassIds());
    updatedSelection.delete(classId);
    this.selectedClassIds.set(updatedSelection);
    await this.classManagementService
      .removeStudentFromClass(classId, this.studentId())
      .then(() => {
        this.notificationService.showNotification(
          'Turmas atualizadas com sucesso',
          NotificationType.SUCCESS
        );
      })
      .catch((erro) => {
        this.notificationService.showNotification(
          'Erro ao atualizar classes: ' + erro,
          NotificationType.ERROR
        );
      });
  }

  private async loadAllStudents() {
    this.allStudents.set(await this.studentService.getAll());
  }

  private async loadSelectedStudents() {
    const students = await this.classService.getClassStudents(this.classId());
    this.selectedStudentIds.set(new Set(students.map((s: any) => s.id)));
  }

  async updateClassStudents() {
    const classId = this.classId();
    if (!classId) return;

    this.isSaving.set(true);

    try {
      await this.classManagementService.updateClassStudents(
        classId,
        Array.from(this.selectedStudentIds())
      );
      this.notificationService.showNotification(
        'Estudantes da classe atualizados com sucesso',
        NotificationType.SUCCESS
      );
      await this.loadAllStudents();
      await this.loadSelectedStudents();
    } catch (error) {
      this.notificationService.showNotification(
        'Erro ao atualizar estudantes da classe',
        NotificationType.ERROR
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async removeStudent(studentId: string) {
    const updatedSelection = new Set(this.selectedStudentIds());
    updatedSelection.delete(studentId);
    this.selectedStudentIds.set(updatedSelection);
    for (const classId of this.selectedClassIds()) {
      await this.classManagementService.removeStudentFromClass(
        classId,
        this.studentId()
      );
    }

    this.notificationService.showNotification(
      'Turmas atualizadas com sucesso',
      NotificationType.SUCCESS
    );
  }
}
