import { Injectable } from '@angular/core';
import { FirestoreService } from '../../../core/services/firestore.service';
import { StorageService } from '../../../core/services/storage.service';
import { Book } from '../../../core/models/book.model';

@Injectable({
  providedIn: 'root',
})
export class BookService {
  constructor(
    private firestoreService: FirestoreService,
    private storageService: StorageService
  ) {}

  async createBook(
    book: Book,
    imageFile: File,
    pdfFile: File
  ): Promise<string> {
    const bookId = (await this.firestoreService.generateId('student_exam')).id;

    const imageUrl = await this.storageService.uploadBookImage(
      imageFile,
      bookId
    );
    const pdfUrl = await this.storageService.uploadBookPdf(pdfFile, bookId);

    const newBook: Book = {
      ...book,
      id: bookId,
      imageUrl,
      pdfUrl,
    };

    await this.firestoreService.addToCollection('books', newBook);
    return bookId;
  }

  async updateBook(
    book: Book,
    imageFile?: File,
    pdfFile?: File
  ): Promise<void> {
    if (imageFile) {
      book.imageUrl = await this.storageService.uploadBookImage(
        imageFile,
        book.id
      );
    }
    if (pdfFile) {
      book.pdfUrl = await this.storageService.uploadBookPdf(pdfFile, book.id);
    }
    await this.firestoreService.updateDocument('books', book.id, book);
  }

  async deleteBook(bookId: string): Promise<void> {
    await this.firestoreService.deleteDocument('books', bookId);
    // Você pode adicionar lógica para deletar as imagens e PDFs do Storage aqui
  }

  getBooksByCourseId(courseId: string): Promise<Book[]> {
    return this.firestoreService.getDocumentsByArrayItemId(
      'course_books',
      'courseId',
      courseId
    );
  }

  async addBookToCourse(courseId: string, bookId: string): Promise<void> {
    await this.firestoreService.addToCollectionWithId(
      'course_books',
      courseId,
      { bookId }
    );
  }

  async removeBookFromCourse(courseId: string, bookId: string): Promise<void> {
    const courseBooks = await this.firestoreService.getDocument(
      'course_books',
      courseId
    );
    const updatedBooks = courseBooks.bookIds.filter(
      (id: string) => id !== bookId
    );
    await this.firestoreService.updateDocument('course_books', courseId, {
      bookIds: updatedBooks,
    });
  }
}
