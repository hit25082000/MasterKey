import { Component, OnInit, signal, computed, inject, ViewChild, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { CourseManagementService } from '../../services/course-management.service';
import { Course, Video } from '../../../../core/models/course.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { VideoSelectorComponent } from '../../../video/components/video-selector/video-selector.component';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { GenericFormComponent } from '../../../../shared/components/generic-form/generic-form.component';
import { FormFieldConfig } from '../../../../shared/models/form-field-config';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { StorageService } from '../../../../core/services/storage.service';
import { createComputed, createSignal } from '@angular/core/primitives/signals';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../category/services/category.service';
import { Category } from '../../../../core/models/category.model';
import { CategorySelectorComponent } from '../../../category/components/category-selector/category-selector.component';
import { BookSelectorComponent } from '../../../library/components/book-selector/book-selector.component';
import { HandoutSelectorComponent } from '../../../ecommerce/components/handout-selector/handout-selector.component';
import { CourseReviewComponent } from '../course-review/course-review.component';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    GenericFormComponent,
    ModalComponent,
    VideoSelectorComponent,
    CategorySelectorComponent,
    HandoutSelectorComponent,
    BookSelectorComponent,
    RouterLink,
    CourseReviewComponent
  ],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss']
})
export class CourseFormComponent implements OnInit {
  @ViewChild('videoSelector') videoSelector!: VideoSelectorComponent;
  @ViewChild('categoryModal') categoryModal!: ModalComponent;

  selectedVideos = signal<Video[]>([]);

