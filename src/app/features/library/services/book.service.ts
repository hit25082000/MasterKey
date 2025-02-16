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
  private readonly firestore = inject(FirestoreService);
  private readonly storage = inject(StorageService);
  private readonly notificationService = inject(NotificationService);

  async getAllBooks(): Promise<Book[]> {
    try {
      const books = await this.firestore.getCollection<Book>('books');
      return books.filter(book => book && book.id);
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
      if (!book) {
        throw new Error('Dados do livro são obrigatórios');
      }

      const initialBook: Book = {
        ...book,
        id: '',
        active: true,
        imageUrl: '',
        pdfUrl: ''
      };

      const bookId = await this.firestore.addToCollection('books', initialBook);
      if (!bookId) {
        throw new Error('Erro ao gerar ID do livro');
      }

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
      if (!book || !book.id) {
        throw new Error('ID do livro é obrigatório');
      }

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
    try {
      if (!bookId) {
        throw new Error('ID do livro é obrigatório');
      }

      const book = await this.firestore.getDocument<Book>('books', bookId);
      if (!book) {
        throw new Error('Livro não encontrado');
      }

      if (book.imageUrl) {
        try {
          await this.storage.deleteFile(`book-images/${bookId}`);
        } catch (error) {
          console.warn('Erro ao deletar imagem do livro:', error);
        }
      }

      if (book.pdfUrl) {
        try {
          await this.storage.deleteFile(`book-pdfs/${bookId}`);
        } catch (error) {
          console.warn('Erro ao deletar PDF do livro:', error);
        }
      }

      await this.firestore.deleteDocument('books', bookId);
      this.notificationService.success('Livro excluído com sucesso');
    } catch (error) {
      console.error('Erro ao excluir livro:', error);
      this.notificationService.error('Erro ao excluir livro');
      throw error;
    }
  }

  async getBooksByCourseId(courseId: string): Promise<Book[]> {
    try {
      if (!courseId) {
        throw new Error('ID do curso é obrigatório');
      }

      const courseBooks = await this.firestore.getDocument<{bookIds: string[]}>('course_books', courseId);
      if (!courseBooks?.bookIds?.length) return [];
      
      const bookPromises = courseBooks.bookIds
        .filter((id : string) => id) // Filtra IDs vazios ou undefined
        .map(async (id: string) => {
          try {
            return await this.firestore.getDocument<Book>('books', id);
          } catch (error) {
            console.warn(`Erro ao buscar livro ${id}:`, error);
            return null;
          }
        });

      const books = await Promise.all(bookPromises);
      return books.filter((book): book is Book => book !== null && book.id !== undefined);
    } catch (error) {
      console.error('Erro ao buscar livros do curso:', error);
      this.notificationService.error('Erro ao carregar livros do curso');
      return [];
    }
  }

  async addBookToCourse(courseId: string, bookId: string): Promise<void> {
    try {
      if (!courseId || !bookId) {
        throw new Error('ID do curso e do livro são obrigatórios');
      }

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
    try {
      if (!book) {
        throw new Error('Dados do livro são obrigatórios');
      }

      const docRef = await this.firestore.addToCollection<Book>('books', book);
      if (!docRef?.id) {
        throw new Error('Erro ao gerar ID do livro');
      }

      return {
        ...book,
        id: docRef.id
      };
    } catch (error) {
      console.error('Erro ao adicionar livro:', error);
      this.notificationService.error('Erro ao adicionar livro');
      throw error;
    }
  }

  async removeBookFromCourse(courseId: string, bookId: string): Promise<void> {
    try {
      if (!courseId || !bookId) {
        throw new Error('ID do curso e do livro são obrigatórios');
      }

      const courseBooks = await this.firestore.getDocument<{bookIds: string[]}>('course_books', courseId);
      if (!courseBooks?.bookIds) return;

      const updatedBooks = courseBooks.bookIds.filter((id: string) => id && id !== bookId);
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
