import { Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Book } from '../../../../core/models/book.model';
import { BookService } from '../../services/book.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { BookUpdate } from '../../services/book.service';

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
        }
      </div>
    </div>

    <app-modal #bookModal [title]="modalTitle()">
      @if (bookForm()) {
        <form [formGroup]="bookForm()" (ngSubmit)="submitBook()">
          <div class="form-group">
            <label for="name">Nome do Livro *</label>
            <input type="text" id="name" formControlName="name" class="form-control">
            @if (bookForm().get('name')?.errors && bookForm().get('name')?.touched) {
              <div class="error-message">
                @if (bookForm().get('name')?.errors?.['required']) {
                  <span>O nome do livro é obrigatório</span>
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="author">Autor *</label>
            <input type="text" id="author" formControlName="author" class="form-control">
            @if (bookForm().get('author')?.errors && bookForm().get('author')?.touched) {
              <div class="error-message">
                @if (bookForm().get('author')?.errors?.['required']) {
                  <span>O autor é obrigatório</span>
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="year">Ano</label>
            <input type="number" id="year" formControlName="year" class="form-control">
            @if (bookForm().get('year')?.errors && bookForm().get('year')?.touched) {
              <div class="error-message">
                @if (bookForm().get('year')?.errors?.['min']) {
                  <span>O ano deve ser maior que 1800</span>
                }
                @if (bookForm().get('year')?.errors?.['max']) {
                  <span>O ano não pode ser maior que o ano atual</span>
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="pages">Número de Páginas</label>
            <input type="number" id="pages" formControlName="pages" class="form-control">
            @if (bookForm().get('pages')?.errors && bookForm().get('pages')?.touched) {
              <div class="error-message">
                @if (bookForm().get('pages')?.errors?.['min']) {
                  <span>O número de páginas deve ser maior que 0</span>
                }
              </div>
            }
          </div>

          <div class="form-group">
            <label for="image">Imagem da Capa {{ !isEditing() ? '*' : '' }}</label>
            <input 
              type="file" 
              id="image" 
              (change)="onImageSelected($event)" 
              accept="image/*" 
              class="form-control"
              [required]="!isEditing()"
            >
          </div>

          <div class="form-group">
            <label for="pdf">Arquivo PDF {{ !isEditing() ? '*' : '' }}</label>
            <input 
              type="file" 
              id="pdf" 
              (change)="onPdfSelected($event)" 
              accept="application/pdf" 
              class="form-control"
              [required]="!isEditing()"
            >
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="closeModal()">Cancelar</button>
            <button 
              type="submit" 
              class="btn-submit" 
              [disabled]="isSubmitDisabled()"
            >
              {{ isEditing() ? 'Atualizar' : 'Criar' }}
            </button>
          </div>
        </form>
      }
    </app-modal>
  `,
  styles: [`
    .library-container {
      padding: 20px;
    }

    .library-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .btn-add {
      padding: 10px 20px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .books-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .book-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
      transition: transform 0.2s;
      background: white;
    }

    .book-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }

    .book-image {
      height: 200px;
      overflow: hidden;
    }

    .book-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .book-content {
      color: black;
      padding: 15px;
    }

    .book-info {
      display: flex;
      gap: 10px;
      margin: 10px 0;
      color: #666;
    }

    .book-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .btn-view, .btn-edit, .btn-delete {
      padding: 8px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .btn-view {
      background-color: #4CAF50;
      color: white;
    }

    .btn-edit {
      background-color: #2196F3;
      color: white;
    }

    .btn-delete {
      background-color: #f44336;
      color: white;
    }

    .form-group {
      color: black;
      margin-bottom: 15px;
    }

    .form-control {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
    }

    .error-message {
      color: #f44336;
      font-size: 12px;
      margin-top: 4px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    .btn-cancel {
      padding: 8px 16px;
      background-color: #9e9e9e;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-submit {
      padding: 8px 16px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-submit:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }

    label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }
  `]
})
export class LibraryListComponent {
  private readonly bookService = inject(BookService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);

  @ViewChild('bookModal') bookModal!: ModalComponent;

  // Signals
  readonly books = this.bookService.books;
  readonly modalTitle = signal<string>('Adicionar Novo Livro');
  readonly isEditing = signal<boolean>(false);
  readonly bookForm = signal<FormGroup>(this.createBookForm());
  
  private selectedImageFile = signal<File | null>(null);
  private selectedPdfFile = signal<File | null>(null);
  private editingBookId = signal<string | null>(null);

  private createBookForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [Validators.required]],
      author: ['', [Validators.required]],
      year: [null, [Validators.min(1800), Validators.max(new Date().getFullYear())]],
      pages: [null, [Validators.min(1)]],
    });
  }

  openBookForm(): void {
    this.resetForm();
    this.modalTitle.set('Adicionar Novo Livro');
    this.isEditing.set(false);
    this.bookModal.toggle();
  }

  editBook(book: Book): void {
    this.resetForm();
    this.modalTitle.set('Editar Livro');
    this.bookForm.set(this.formBuilder.group({
      name: [book.name, [Validators.required]],
      author: [book.author, [Validators.required]],
      year: [book.year, [Validators.min(1800), Validators.max(new Date().getFullYear())]],
      pages: [book.pages, [Validators.min(1)]],
    }));
    this.isEditing.set(true);
    this.editingBookId.set(book.id);
    this.bookModal.toggle();
  }

  deleteBook(book: Book) {
    this.confirmationService.confirm({
      header: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir este livro?',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await this.bookService.deleteBook(book.id!);
          this.notificationService.success('Livro excluído com sucesso');
        } catch (error) {
          console.error('Erro ao deletar livro:', error);
          this.notificationService.error('Erro ao excluir livro');
        }
      }
    });
  }

  async submitBook(): Promise<void> {
    if (this.bookForm().invalid) {
      this.notificationService.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const formValue = this.bookForm().value;

    try {
      if (this.isEditing()) {
        if (!this.editingBookId()) {
          throw new Error('ID do livro não encontrado');
        }

        const updateData: BookUpdate = {
          ...formValue,
          imageFile: this.selectedImageFile(),
          pdfFile: this.selectedPdfFile()
        };

        await this.bookService.updateBook(this.editingBookId()!, updateData);
        this.notificationService.success('Livro atualizado com sucesso');
      } else {
        if (!this.selectedImageFile() || !this.selectedPdfFile()) {
          this.notificationService.error('Por favor, selecione a imagem e o PDF do livro');
          return;
        }

        await this.bookService.createBook(
          formValue,
          this.selectedImageFile()!,
          this.selectedPdfFile()!
        );
        this.notificationService.success('Livro criado com sucesso');
      }

      this.closeModal();
    } catch (error) {
      // Erro já tratado no serviço
    }
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedImageFile.set(file);
    }
  }

  onPdfSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedPdfFile.set(file);
    }
  }

  closeModal(): void {
    this.resetForm();
    this.bookModal.toggle();
  }

  private resetForm(): void {
    this.bookForm.set(this.createBookForm());
    this.selectedImageFile.set(null);
    this.selectedPdfFile.set(null);
    this.editingBookId.set(null);
  }

  isSubmitDisabled(): boolean {
    if (this.isEditing()) {
      return this.bookForm().invalid;
    } else {
      return this.bookForm().invalid || !this.selectedImageFile() || !this.selectedPdfFile();
    }
  }
}
