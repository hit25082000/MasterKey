import {
  Component,
  OnInit,
  signal,
  computed,
  input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { HandoutService } from '../../services/handout.service';
import { CourseManagementService } from '../../../course/services/course-management.service';
import { NotificationService } from '../../../../shared/components/notification/notification.service';
import { NotificationType } from '../../../../shared/components/notification/notifications-enum';
import { CourseService } from '../../../course/services/course.service';
import { Handout } from '../../../../core/models/handout.model';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-handout-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, ReactiveFormsModule],
  templateUrl: './handout-selector.component.html',
  styleUrls: ['./handout-selector.component.scss'],
})
export class HandoutSelectorComponent implements OnInit {
  courseId = input<string>('');
  allHandouts = signal<Handout[]>([]);
  selectedHandoutIds = signal<Set<string>>(new Set());

  private handoutService = inject(HandoutService);
  private courseManagementService = inject(CourseManagementService);
  private courseService = inject(CourseService);
  private notificationService = inject(NotificationService);

  selectedHandouts = computed(() => {
    return this.allHandouts().filter((handout) =>
      this.selectedHandoutIds().has(handout.id)
    );
  });

  nonSelectedHandouts = computed(() => {
    return this.allHandouts().filter(
      (handout) => !this.selectedHandoutIds().has(handout.id)
    );
  });

  isSaving = signal(false);

  newHandoutForm: FormGroup;

  constructor(
    private fb: FormBuilder,
  ) {
    this.newHandoutForm = this.fb.group({
      name: ['', Validators.required],
      image: ['', Validators.required],
      url: ['', Validators.required],
    });
  }

  async ngOnInit() {
    await this.loadAllHandouts();
    if (this.courseId()) {
      await this.loadCourseHandouts();
    }
  }

  private async loadAllHandouts() {
    this.allHandouts.set(await this.handoutService.getAll());
  }

  private async loadCourseHandouts() {
    const handouts = await this.courseService.getHandouts(this.courseId());
    if (handouts != undefined) {
      this.selectedHandoutIds.set(new Set(Array.from(handouts) || []));
    }
  }

  onCheckboxChange(handoutId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const updatedSelection = new Set(this.selectedHandoutIds());
    checkbox.checked
      ? updatedSelection.add(handoutId)
      : updatedSelection.delete(handoutId);
    this.selectedHandoutIds.set(updatedSelection);
  }

  async updateCourseHandouts() {
    const courseId = this.courseId();
    if (!courseId) return;

    this.isSaving.set(true);

    try {
      await this.courseManagementService.updateCourseHandouts(
        courseId,
        Array.from(this.selectedHandoutIds())
      );

      this.notificationService.showNotification(
        'Apostilas atualizadas com sucesso',
        NotificationType.SUCCESS
      );
      await this.loadAllHandouts();
      await this.loadCourseHandouts();
    } catch (error) {
      this.notificationService.showNotification(
        'Erro ao atualizar apostilas',
        NotificationType.ERROR
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async removeHandout(handoutId: string) {
    const updatedSelection = new Set(this.selectedHandoutIds());
    updatedSelection.delete(handoutId);
    this.selectedHandoutIds.set(updatedSelection);
  }

  async addNewHandout() {
    if (this.newHandoutForm.valid) {
      const newHandout: Handout = {
        id: '', // Será preenchido pelo serviço
        ...this.newHandoutForm.value
      };

      try {
        const addedHandout = await this.handoutService.add(newHandout);
        this.allHandouts.update(handouts => [...handouts, addedHandout]);
        this.newHandoutForm.reset();
        this.notificationService.showNotification(
          'Nova apostila adicionada com sucesso',
          NotificationType.SUCCESS
        );
      } catch (error) {
        this.notificationService.showNotification(
          'Erro ao adicionar nova apostila',
          NotificationType.ERROR
        );
      }
    }
  }
}
