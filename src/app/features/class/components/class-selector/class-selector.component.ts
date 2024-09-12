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

@Component({
  selector: 'app-class-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  templateUrl: './class-selector.component.html',
  styleUrls: ['./class-selector.component.scss'],
})
export class ClassSelectorComponent implements OnInit {
  studentId = input<string>('');
  allClasses = signal<Class[]>([]); // Signal para a lista de vídeos
  selectedClassIds = signal<Set<string>>(new Set()); // Signal para os IDs dos vídeos selecionados

  private classService = inject(ClassService);
  private classManagementService = inject(ClassManagementService);
  private notificationService = inject(NotificationService);

  selectedClasses = computed(() => {
    return this.allClasses().filter((c) => this.selectedClassIds().has(c.id));
  });

  nonSelectedClasses = computed(() => {
    return this.allClasses().filter((c) => !this.selectedClassIds().has(c.id));
  });

  isSaving = signal(false); // Novo signal para controlar o estado de carregamento

  async ngOnInit() {
    await this.loadAllClasses();
    if (this.studentId()) {
      await this.loadSelectedClasses();
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

    this.isSaving.set(true); // Inicia o carregamento

    try {
      await this.classManagementService.updateStudentClasses(
        studentId,
        Array.from(this.selectedClassIds())
      );
      this.notificationService.showNotification(
        'Classes atualizadas com sucesso',
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
      this.isSaving.set(false); // Finaliza o carregamento
    }
  }

  async removeClass(classId: string) {
    const updatedSelection = new Set(this.selectedClassIds());
    updatedSelection.delete(classId);
    this.selectedClassIds.set(updatedSelection);
    await this.updateStudentClasses();
  }
}
