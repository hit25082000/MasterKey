import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../services/book.service';
import { Book } from '../../../../core/models/book.model';

@Component({
  selector: 'app-book-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div>
      <h3>Livros do Curso</h3>
      <ul>
        <li *ngFor="let book of books">
          {{ book.title }}
          <button (click)="removeBook(book.id)">Remover</button>
        </li>
      </ul>
      <button (click)="openBookSelector()">Adicionar Livro</button>
    </div>
  `,
})
export class BookSelectorComponent implements OnInit {
  @Input() courseId!: string;
  books: Book[] = [];

  constructor(private bookService: BookService) {}

  ngOnInit() {
    this.loadBooks();
  }

  async loadBooks() {
    this.books = await this.bookService.getBooksByCourseId(this.courseId);
  }

  async removeBook(bookId: string) {
    await this.bookService.removeBookFromCourse(this.courseId, bookId);
    this.loadBooks();
  }

  openBookSelector() {
    // Implemente a lógica para abrir um modal ou navegação para selecionar livros
  }
}
