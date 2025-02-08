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
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-book-selector',
  standalone: true,
  imports: [CommonModule, SearchBarComponent, ReactiveFormsModule],
  templateUrl: './book-selector.component.html',
  styleUrls: ['./book-selector.component.scss'],
})
export class BookSelectorComponent implements OnInit {
  courseId = input<string>('');
  allBooks = signal<Book[]>([]);
  selectedBookIds = signal<Set<string>>(new Set());

  private bookService = inject(BookService);
  private courseManagementService = inject(CourseManagementService);
  private courseService = inject(CourseService);
  private notificationService = inject(NotificationService);

  selectedBooks = computed(() => {
    return this.allBooks().filter((book) =>
      this.selectedBookIds().has(book.id)
    );
  });

  nonSelectedBooks = computed(() => {
    return this.allBooks().filter(
      (book) => !this.selectedBookIds().has(book.id)
    );
  });

  isSaving = signal(false);

  newBookForm: FormGroup;

  constructor(
    private fb: FormBuilder,
  ) {
    this.newBookForm = this.fb.group({
      name: ['', Validators.required],
      image: ['', Validators.required],
      url: ['', Validators.required],
    });
  }

  async ngOnInit() {
    await this.loadAllBooks();
    if (this.courseId()) {
      await this.loadCourseBooks();
    }
  }

  private async loadAllBooks() {
    this.allBooks.set(await this.bookService.getAllBooks());
  }

  private async loadCourseBooks() {
    const books = await this.courseService.getBooks(this.courseId());
    if (books != undefined) {
      this.selectedBookIds.set(new Set(Array.from(books) || []));
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

  async updateCourseBooks() {
    const courseId = this.courseId();
    if (!courseId) return;

    this.isSaving.set(true);

    try {
      await this.courseManagementService.updateCourseBooks(
        courseId,
        Array.from(this.selectedBookIds())
      );

      this.notificationService.success(
        'Apostilas atualizadas com sucesso',
        1
      );
      await this.loadAllBooks();
      await this.loadCourseBooks();
    } catch (error) {
      this.notificationService.success(
        'Erro ao atualizar apostilas',
        1
      );
    } finally {
      this.isSaving.set(false);
    }
  }

  async removeBook(bookId: string) {
    const updatedSelection = new Set(this.selectedBookIds());
    updatedSelection.delete(bookId);
    this.selectedBookIds.set(updatedSelection);
  }

  async addNewBook() {
    if (this.newBookForm.valid) {
      try {
        const newBook: Book = {
          id: '', // Será preenchido pelo serviço
          ...this.newBookForm.value,
          active: true
        };

        const addedBook = await this.bookService.add(newBook);
        
        // Atualiza a lista local com a nova apostila
        const currentBooks = this.allBooks();
        this.allBooks.set([...currentBooks, addedBook]);
        
        this.newBookForm.reset();
        this.notificationService.success('Nova apostila adicionada com sucesso');
      } catch (error) {
        console.error('Erro ao adicionar apostila:', error);
        this.notificationService.error('Erro ao adicionar nova apostila');
      }
    } else {
      this.notificationService.error('Por favor, preencha todos os campos obrigatórios');
    }
  }
}
