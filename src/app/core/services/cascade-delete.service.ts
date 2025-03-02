import { Injectable, inject } from '@angular/core';
import { FirestoreService } from './firestore.service';
import { StudentService } from '../../features/student/services/student.service';
import { where } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class CascadeDeleteService {
  private firestore = inject(FirestoreService);
  private studentService = inject(StudentService);

  /**
   * Remove um pacote e todas as suas referências
   * @param packageId ID do pacote a ser removido
   */
  async deletePackage(packageId: string): Promise<void> {
    try {
      // 1. Encontrar todos os estudantes que têm este pacote
      const studentPackages = await this.firestore.getDocumentsByArrayItemId('student_packages', 'packages', packageId);
      
      // 2. Remover o pacote de cada estudante
      for (const studentPackage of studentPackages) {
        const studentId = studentPackage.id;
        await this.studentService.removePackageFromStudent(studentId, packageId);
      }
      
      // 3. Finalmente, remover o pacote
      await this.firestore.deleteDocument('packages', packageId);
    } catch (error) {
      console.error('Erro ao excluir pacote:', error);
      throw error;
    }
  }

  /**
   * Remove um curso e todas as suas referências
   * @param courseId ID do curso a ser removido
   */
  async deleteCourse(courseId: string): Promise<void> {
    try {
      // 1. Encontrar todos os estudantes que têm este curso
      const studentCourses = await this.firestore.getDocumentsByArrayItemId('student_courses', 'courses', courseId);
      
      // 2. Remover o curso de cada estudante
      for (const studentCourse of studentCourses) {
        const studentId = studentCourse.id;
        await this.studentService.removeCourseFromStudent(studentId, courseId);
      }

      // 3. Remover registros de progresso relacionados ao curso
      const progressDocs = await this.firestore.getDocumentsByQuery<any>('student_progress', 
        where('courseId', '==', courseId));
      
      for (const progressDoc of progressDocs) {
        await this.firestore.deleteDocument('student_progress', progressDoc.id);
      }

      // 4. Encontrar e remover todos os exames relacionados ao curso
      const exams = await this.firestore.getDocumentsByAttribute('exams', 'courseId', courseId);
      
      for (const exam of exams) {
        await this.deleteExam(exam.id);
      }

      // 5. Remover documentos relacionados a apostilas e livros do curso
      await this.firestore.deleteDocument('course_handouts', courseId);
      await this.firestore.deleteDocument('course_books', courseId);
      await this.firestore.deleteDocument('course_reviews', courseId);

      // 6. Encontrar todos os pacotes que contêm este curso
      const packages = await this.firestore.getDocumentsByArrayItemId('packages', 'courses', courseId);
      
      // 7. Remover o curso de cada pacote
      for (const pkg of packages) {
        const updatedCourses = pkg.courses.filter((id: string) => id !== courseId);
        await this.firestore.updateDocument('packages', pkg.id, { courses: updatedCourses });
      }

      // 8. Finalmente, remover o curso
      await this.firestore.deleteDocument('courses', courseId);
    } catch (error) {
      console.error('Erro ao excluir curso:', error);
      throw error;
    }
  }

  /**
   * Remove um exame e todas as suas referências
   * @param examId ID do exame a ser removido
   */
  async deleteExam(examId: string): Promise<void> {
    try {
      // 1. Encontrar todos os registros de student_exams relacionados a este exame
      const studentExams = await this.firestore.getDocumentsByAttribute('student_exams', 'examId', examId);
      
      // 2. Remover todos os registros de student_exams
      for (const studentExam of studentExams) {
        await this.firestore.deleteDocument('student_exams', studentExam.id);
      }
      
      // 3. Finalmente, remover o exame
      await this.firestore.deleteDocument('exams', examId);
    } catch (error) {
      console.error('Erro ao excluir exame:', error);
      throw error;
    }
  }

  /**
   * Remove um vídeo de um curso e todas as suas referências
   * @param courseId ID do curso que contém o vídeo
   * @param videoId ID do vídeo a ser removido
   */
  async deleteVideo(courseId: string, videoId: string): Promise<void> {
    try {
      // 1. Buscar o curso
      const course = await this.firestore.getDocument('courses', courseId);
      if (!course) {
        throw new Error('Curso não encontrado');
      }

      // 2. Encontrar todos os estudantes que têm progresso neste vídeo
      const studentProgressDocs = await this.firestore.getDocumentsByQuery<any>('student_progress', 
        where('courseId', '==', courseId));
      
      // 3. Remover o vídeo do progresso de cada estudante
      for (const progressDoc of studentProgressDocs) {
        const studentId = progressDoc.id.split('_')[1]; // Formato do ID: courseId_studentId
        if (progressDoc.watchedVideos && progressDoc.watchedVideos.includes(videoId)) {
          await this.studentService.removeVideoProgress(studentId, courseId, videoId);
        }
      }

      // 4. Atualizar o curso removendo o vídeo (isso depende da estrutura do seu modelo de curso)
      // Esta parte pode variar dependendo de como os vídeos são armazenados no documento do curso
      if (course.videos) {
        const updatedVideos = course.videos.filter((video: any) => video.id !== videoId);
        await this.firestore.updateDocument('courses', courseId, { videos: updatedVideos });
      } else if (course.modules) {
        // Se os vídeos estão dentro de módulos
        const updatedModules = course.modules.map((module: any) => {
          if (module.videos) {
            module.videos = module.videos.filter((video: any) => video.id !== videoId);
          }
          return module;
        });
        await this.firestore.updateDocument('courses', courseId, { modules: updatedModules });
      }
    } catch (error) {
      console.error('Erro ao excluir vídeo:', error);
      throw error;
    }
  }
} 