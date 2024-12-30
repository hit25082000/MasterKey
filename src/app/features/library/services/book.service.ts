import { Injectable, inject } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { Book } from '../../../core/models/book.model';
import { from, Observable } from 'rxjs';
import { NotificationService } from '../../../shared/services/notification.service';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private firestore = inject(FirestoreService);
  private storage = inject(StorageService);
  private notificationService = inject(NotificationService);

  async getAllBooks(): Promise<Book[]> {
    try {
      return await this.firestore.getCollection<Book>('books');
    } catch (error) {
      console.error('Erro ao buscar livros:', error);
      this.notificationService.error('Erro ao carregar livros');
      return [];
    }
  }

  async createBook(
    book: Omit<Book, 'id' | 'active' | 'imageUrl' | 'pdfUrl'>,
    imageFile: File,
    pdfFile: File
  ): Promise<string> {
    try {
      const initialBook: Book = {
        ...book,
        id: '',
        active: true,
        imageUrl: '',
        pdfUrl: ''
      };

      const bookId = await this.firestore.addToCollection('books', initialBook);

      const imageUrl = await this.storage.uploadBookImage(imageFile, bookId);
      const pdfUrl = await this.storage.uploadBookPdf(pdfFile, bookId);

      const updatedBook: Book = {
        ...initialBook,
        id: bookId,
        imageUrl,
        pdfUrl
      };

      await this.firestore.updateDocument('books', bookId, updatedBook);

      this.notificationService.success('Livro criado com sucesso');
      return bookId;
    } catch (error) {
      console.error('Erro ao criar livro:', error);
      this.notificationService.error('Erro ao criar livro');
      throw error;
    }
  }

  async updateBook(
    book: Book,
    imageFile?: File,
    pdfFile?: File
  ): Promise<void> {
    try {
      const updatedBook = { ...book };

      if (imageFile) {
        updatedBook.imageUrl = await this.storage.uploadBookImage(imageFile, book.id);
      }

      if (pdfFile) {
        updatedBook.pdfUrl = await this.storage.uploadBookPdf(pdfFile, book.id);
      }

      await this.firestore.updateDocument('books', book.id, updatedBook);
      this.notificationService.success('Livro atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar livro:', error);
      this.notificationService.error('Erro ao atualizar livro');
      throw error;
    }
  }

  async deleteBook(bookId: string): Promise<void> {
    // try {
    //   await this.storage.deleteBookFiles(bookId);

    //   await this.firestore.deleteDocument('books', bookId);

    //   this.notificationService.success('Livro excluído com sucesso');
    // } catch (error) {
    //   console.error('Erro ao excluir livro:', error);
    //   this.notificationService.error('Erro ao excluir livro');
    //   throw error;
    // }
  }

  async getBooksByCourseId(courseId: string): Promise<Book[]> {
    try {
      const courseBooks = await this.firestore.getDocument<{bookIds: string[]}>('course_books', courseId);
      if (!courseBooks?.bookIds?.length) return [];

      const bookPromises = courseBooks.bookIds.map((id: string) =>
        this.firestore.getDocument<Book>('books', id)
      );

      return await Promise.all(bookPromises);
    } catch (error) {
      console.error('Erro ao buscar livros do curso:', error);
      this.notificationService.error('Erro ao carregar livros do curso');
      return [];
    }
  }

  async addBookToCourse(courseId: string, bookId: string): Promise<void> {
    try {
      const courseBooks = await this.firestore.getDocument<{bookIds: string[]}>('course_books', courseId);
      const bookIds = courseBooks?.bookIds || [];

      if (!bookIds.includes(bookId)) {
        await this.firestore.updateDocument('course_books', courseId, {
          bookIds: [...bookIds, bookId]
        });
        this.notificationService.success('Livro adicionado ao curso com sucesso');
      }
    } catch (error) {
      console.error('Erro ao adicionar livro ao curso:', error);
      this.notificationService.error('Erro ao adicionar livro ao curso');
      throw error;
    }
  }

  async add(book: Book): Promise<Book> {
    const docRef = await this.firestore.addToCollection<Book>('books', book);
    return {
      ...book,
      id: docRef.id
    };
  }

  async removeBookFromCourse(courseId: string, bookId: string): Promise<void> {
    try {
      const courseBooks = await this.firestore.getDocument<{bookIds: string[]}>('course_books', courseId);
      if (!courseBooks?.bookIds) return;

      const updatedBooks = courseBooks.bookIds.filter((id:string) => id !== bookId);
      await this.firestore.updateDocument('course_books', courseId, {
        bookIds: updatedBooks
      });
      this.notificationService.success('Livro removido do curso com sucesso');
    } catch (error) {
      console.error('Erro ao remover livro do curso:', error);
      this.notificationService.error('Erro ao remover livro do curso');
      throw error;
    }
  }
}
