import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { CourseManagementService } from '../../services/course-management.service';
import { Course, Video, CourseModule, CourseVideo } from '../../../../core/models/course.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { VideoSelectorComponent } from '../../../video/components/video-selector/video-selector.component';
import { LoadingService } from '../../../../shared/services/loading.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { GenericFormComponent } from '../../../../shared/components/generic-form/generic-form.component';
import { FormFieldConfig } from '../../../../shared/models/form-field-config';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { StorageService } from '../../../../core/services/storage.service';
import { CategoryService } from '../../../category/services/category.service';
import { CategorySelectorComponent } from '../../../category/components/category-selector/category-selector.component';
import { BookSelectorComponent } from '../../../library/components/book-selector/book-selector.component';
import { HandoutSelectorComponent } from '../../../ecommerce/components/handout-selector/handout-selector.component';
import { CourseReviewComponent } from '../course-review/course-review.component';
import { GoogleAuthButtonComponent } from '../../../../shared/components/google-auth-button/google-auth-button.component';

@Component({
  selector: 'app-course-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    GenericFormComponent,
    ModalComponent,
    VideoSelectorComponent,
    CategorySelectorComponent,
    HandoutSelectorComponent,
    BookSelectorComponent,
    RouterLink,
    CourseReviewComponent,
    GoogleAuthButtonComponent
  ],
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss']
})
export class CourseFormComponent implements OnInit {
  @ViewChild('videoSelector') videoSelector!: VideoSelectorComponent;
  @ViewChild('videoModal') videoModal!: ModalComponent;
  @ViewChild('genericForm') genericForm!: GenericFormComponent;
  @ViewChild('categoryModal') categoryModal!: ModalComponent;

