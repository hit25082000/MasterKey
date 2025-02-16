import {
  Component,
  OnInit,
  signal,
  computed,
  input,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { BookService } from '../../services/book.service';
import { CourseManagementService } from '../../../course/services/course-management.service';
import { CourseService } from '../../../course/services/course.service';
import { Book } from '../../../../core/models/book.model';
import { NotificationService } from '../../../../shared/services/notification.service';
import { LoadingService } from '../../../../shared/services/loading.service';

@Component({
  selector: 'app-book-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent],
  template: `
    <div class="book-selector">
      <div class="selector-header">
        <h3>Selecionar Livros</h3>
      </div>

      @if (loading.isLoading()) {
        <div class="loading-container">
          <div class="loading-spinner"></div>
          <p>Carregando livros...</p>
        </div>
      } @else {
        <app-search-bar
          [dataList]="allBooks()"
          [searchKeys]="['name', 'author']"
          #searchBarComponent
        ></app-search-bar>

        <div class="books-grid">
          @for (book of searchBarComponent.filteredList(); track book.id) {
            <div class="book-item">
              <label class="book-checkbox">
                <input
                  type="checkbox"
                  [checked]="selectedBookIds().has(book.id)"
                  (change)="onCheckboxChange(book.id, $event)"
                />
                <div class="book-info">
                  <img [src]="book.imageUrl || 'assets/images/default-book.jpg'" class="book-image" [alt]="book.name">
                  <div class="book-details">
                    <h4>{{ book.name }}</h4>
                    <p>{{ book.author }}</p>
                    @if (book.year) {
                      <span class="book-year">{{ book.year }}</span>
                    }
                  </div>
                </div>
              </label>
            </div>
          }
        </div>

        @if (selectedBooks().length > 0) {
          <div class="selected-books">
            <h4>Livros Selecionados ({{ selectedBooks().length }})</h4>
            <div class="selected-books-list">
              @for (book of selectedBooks(); track book.id) {
                <div class="selected-book-item">
                  <img [src]="book.imageUrl || 'assets/images/default-book.jpg'" class="book-image" [alt]="book.name">
                  <div class="book-details">
                    <h5>{{ book.name }}</h5>
                    <p>{{ book.author }}</p>
                  </div>
                  <button class="btn-remove" (click)="removeBook(book.id)">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              }
            </div>
          </div>
        }

        <div class="actions">
          <button 
            class="btn-save" 
            (click)="updateCourseBooks()" 
            [disabled]="isSaving()"
          >
            <i class="fas fa-save"></i>
            {{ isSaving() ? "Salvando..." : "Salvar Alterações" }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .book-selector {
      padding: 20px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid var(--border);
      border-top: 4px solid var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .book-image {
      max-width: 60px;
      max-height: 80px;
      object-fit: cover;
      border-radius: 4px;
    }

    .selector-header {
      margin-bottom: 20px;
    }

    .books-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .book-item {
      border: 1px solid #ddd;
      border-radius: 8px;
      overflow: hidden;
    }

    .book-checkbox {
      display: flex;
      cursor: pointer;
      padding: 10px;
    }

    .book-info {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .book-info img {
      width: 60px;
      height: 80px;
      object-fit: cover;
      border-radius: 4px;
    }

    .book-details {
      flex: 1;
    }

    .book-details h4 {
      margin: 0 0 5px;
      font-size: 16px;
    }

    .book-details p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .book-year {
      font-size: 12px;
      color: #888;
    }

    .selected-books {
      margin-top: 30px;
    }

    .selected-books-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .selected-book-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 6px;
    }

    .btn-remove {
      padding: 5px;
      background: none;
      border: none;
      color: #f44336;
      cursor: pointer;
    }

    .actions {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }

    .btn-save {
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

    .btn-save:disabled {
      background: #cccccc;
      cursor: not-allowed;
    }
  `]
})
export class BookSelectorComponent implements OnInit {
  courseId = input<string>('');  
  // Services
  private readonly bookService = inject(BookService);
  private readonly courseManagementService = inject(CourseManagementService);
  private readonly courseService = inject(CourseService);
  private readonly notificationService = inject(NotificationService);
  protected readonly loading = inject(LoadingService);

  // Signals
  readonly allBooks = signal<Book[]>([]);
  readonly selectedBookIds = signal<Set<string>>(new Set());
  readonly isSaving = signal(false);

  // Computed
  readonly selectedBooks = computed(() => 
    this.allBooks().filter(book => this.selectedBookIds().has(book.id))
  );

  constructor() {}

  async ngOnInit() {
    this.loading.show();
    try {
      await this.loadAllBooks();
      if (this.courseId()) {
        await this.loadCourseBooks();
      }
    } catch (error) {
      console.error('Erro ao carregar livros:', error);
      this.notificationService.error('Erro ao carregar livros');
    } finally {
      this.loading.hide();
    }
  }

  private async loadAllBooks(): Promise<void> {
    const books = await this.bookService.getAll();
    this.allBooks.set(books!);
  }

  private async loadCourseBooks(): Promise<void> {
    const books = await this.courseService.getBooks(this.courseId());
    if (books) {
      this.selectedBookIds.set(new Set(books));
    }
  }

  onCheckboxChange(bookId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const updatedSelection = new Set(this.selectedBookIds());
    
    checkbox.checked
      ? updatedSelection.add(bookId)
      : updatedSelection.delete(bookId);
    
    this.selectedBookIds.set(updatedSelection);
  }

  async updateCourseBooks(): Promise<void> {
    if (!this.courseId()) return;

    this.isSaving.set(true);

    try {
      await this.courseManagementService.updateCourseBooks(
        this.courseId(),
        Array.from(this.selectedBookIds())
      );

      this.notificationService.success('Livros atualizados com sucesso');
      await this.loadAllBooks();
      await this.loadCourseBooks();
    } catch (error) {
      console.error('Erro ao atualizar livros:', error);
      this.notificationService.error('Erro ao atualizar livros');
    } finally {
      this.isSaving.set(false);
    }
  }

  removeBook(bookId: string): void {
    const updatedSelection = new Set(this.selectedBookIds());
    updatedSelection.delete(bookId);
    this.selectedBookIds.set(updatedSelection);
  }
}