  private notificationService = inject(NotificationService);
  private courseService = inject(CourseService);
  private courseManagement = inject(CourseManagementService);
  private loadingService = inject(LoadingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private googleAuthService = inject(GoogleAuthService);
  private storageService = inject(StorageService);
  courseId = signal<string | null>(null);
  isEditMode = computed(() => !!this.courseId());
  formConfig = signal<FormFieldConfig[]>([]);
  submitButtonText = computed(() => this.isEditMode() ? 'Atualizar' : 'Criar');
  accessToken = signal<string | null>(null);
  isAuthenticated = signal(false);
  selectedFile: File | null = null;

  @ViewChild('genericForm') genericForm?: GenericFormComponent;

  courseForm = signal<FormGroup>(this.fb.group({
    category: ['', Validators.required],
    videos: this.fb.array([])
  }));

  currentImage = signal<string | null>(null);

  selectedCategoryId = signal<string>('');
  selectedCategoryName = signal<string>('');

  get videosArray(): FormArray {
    return this.courseForm().get('videos') as FormArray;
  }

  get categoryControl() {
    return this.courseForm().get('category');
  }

  private categoryService = inject(CategoryService);

  constructor(private fb: FormBuilder) {
    this.setupGoogleAuth();
    this.initFormConfig();
  }

  private setupGoogleAuth() {
    this.googleAuthService.getAccessToken().subscribe(token => {
      if (token) {
        this.accessToken.set(token);
        this.isAuthenticated.set(true);
      }
    });
  }

  initFormConfig() {
    this.formConfig.set([
      {
        name: 'name',
        label: 'Nome do Curso',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: { required: 'Nome é obrigatório' }
      },
      {
        name: 'description',
        label: 'Descrição',
        type: 'textarea',
        value: '',
        validators: [Validators.required],
        errorMessages: { required: 'Descrição é obrigatória' }
      },
      {
        name: 'price',
        label: 'Preço',
        type: 'number',
        value: '',
        validators: [Validators.required],
        errorMessages: { required: 'Preço é obrigatório' }
      },
      {
        name: 'promoPrice',
        label: 'Preço Promocional',
        type: 'number',
        value: '0',
        validators: [Validators.min(0)],
        errorMessages: { min: 'Preço promocional não pode ser negativo' }
      },
      {
        name: 'portionCount',
        label: 'Número de Parcelas',
        type: 'number',
        value: '1',
        validators: [Validators.min(1)],
        errorMessages: { min: 'Mínimo de 1 parcela' }
      },
      {
        name: 'hidePrice',
        label: 'Ocultar Preço',
        type: 'checkbox',
        value: false
      },
      {
        name: 'workHours',
        label: 'Carga Horária',
        type: 'number',
        value: 0,
        validators: [Validators.required, Validators.min(1)],
        errorMessages: {
          required: 'Carga horária é obrigatória',
          min: 'Carga horária deve ser maior que zero'
        }
      },
      {
        name: 'checkoutUrl',
        label: 'URL de Checkout',
        type: 'text',
        value: '',
        validators: [Validators.required],
        errorMessages: { required: 'URL de checkout é obrigatória' }
      },
      {
        name: 'highlight',
        label: 'Destaque',
        type: 'checkbox',
        value: false
      },
      {
        name: 'image',
        label: 'Imagem do Curso',
        type: 'file',
        value: '',
        validators: this.isEditMode() ? [] : [Validators.required],
        errorMessages: { required: 'Imagem é obrigatória' },
        onFileChange: (event: any) => this.onFileChange(event)
      }
    ]);
  }

  createVideoFormGroup(video: Video): FormGroup {
    return this.fb.group({
      id: [video.id],
      name: [video.name, Validators.required],
      duration: [video.duration, Validators.required],
      url: [video.webViewLink, Validators.required],
      active: [video.active !== undefined ? video.active : true]
    });
  }

  removeVideo(index: number) {
    const videoId = this.videosArray.at(index).get('id')?.value;
    this.videosArray.removeAt(index);
    if (this.videoSelector) {
      this.videoSelector.removeVideo(videoId);
    }
  }

  async ngOnInit() {
    this.loadingService.show();
    this.courseId.set(this.route.snapshot.paramMap.get('id'));

    try {
      if (this.isEditMode()) {
        await this.loadCourseData();
      } else {
        await this.initializeNewCourse();
      }
    } catch (error) {
      this.notificationService.error('Erro ao carregar dados do formulário', 5000);
    } finally {
      this.loadingService.hide();
    }
  }

  private async loadCourseData() {
    try {
      const course = await this.courseService.getById(this.courseId()!);

      if (course.image) {
        this.currentImage.set(course.image);
      }

      if (course.category) {
        try {
          const category = await this.categoryService.getById(course.category);
          this.selectedCategoryId.set(course.category);
          this.selectedCategoryName.set(category.name);

          this.courseForm().patchValue({
            category: course.category
          });

          this.formConfig.update(config => {
            return config.map(field => {
              if (field.name === 'category') {
                return {
                  ...field,
                  value: category.name
                };
              }
              return field;
            });
          });
        } catch (error) {
          console.error('Erro ao carregar categoria:', error);
        }
      }

      await this.updateFormConfig(course);

      if (course.videos?.length) {
        course.videos.forEach(video => {
          this.videosArray.push(this.createVideoFormGroup(video));
        });
      }
    } catch (error) {
      throw new Error(`Erro ao carregar curso: ${error}`);
    }
  }

  private async initializeNewCourse() {
    try {
      const tempId = `temp_${Date.now()}`;

      await this.updateFormConfig({
        id: tempId,
        name: '',
        description: '',
        price: 0,
        promoPrice: 0,
        portionCount: 1,
        hidePrice: false,
        image: '',
        category: '',
        highlight: false,
        checkoutUrl: '',
        workHours: 0,
        videos: [],
        reviews: [],
        active: true
      } satisfies Course);
    } catch (error) {
      throw new Error(`Erro ao inicializar novo curso: ${error}`);
    }
  }

  private async updateFormConfig(course: Course) {
    return new Promise<void>((resolve) => {
      queueMicrotask(() => {
        this.formConfig.set(this.formConfig().map(field => {
          if (field.name === 'image') {
            return {
              ...field,
              validators: [],
              value: ''
            };
          }

          const value = course[field.name as keyof Course];
          return {
            ...field,
            value: value ?? field.value
          };
        }));
        resolve();
      });
    });
  }

  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.currentImage.set(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  authenticateWithGoogle() {
    const redirectUri = `http://localhost:4200/admin/course-form'}`;
    this.googleAuthService.initiateOAuthFlow(redirectUri);
  }

  async onSubmit(formData: any) {
    if (!this.genericForm?.form().valid) {
      this.notificationService.error('Por favor, preencha todos os campos obrigatórios do curso', 5000);
      return;
    }

    if (!this.categoryControl?.valid) {
      this.notificationService.error('Por favor, selecione uma categoria', 5000);
      return;
    }

    this.loadingService.show();

    try {
      let imageUrl = this.currentImage();

      if (this.selectedFile) {
        const courseId = this.courseId() || Date.now().toString();
        imageUrl = await this.storageService.uploadCourseImage(this.selectedFile, courseId);
      }

      const processedVideos = this.videosArray.length > 0
        ? this.videosArray.value.map((video: any) => ({
            ...video,
            active: Boolean(video.active)
          }))
        : [];

      const courseData: Course = {
        id: this.courseId() || undefined!,
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        promoPrice: Number(formData.promoPrice || 0),
        portionCount: Number(formData.portionCount || 1),
        hidePrice: Boolean(formData.hidePrice),
        image: imageUrl!,
        category: this.categoryControl?.value,
        highlight: Boolean(formData.highlight),
        checkoutUrl: formData.checkoutUrl,
        workHours: Number(formData.workHours),
        videos: processedVideos,
        reviews: [],
        active: true
      };

      if (this.isEditMode()) {
        if (!courseData.id) {
          throw new Error('ID do curso não encontrado para atualização');
        }

        const existingCourse = await this.courseService.getById(courseData.id);
        const updatedCourse: Course = {
          ...existingCourse,
          ...courseData,
          category: this.categoryControl?.value || existingCourse.category,
          reviews: existingCourse.reviews || [],
          videos: processedVideos.length > 0 ? processedVideos : existingCourse.videos,
          image: imageUrl || existingCourse.image
        };

        await this.courseManagement.update(updatedCourse);
      } else {
        await this.courseManagement.create(courseData);
      }

      this.notificationService.success(
        `Curso ${this.isEditMode() ? 'atualizado' : 'criado'} com sucesso!`,
        5000
      );
      this.router.navigate(['/admin/course-list']);
    } catch (error) {
      console.error('Erro ao salvar curso:', error);
      this.notificationService.error(
        `Erro ao ${this.isEditMode() ? 'atualizar' : 'criar'} o curso: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        5000
      );
    } finally {
      this.loadingService.hide();
    }
  }

  onVideosSelected(newVideos: Video[]) {
    // Obtém os vídeos existentes
    const existingVideos = this.videosArray.value;

    // Filtra os novos vídeos para não incluir os que já existem
    const uniqueNewVideos = newVideos.filter(newVideo =>
      !existingVideos.some((existingVideo : any) => existingVideo.id === newVideo.id)
    );

    console.log('Vídeos existentes:', existingVideos);
    console.log('Novos vídeos únicos:', uniqueNewVideos);

    // Adiciona apenas os novos vídeos ao array
    uniqueNewVideos.forEach(video => {
      const videoWithActive: Video = {
        ...video,
        active: true
      };
      this.videosArray.push(this.createVideoFormGroup(videoWithActive));
    });

    // Atualiza a lista de vídeos selecionados
    this.selectedVideos.set([...existingVideos, ...uniqueNewVideos]);

    console.log('Array final de vídeos:', this.videosArray.value);
  }

  async onCategorySelected(event: { categoryId: string, categoryName: string }) {
    console.log('Processando seleção de categoria:', event);
    if (event?.categoryId) {
      try {
        this.selectedCategoryId.set(event.categoryId);
        this.selectedCategoryName.set(event.categoryName);

        this.courseForm().patchValue({
          category: event.categoryId
        });

        console.log('Categoria atualizada:', {
          id: this.selectedCategoryId(),
          name: this.selectedCategoryName(),
          formValue: this.courseForm().get('category')?.value
        });

        if (this.categoryModal) {
          this.categoryModal.toggle();
        }
      } catch (error) {
        console.error('Erro ao buscar categoria:', error);
        this.notificationService.error('Erro ao carregar dados da categoria', 5000);
      }
    }
  }
}
