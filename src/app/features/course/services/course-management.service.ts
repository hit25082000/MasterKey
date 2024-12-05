import { Injectable, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Course } from '../../../core/models/course.model';
import { HttpErrorResponse } from '@angular/common/http';
import { CourseReview } from '../../../core/models/course.model';
import { NotificationService } from '../../../shared/services/notification.service';
import { firstValueFrom } from 'rxjs';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { Video } from '../../../core/models/course.model';

@Injectable({
  providedIn: 'root',
})
export class CourseManagementService {
  private firestore = inject(FirestoreService);
  private notificationService = inject(NotificationService);
  private googleAuthService = inject(GoogleAuthService);

  async create(courseData: Course, imageFile: File | null = null): Promise<string | undefined> {
    try {
      // Verifica se já existe um curso com o mesmo nome
      const existingCourses = await this.firestore.getDocumentsByAttribute(
        'courses',
        'name',
        courseData.name
      );

      if (existingCourses.length > 0) {
        this.notificationService.error('Já existe um curso com este nome');
        return;
      }

      // Processa a imagem se fornecida
      if (imageFile) {
        const imageUrl = await this.uploadImage(imageFile);
        courseData.image = imageUrl;
      }

      // Processa os vídeos se houver
      if (courseData.videos?.length) {
        courseData.videos = await this.processVideos(courseData.videos);
      }

      const { id, ...courseDataWithoutId } = courseData;

      const docRef = await this.firestore.addToCollection('courses', courseDataWithoutId);
      this.notificationService.success('Curso criado com sucesso');
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar curso:', error);
      this.notificationService.error('Erro ao criar curso');
      throw error;
    }
  }

  async update(courseData: Course, imageFile: File | null = null): Promise<void> {
    try {
      // Verifica se o curso existe
      const oldCourse = await this.firestore.getDocument('courses', courseData.id!);
      if (!oldCourse) {
        throw new Error('Curso não encontrado');
      }

      // Processa a imagem se fornecida
      if (imageFile) {
        const imageUrl = await this.uploadImage(imageFile);
        courseData.image = imageUrl;
      }

      // Processa os vídeos se houver alterações
      if (courseData.videos?.length) {
        courseData.videos = await this.processVideos(courseData.videos);
      }

      // Atualiza o curso
      await this.firestore.updateDocument('courses', courseData.id!, courseData);
      this.notificationService.success('Curso atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar curso:', error);
      this.notificationService.error('Erro ao atualizar curso');
      throw error;
    }
  }

  private async uploadImage(file: File): Promise<string> {
    try {
      // Implementar lógica de upload de imagem
      // Retornar URL da imagem
      return '';
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  }

  private async processVideos(videos: Video[]): Promise<Video[]> {
    try {
      // Verifica autenticação do Google
      if (!this.googleAuthService.getAccessToken()) {
        throw new Error('Usuário não autenticado no Google');
      }

      // Processa cada vídeo
      const processedVideos = await Promise.all(
        videos.map(async (video) => {
          if (!video.webViewLink) return video;

          // Extrai ID do vídeo do Google Drive
          const videoId = this.extractVideoId(video.webViewLink);
          if (!videoId) return video;

          // Atualiza URL do vídeo
          return {
            ...video,
            webViewLink: `https://drive.google.com/file/d/${videoId}/preview`
          };
        })
      );

      return processedVideos;
    } catch (error) {
      console.error('Erro ao processar vídeos:', error);
      throw error;
    }
  }

  private extractVideoId(url: string): string | null {
    const fileIdMatch = url.match(/\/d\/([^/]+)/);
    return fileIdMatch ? fileIdMatch[1] : null;
  }

  async updateCourseHandouts(courseId: string, handoutIds: string[]): Promise<string> {
    try {
      await this.firestore.addToCollectionWithId('course_handouts', courseId, {
        handoutIds,
      });
      return 'Apostilas atualizadas com sucesso!';
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCourseReviews(courseId: string, review: CourseReview): Promise<void> {
    try {
      const reviewsDoc = await this.firestore.getDocument('course_reviews', courseId);
      let reviews = reviewsDoc?.reviews || [];
      reviews.push(review);
      await this.firestore.updateDocument('course_reviews', courseId, { reviews });
      this.notificationService.success('Avaliação adicionada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar avaliações:', error);
      this.notificationService.error('Erro ao adicionar avaliação');
      throw error;
    }
  }

  private handleError(error: unknown): Error {
    if (error instanceof Error || error instanceof HttpErrorResponse) {
      return new Error(error.message);
    }
    return new Error('Erro desconhecido');
  }
}
