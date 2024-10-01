import { CourseService } from './../../services/course.service';
import { Course } from './../../../../core/models/course.model';
import { CourseManagementService } from './../../services/course-management.service';
import { Component, Input, OnInit } from '@angular/core';
import { CourseReview } from '../../../../core/models/course.model';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-course-review',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './course-review.component.html',
  styleUrls: ['./course-review.component.scss'],
})
export class CourseReviewComponent implements OnInit {
  @Input() courseId!: string;
  reviews: CourseReview[] = [];

  rating: number = 0;
  comment: string = '';
  videoFile: File | null = null;

  constructor(
    private courseManagementService: CourseManagementService,
    private courseService: CourseService
  ) {}

  async ngOnInit() {
    this.reviews = await this.courseService.getReviews(this.courseId);
  }

  setRating(star: number): void {
    this.rating = star;
  }

  onVideoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.videoFile = input.files[0];
    }
  }

  isValidReview(): boolean {
    return this.rating > 0 && this.comment.trim().length > 0;
  }

  async submitReview(): Promise<void> {
    if (!this.isValidReview()) return;

    let videoUrl = '';
    if (this.videoFile) {
      // Aqui você implementaria a lógica para fazer upload do vídeo
      // e obter a URL. Por exemplo:
      // videoUrl = await this.uploadVideoService.upload(this.videoFile);
    }

    const review: CourseReview = {
      id: '', // Será gerado pelo Firestore
      userId: 'USER_ID', // Substitua pelo ID do usuário atual
      courseId: this.courseId,
      rating: this.rating,
      comment: this.comment,
      videoUrl: videoUrl,
      createdAt: new Date(),
    };

    try {
      await this.courseManagementService.updateCourseReviews(
        this.courseId,
        review
      );
      // Resetar o formulário após o envio bem-sucedido
      this.rating = 0;
      this.comment = '';
      this.videoFile = null;
      // Atualizar a lista de avaliações do curso
      this.reviews.push(review);
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error);
      // Aqui você pode adicionar uma lógica para mostrar uma mensagem de erro ao usuário
    }
  }
}
