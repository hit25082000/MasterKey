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
      // Primeiro, verifica se já existe um documento para este curso
      const existingDoc = await this.firestore.getDocument('course_handouts', courseId);

      if (existingDoc) {
        // Se existe, atualiza
        await this.firestore.updateDocument('course_handouts', courseId, {
          handoutIds,
        });
      } else {
        // Se não existe, cria
        await this.firestore.addToCollectionWithId('course_handouts', courseId, {
          handoutIds,
        });
      }

      this.notificationService.success('Apostilas atualizadas com sucesso!');
      return 'Apostilas atualizadas com sucesso!';
    } catch (error) {
      this.notificationService.error('Erro ao atualizar apostilas');
      throw this.handleError(error);
    }
  }

  async updateCourseBooks(courseId: string, bookIds: string[]): Promise<string> {
    try {
      // Primeiro, verifica se já existe um documento para este curso
      const existingDoc = await this.firestore.getDocument('course_books', courseId);

      if (existingDoc) {
        // Se existe, atualiza
        await this.firestore.updateDocument('course_books', courseId, {
          bookIds,
        });
      } else {
        // Se não existe, cria
        await this.firestore.addToCollectionWithId('course_books', courseId, {
          bookIds,
        });
      }

      this.notificationService.success('Livros atualizados com sucesso!');
      return 'Livros atualizados com sucesso!';
    } catch (error) {
      this.notificationService.error('Erro ao atualizar livros');
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

  async updateCourseVideos(courseId: string, videos: Video[]): Promise<void> {
    try {
      // Atualiza a lista completa de vídeos do curso, garantindo valores padrão para campos opcionais
      await this.firestore.updateDocument('courses', courseId, {
        videos: videos.map(video => {
          // Cria um objeto com valores padrão para evitar undefined
          const cleanVideo: Video = {
            id: video.id || '',
            name: video.name || '',
            description: video.description || '',
            webViewLink: video.webViewLink || '',
            duration: video.duration, // Mantém o valor original da duração
            thumbnail: video.thumbnail || '',
            active: video.active ?? true
          };

          return cleanVideo;
        })
      });

      this.notificationService.success('Vídeos do curso atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar vídeos do curso:', error);
      this.notificationService.error('Erro ao atualizar vídeos do curso');
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
