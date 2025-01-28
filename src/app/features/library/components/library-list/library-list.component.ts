import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Book } from '../../../../core/models/book.model';
import { BookService } from '../../services/book.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-library-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ModalComponent, ReactiveFormsModule, ConfirmationDialogComponent],
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
              <img [src]="book.imageUrl || 'assets/images/default-book.jpg'" [alt]="book.name">
            </div>
            <div class="book-content">
              <h3>{{ book.name }}</h3>
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
                <button class="btn-delete" (click)="deleteBook(book)">
                  <i class="fas fa-trash"></i>
                  Excluir
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
  styles: [`
    .library-container {
      padding: 2rem;
    }

    .library-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h2 {
        font-size: 1.75rem;
        color: var(--text-color);
        margin: 0;
      }

      .btn-add {
        background-color: var(--primary-color);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: var(--primary-600);
        }

        i {
          font-size: 1rem;
        }
      }
    }

    .books-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 2rem;
    }

    .book-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    }

    .book-image {
      width: 100%;
      height: 200px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s;

        &:hover {
          transform: scale(1.05);
        }
      }
    }

    .book-content {
      padding: 1.5rem;

      h3 {
        margin: 0 0 0.5rem;
        color: var(--text-color);
        font-size: 1.25rem;
      }

      .author {
        color: var(--text-color-secondary);
        margin: 0 0 1rem;
        font-size: 0.9rem;
      }

      .book-info {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;

        span {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--text-color-secondary);
          font-size: 0.875rem;

          i {
            color: var(--primary-color);
          }
        }
      }
    }

    .book-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;

      button, .btn-view {
        flex: 1;
        min-width: 100px;
        padding: 0.6rem 1rem;
        border: none;
        border-radius: 6px;
        font-weight: 500;
        font-size: 0.875rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: all 0.2s;
        text-decoration: none;

        i {
          font-size: 0.875rem;
        }
      }

      .btn-view {
        background-color: var(--primary-color);
        color: white;

        &:hover {
          background-color: var(--primary-600);
        }
      }

      .btn-edit {
        background-color: var(--success-color);
        color: white;

        &:hover {
          background-color: var(--success-600);
        }
      }

      .btn-delete {
        background-color: var(--danger-color);
        color: white;

        &:hover {
          background-color: var(--danger-600);
        }
      }
    }

    .no-books {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      i {
        font-size: 3rem;
        color: var(--text-color-secondary);
        margin-bottom: 1rem;
      }

      p {
        color: var(--text-color);
        margin: 0 0 1.5rem;
        font-size: 1.1rem;
      }

      .btn-add {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background-color: var(--primary-color);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;

        &:hover {
          background-color: var(--primary-600);
        }

        i {
          font-size: 1rem;
          color: white;
          margin: 0;
        }
      }
    }

    // Estilos do Modal
    .book-form {
      padding: 1.5rem;

      h3 {
        margin: 0 0 1.5rem;
        color: var(--text-color);
        font-size: 1.5rem;
      }

      .form-group {
        margin-bottom: 1.25rem;

        label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--text-color);
          font-weight: 500;
        }

        input, textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--surface-border);
          border-radius: 6px;
          font-size: 0.9rem;
          transition: border-color 0.2s;

          &:focus {
            outline: none;
            border-color: var(--primary-color);
          }
        }

        textarea {
          min-height: 100px;
          resize: vertical;
        }
      }

      .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;

        button {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;

          &.btn-cancel {
            background-color: var(--surface-hover);
            color: var(--text-color);

            &:hover {
              background-color: var(--surface-ground);
            }
          }

          &.btn-submit {
            background-color: var(--primary-color);
            color: white;

            &:hover:not(:disabled) {
              background-color: var(--primary-600);
            }

            &:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
          }
        }
      }
    }
  `]
})
export class LibraryListComponent implements OnInit {
  private bookService = inject(BookService);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private confirmationService = inject(ConfirmationService);

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
      title: book.name,
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

  deleteBook(book: Book) {
    this.confirmationService.confirm({
      header: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir este livro?',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.bookService.deleteBook(book.id!);
          this.books.set(this.books().filter(b => b.id !== book.id));
          this.notificationService.success('Livro excluído com sucesso');
        } catch (error) {
          console.error('Erro ao deletar livro:', error);
          this.notificationService.error('Erro ao excluir livro');
        }
      }
    });
  }
}
