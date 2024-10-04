import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookService } from '../../services/book.service';
import { Book } from '../../../../core/models/book.model';

@Component({
  selector: 'app-library-course',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="library-course">
      <h2>Biblioteca do Curso</h2>
      <div class="book-grid">
        <div *ngFor="let book of books" class="book-card">
          <img [src]="book.imageUrl" [alt]="book.title" />
          <h3>{{ book.title }}</h3>
          <p>{{ book.author }}</p>
          <a [href]="book.pdfUrl" target="_blank">Ver PDF</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .library-course {
        padding: 20px;
      }
      .book-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
      }
      .book-card {
        border: 1px solid #ddd;
        padding: 10px;
        text-align: center;
      }
      .book-card img {
        max-width: 100%;
        height: auto;
      }
    `,
  ],
})
export class LibraryCourseComponent implements OnInit {
  @Input() courseId!: string;
  books: Book[] = [];

  constructor(private bookService: BookService) {}

  ngOnInit() {
    this.loadBooks();
  }

  async loadBooks() {
    this.books = await this.bookService.getBooksByCourseId(this.courseId);
  }
}
