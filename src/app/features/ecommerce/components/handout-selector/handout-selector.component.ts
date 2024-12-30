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
import { NotificationType } from '../../../../shared/models/notifications-enum';
import { CourseService } from '../../../course/services/course.service';
import { Handout } from '../../../../core/models/handout.model';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/services/notification.service';

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

      this.notificationService.success(
        'Apostilas atualizadas com sucesso',
        1
      );
      await this.loadAllHandouts();
      await this.loadCourseHandouts();
    } catch (error) {
      this.notificationService.success(
        'Erro ao atualizar apostilas',
        1
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
      try {
        const newHandout: Handout = {
          id: '', // Será preenchido pelo serviço
          ...this.newHandoutForm.value,
          active: true
        };

        const addedHandout = await this.handoutService.add(newHandout);
        
        // Atualiza a lista local com a nova apostila
        const currentHandouts = this.allHandouts();
        this.allHandouts.set([...currentHandouts, addedHandout]);
        
        this.newHandoutForm.reset();
        this.notificationService.success('Nova apostila adicionada com sucesso');
      } catch (error) {
        console.error('Erro ao adicionar apostila:', error);
        this.notificationService.error('Erro ao adicionar nova apostila');
      }
    } else {
      this.notificationService.error('Por favor, preencha todos os campos obrigatórios');
    }
  }
}
