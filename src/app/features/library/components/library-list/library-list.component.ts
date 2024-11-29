import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Book } from '../../../../core/models/book.model';
import { BookService } from '../../services/book.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-library-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ModalComponent, ReactiveFormsModule],
  template: `
    <div class="library-container">
      <div class="library-header">
        <h2>Biblioteca</h2>
        <button class="btn-add" (click)="openBookForm()">
          <i class="fas fa-plus"></i>
          Adicionar Livro
        </button>
      </div>

      <div class="books-grid">
        @for (book of books(); track book.id) {
          <div class="book-card">
            <div class="book-image">
              <img [src]="book.imageUrl || 'assets/images/default-book.jpg'" [alt]="book.title">
            </div>
            <div class="book-content">
              <h3>{{ book.title }}</h3>
              <p class="author">{{ book.author }}</p>
              <div class="book-info">
                @if (book.year) {
                  <span><i class="fas fa-calendar"></i> {{ book.year }}</span>
                }
                @if (book.pages) {
                  <span><i class="fas fa-book"></i> {{ book.pages }} páginas</span>
                }
              </div>
              <div class="book-actions">
                <a [href]="book.pdfUrl" target="_blank" class="btn-view">
                  <i class="fas fa-eye"></i>
                  Visualizar PDF
                </a>
                <button class="btn-edit" (click)="editBook(book)">
                  <i class="fas fa-edit"></i>
                  Editar
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="no-books">
            <i class="fas fa-books"></i>
            <p>Nenhum livro cadastrado</p>
          </div>
        }
      </div>
    </div>

    <app-modal #bookModal>
      <div class="book-form">
        <h3>{{ selectedBook() ? 'Editar Livro' : 'Novo Livro' }}</h3>
        <form [formGroup]="bookForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="title">Título</label>
            <input id="title" type="text" formControlName="title">
          </div>

          <div class="form-group">
            <label for="author">Autor</label>
            <input id="author" type="text" formControlName="author">
          </div>

          <div class="form-group">
            <label for="year">Ano</label>
            <input id="year" type="number" formControlName="year">
          </div>

          <div class="form-group">
            <label for="pages">Páginas</label>
            <input id="pages" type="number" formControlName="pages">
          </div>

          <div class="form-group">
            <label for="description">Descrição</label>
            <textarea id="description" formControlName="description"></textarea>
          </div>

          <div class="form-group">
            <label for="isbn">ISBN</label>
            <input id="isbn" type="text" formControlName="isbn">
          </div>

          <div class="form-group">
            <label for="publisher">Editora</label>
            <input id="publisher" type="text" formControlName="publisher">
          </div>

          <div class="form-group">
            <label for="language">Idioma</label>
            <input id="language" type="text" formControlName="language">
          </div>

          <div class="form-group">
            <label for="category">Categoria</label>
            <input id="category" type="text" formControlName="category">
          </div>

          <div class="form-group">
            <label for="image">Imagem da Capa</label>
            <input id="image" type="file" (change)="onImageSelected($event)" accept="image/*">
          </div>

          <div class="form-group">
            <label for="pdf">Arquivo PDF</label>
            <input id="pdf" type="file" (change)="onPdfSelected($event)" accept="application/pdf">
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="closeModal()">Cancelar</button>
            <button type="submit" class="btn-submit" [disabled]="!bookForm.valid || (!selectedBook() && (!selectedImage || !selectedPdf))">
              {{ selectedBook() ? 'Atualizar' : 'Criar' }}
            </button>
          </div>
        </form>
      </div>
    </app-modal>
  `,
  styleUrls: ['./library-list.component.scss']
})
export class LibraryListComponent implements OnInit {
  private bookService = inject(BookService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  @ViewChild('bookModal') bookModal!: ModalComponent;

  books = signal<Book[]>([]);
  selectedBook = signal<Book | null>(null);
  selectedImage: File | null = null;
  selectedPdf: File | null = null;

  bookForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    author: ['', Validators.required],
    year: [null],
    pages: [null],
    description: [''],
    isbn: [''],
    publisher: [''],
    language: [''],
    category: ['']
  });

  ngOnInit() {
    this.loadBooks();
  }

  async loadBooks() {
    try {
      const books = await this.bookService.getAllBooks();
      this.books.set(books);
    } catch (error) {
      this.notificationService.error('Erro ao carregar livros');
      console.error(error);
    }
  }

  openBookForm() {
    this.selectedBook.set(null);
    this.bookForm.reset();
    this.selectedImage = null;
    this.selectedPdf = null;
    this.bookModal.toggle();
  }

  editBook(book: Book) {
    this.selectedBook.set(book);
    this.bookForm.patchValue({
      title: book.title,
      author: book.author,
      year: book.year,
      pages: book.pages,
      description: book.description,
      isbn: book.isbn,
      publisher: book.publisher,
      language: book.language,
      category: book.category
    });
    this.bookModal.toggle();
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.selectedImage = file;
    } else {
      this.notificationService.error('Por favor, selecione uma imagem válida');
      event.target.value = '';
    }
  }

  onPdfSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedPdf = file;
    } else {
      this.notificationService.error('Por favor, selecione um arquivo PDF válido');
      event.target.value = '';
    }
  }

  async onSubmit() {
    if (this.bookForm.valid) {
      try {
        const bookData = this.bookForm.value;

        if (this.selectedBook()) {
          await this.bookService.updateBook(
            { ...this.selectedBook(), ...bookData },
            this.selectedImage || undefined,
            this.selectedPdf || undefined
          );
          this.notificationService.success('Livro atualizado com sucesso');
        } else {
          if (!this.selectedImage || !this.selectedPdf) {
            this.notificationService.error('Por favor, selecione uma imagem e um PDF');
            return;
          }
          await this.bookService.createBook(
            bookData,
            this.selectedImage,
            this.selectedPdf
          );
          this.notificationService.success('Livro criado com sucesso');
        }

        this.closeModal();
        this.loadBooks();
      } catch (error) {
        this.notificationService.error('Erro ao salvar livro');
        console.error(error);
      }
    }
  }

  closeModal() {
    this.bookModal.toggle();
    this.selectedBook.set(null);
    this.bookForm.reset();
    this.selectedImage = null;
    this.selectedPdf = null;
  }
}
