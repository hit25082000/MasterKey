import { CourseManagementService } from './../../services/course-management.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Video } from '../../../../core/models/course.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-course-details',
  standalone: true,
  imports:[ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './course-details.component.html',
  styleUrls: ['./course-details.component.scss']
})
export class CourseDetailsComponent implements OnInit {
  courseForm!: FormGroup;
  videoList: Video[] = [];
  courseId!: string; // ID do curso a ser editado

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private courseManagementService : CourseManagementService) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id')!;
    this.loadCourseData(this.courseId);

    this.courseForm = this.fb.group({
      name: ['', Validators.required],
      videoCount: [0, Validators.required],
      price: ['', Validators.required],
      promoPrice: [0, Validators.required],
      portionCount: [0, Validators.required],
      hidePrice: [false],
      image: ['', Validators.required],
      status: ['', Validators.required],
      category: ['', Validators.required],
      categoryEcommerce: ['', Validators.required],
      highlight: [false],
      checkoutUrl: ['', Validators.required],
      description: ['', Validators.required],
      workHours: [0, Validators.required],
      videos: this.fb.array([])
    });
  }

  // Simula o carregamento dos dados do curso (deve ser substituído por uma chamada a um serviço)
  loadCourseData(courseId: string): void {
    // Aqui você carregaria os dados reais de um serviço
    const courseData = {
      name: 'Curso de Teste',
      videoCount: 3,
      price: '200.00',
      promoPrice: 150,
      portionCount: 5,
      hidePrice: false,
      image: 'url-da-imagem',
      status: 'ativo',
      category: 'Categoria',
      categoryEcommerce: 'E-commerce',
      highlight: true,
      checkoutUrl: 'url-do-checkout',
      description: 'Descrição do curso',
      workHours: 10,
      videos: [
        { title: 'Introdução', duration: 10, url: 'url-do-video-1' },
        { title: 'Aula 1', duration: 20, url: 'url-do-video-2' },
        { title: 'Aula 2', duration: 15, url: 'url-do-video-3' }
      ]
    };

    // Preenche o formulário com os dados carregados
    this.courseForm.patchValue(courseData);
    courseData.videos.forEach(video => {
      (this.courseForm.get('videos') as FormArray).push(this.fb.group(video));
    });
  }

  createVideo(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      duration: [0, Validators.required],
      url: ['', Validators.required]
    });
  }

  addVideo(): void {
    (this.courseForm.get('videos') as FormArray).push(this.createVideo());
  }

  removeVideo(index: number): void {
    (this.courseForm.get('videos') as FormArray).removeAt(index);
  }

  onSubmit() {
    if (this.courseForm.valid) {
      this.courseManagementService.update(this.courseId,this.courseForm.value)
    }
  }
}