  private fb = inject(FormBuilder);
  private courseService = inject(CourseService);
  private courseManagement = inject(CourseManagementService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private loadingService = inject(LoadingService);
  private notificationService = inject(NotificationService);
  private googleAuthService = inject(GoogleAuthService);
  private storageService = inject(StorageService);
  private categoryService = inject(CategoryService);

  courseForm = signal(this.createForm());
  courseId = signal<string | null>(null);
  currentImage = signal<string | null>(null);
  submitButtonText = computed(() => this.isEditMode() ? 'Atualizar' : 'Criar');
  isAuthenticated = signal(false);
  selectedCategoryId = signal<string | null>(null);
  selectedCategoryName = signal<string | null>(null);
  selectedFile: File | null = null;
  isEditMode = computed(() => !!this.courseId());
  formConfig = signal<FormFieldConfig[]>([]);
  accessToken = signal<string | null>(null);
  moduleIndex: number = 0;

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      price: [0, [Validators.required]],
      promoPrice: [0, [Validators.min(0)]],
      portionCount: [1, [Validators.min(1)]],
      hidePrice: [false],
      imageUrl: [''],
      category: ['', [Validators.required]],
      highlight: [false],
      checkoutUrl: ['', [Validators.required]],
      workHours: [0, [Validators.required, Validators.min(1)]],
      modules: this.fb.array([])
    });
  }

  get modulesArray() {
    return this.courseForm().get('modules') as FormArray;
  }

  get categoryControl() {
    return this.courseForm().get('category');
  }

  createModuleForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      description: ['', [Validators.required]],
      videos: this.fb.array([])
    });
  }

  getVideosArray(moduleIndex: number): FormArray {
    const videosArray = (this.modulesArray.at(moduleIndex) as FormGroup).get('videos') as FormArray;
    return videosArray;
  }


  addModule() {
    this.modulesArray.push(this.createModuleForm());
  }

  removeModule(index: number) {
    this.modulesArray.removeAt(index);
  }

  onVideoSelected(video: Video) {
    const videosArray = (this.modulesArray.at(this.moduleIndex) as FormGroup).get('videos') as FormArray;
    
    // Verifica se o vídeo já existe no módulo
    const exists = videosArray.controls.some(control => 
      control.get('videoId')?.value === video.id
    );

    if (!exists) {
      // Adiciona o novo vídeo no final do array
      videosArray.push(this.fb.group({
        videoId: [video.id],
        name: [video.name || ''],
        duration: [video.duration || 0],
        webViewLink: [video.webViewLink || ''],
        active: [true]
      }));

      // Fecha o modal após adicionar o vídeo
      this.videoModal.show = false;
      this.notificationService.success('Vídeo adicionado com sucesso!');
    } else {
      this.notificationService.error('Este vídeo já está no módulo!');
    }
  }

  removeVideo(moduleIndex: number, videoIndex: number) {
    console.log('Removendo vídeo:', { moduleIndex, videoIndex });
    const moduleFormGroup = this.modulesArray.at(moduleIndex) as FormGroup;
    if (!moduleFormGroup) {
      console.error('Módulo não encontrado:', moduleIndex);
      return;
    }

    const videosArray = moduleFormGroup.get('videos') as FormArray;
    if (!videosArray) {
      console.error('Array de vídeos não encontrado no módulo:', moduleIndex);
      return;
    }




    console.log('Removendo vídeo no índice real:', videoIndex);
    videosArray.removeAt(videoIndex);
    this.notificationService.success('Vídeo removido com sucesso!');
  }

  removeAllVideos(moduleIndex: number) {
    const moduleFormGroup = this.modulesArray.at(moduleIndex) as FormGroup;
    const videosArray = moduleFormGroup.get('videos') as FormArray;
    while (videosArray.length !== 0) {
      videosArray.removeAt(0);
    }
  }

  openVideoSelector(index: number) {
    this.moduleIndex = index;
    this.videoModal.show = true;
  }

  constructor() {
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
          this.notificationService.error('Erro ao carregar categoria:', 5000);
        }
      }

      await this.updateFormConfig(course);

      // Carrega os módulos existentes
      if (course.modules?.length) {
        course.modules.forEach((module: CourseModule) => {
          const moduleForm = this.createModuleForm();
          moduleForm.patchValue({
            name: module.name,
            description: module.description
          });

          // Carrega os vídeos do módulo
          if (module.videos?.length) {
            module.videos.forEach((video: CourseVideo) => {
              (moduleForm.get('videos') as FormArray).push(
                this.fb.group({
                  videoId: [video.videoId],
                  name: [video.name, [Validators.required]],
                  duration: [video.duration, [Validators.required, Validators.min(0)]],
                  active: [video.active !== undefined ? video.active : true],
                  webViewLink: [video.webViewLink]
                })
              );
            });
          }

          this.modulesArray.push(moduleForm);
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
        modules: [],
        reviews: [],
        active: true
      });
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
    this.router.navigate(['/auth/google']);
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

      const processedModules = this.modulesArray.value.map((module: CourseModule) => ({
        ...module,
        videos: module.videos.map((video: CourseVideo) => ({
          ...video,
          active: Boolean(video.active)
        }))
      }));

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
        modules: processedModules,
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
          modules: processedModules,
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
      this.notificationService.error(
        `Erro ao ${this.isEditMode() ? 'atualizar' : 'criar'} o curso: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        5000
      );
    } finally {
      this.loadingService.hide();
    }
  }

  async onCategorySelected(categoryId: string) {
    if (categoryId === this.selectedCategoryId()) return;
    
    try {
      const category = await this.categoryService.getById(categoryId);
      if (category) {
        this.selectedCategoryId.set(categoryId);
        this.selectedCategoryName.set(category.name);
        
        // Evitar atualização cíclica verificando se o valor já está definido
        const currentValue = this.courseForm().get('category')?.value;
        if (currentValue !== categoryId) {
          this.courseForm().patchValue({ category: categoryId }, { emitEvent: false });
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar categoria:', error);
      this.notificationService.error('Erro ao carregar dados da categoria');
    }
  }

  getModuleIndex(moduleControl: any): number {
    return this.modulesArray.controls.indexOf(moduleControl);
  }
}


