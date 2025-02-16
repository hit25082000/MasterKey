import { Injectable, inject, signal, computed } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { Book } from '../../../core/models/book.model';
import { NotificationService } from '../../../shared/services/notification.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

export interface BookUpdate extends Partial<Book> {
  imageFile?: File;
  pdfFile?: File;
}

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private readonly firestore = inject(FirestoreService);
  private readonly storage = inject(StorageService);
  private readonly notificationService = inject(NotificationService);

  // Signals
  private readonly booksSignal = signal<Book[]>([]);
  readonly books = computed(() => this.booksSignal());

  constructor() {
    this.loadBooks();
  }

  getAll(): Promise<Book[]> {
    return this.firestore.getCollection<Book>('books');
  }

  private async loadBooks(): Promise<void> {
    try {
      const books = await this.firestore.getCollection<Book>('books');
      this.booksSignal.set(books.filter(book => book && book.id));
    } catch (error) {
      this.notificationService.error('Erro ao carregar livros');
      this.booksSignal.set([]);
    }
  }

  async refreshBooks(): Promise<void> {
    await this.loadBooks();
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

      // Primeiro criar o documento com os dados básicos
      const docRef = await this.firestore.addToCollection('books', {
        ...book,
        active: true,
        imageUrl: '',
        pdfUrl: ''
      });

      if (!docRef.id) {
        throw new Error('Erro ao gerar ID do livro');
      }

      // Fazer upload dos arquivos
      const [imageUrl, pdfUrl] = await Promise.all([
        this.storage.uploadBookImage(imageFile, docRef.id),
        this.storage.uploadBookPdf(pdfFile, docRef.id)
      ]);

      // Atualizar o documento com as URLs
      await this.firestore.updateDocument('books', docRef.id, {
        imageUrl,
        pdfUrl
      });

      await this.refreshBooks();
      return docRef.id;

    } catch (error) {
      console.error('Erro ao criar livro:', error);
      this.notificationService.error('Erro ao criar livro');
      throw error;
    }
  }

  async updateBook(bookId: string, updates: BookUpdate): Promise<void> {
    try {
      const updateData: Partial<Book> = { ...updates };
      delete (updateData as any).imageFile;
      delete (updateData as any).pdfFile;

      // Upload de novos arquivos, se fornecidos
      if (updates.imageFile) {
        updateData.imageUrl = await this.storage.uploadBookImage(updates.imageFile, bookId);
      }
      if (updates.pdfFile) {
        updateData.pdfUrl = await this.storage.uploadBookPdf(updates.pdfFile, bookId);
      }

      await this.firestore.updateDocument('books', bookId, updateData);
      await this.refreshBooks();
      this.notificationService.success('Livro atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar livro:', error);
      this.notificationService.error('Erro ao atualizar livro');
      throw error;
    }
  }

  async deleteBook(bookId: string): Promise<void> {
    try {
      await this.firestore.deleteDocument('books', bookId);
      await this.refreshBooks();
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
