import { Injectable, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Course, CourseModule, CourseVideo } from '../../../core/models/course.model';
import { HttpErrorResponse } from '@angular/common/http';
import { CourseReview } from '../../../core/models/course.model';
import { NotificationService } from '../../../shared/services/notification.service';
import { firstValueFrom } from 'rxjs';
import { GoogleAuthService } from '../../../core/services/google-auth.service';

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

      // Processa os módulos e seus vídeos se houver
      if (courseData.modules?.length) {
        courseData.modules = await this.processModules(courseData.modules);
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

      // Processa os módulos e seus vídeos se houver alterações
      if (courseData.modules?.length) {
        courseData.modules = await this.processModules(courseData.modules);
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

  private async processModules(modules: CourseModule[]): Promise<CourseModule[]> {
    try {
      // Verifica autenticação do Google
      if (!this.googleAuthService.getAccessToken()) {
        throw new Error('Usuário não autenticado no Google');
      }

      // Processa cada módulo e seus vídeos
      const processedModules = await Promise.all(
        modules.map(async (module) => {
          if (module.videos?.length) {
            // Processa os vídeos do módulo
            const processedVideos = await Promise.all(
              module.videos.map(async (video) => {
                try {
                  // Aqui você pode adicionar qualquer processamento adicional necessário para os vídeos
                  // Por exemplo, validar URLs, processar thumbnails, etc.
                  return {
                    ...video,
                    active: video.active !== undefined ? video.active : true
                  };
                } catch (error) {
                  console.error(`Erro ao processar vídeo do módulo ${module.name}:`, error);
                  throw error;
                }
              })
            );

            return {
              ...module,
              videos: processedVideos
            };
          }

          return module;
        })
      );

      return processedModules;
    } catch (error) {
      console.error('Erro ao processar módulos:', error);
      throw error;
    }
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

      // Atualiza também no documento do curso para manter compatibilidade
      const course = await this.firestore.getDocument('courses', courseId);
      if (course) {
        const courseReviews = course.reviews || [];
        courseReviews.push(review);
        await this.firestore.updateDocument('courses', courseId, { reviews: courseReviews });
      }

      this.notificationService.success('Avaliação adicionada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar avaliações:', error);
      this.notificationService.error('Erro ao adicionar avaliação');
      throw error;
    }
  }

  async addReview(courseId: string, review: CourseReview): Promise<void> {
    try {
      const course = await this.firestore.getDocument('courses', courseId);
      if (!course) {
        throw new Error('Curso não encontrado');
      }

      const reviews = course.reviews || [];
      reviews.push(review);

      await this.firestore.updateDocument('courses', courseId, { reviews });
      this.notificationService.success('Avaliação adicionada com sucesso');
    } catch (error) {
      console.error('Erro ao adicionar avaliação:', error);
      this.notificationService.error('Erro ao adicionar avaliação');
      throw error;
    }
  }

  async updateReview(courseId: string, reviewId: string, updatedReview: CourseReview): Promise<void> {
    try {
      const course = await this.firestore.getDocument('courses', courseId);
      if (!course) {
        throw new Error('Curso não encontrado');
      }

      const reviews = course.reviews || [];
      const reviewIndex = reviews.findIndex((r: CourseReview) => r.id === reviewId);

      if (reviewIndex === -1) {
        throw new Error('Avaliação não encontrada');
      }

      reviews[reviewIndex] = { ...reviews[reviewIndex], ...updatedReview };

      await this.firestore.updateDocument('courses', courseId, { reviews });
      this.notificationService.success('Avaliação atualizada com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar avaliação:', error);
      this.notificationService.error('Erro ao atualizar avaliação');
      throw error;
    }
  }

  async deleteReview(courseId: string, reviewId: string): Promise<void> {
    try {
      const course = await this.firestore.getDocument('courses', courseId);
      if (!course) {
        throw new Error('Curso não encontrado');
      }

      const reviews = course.reviews || [];
      const updatedReviews = reviews.filter((r: CourseReview) => r.id !== reviewId);

      await this.firestore.updateDocument('courses', courseId, { reviews: updatedReviews });
      this.notificationService.success('Avaliação removida com sucesso');
    } catch (error) {
      console.error('Erro ao remover avaliação:', error);
      this.notificationService.error('Erro ao remover avaliação');
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
