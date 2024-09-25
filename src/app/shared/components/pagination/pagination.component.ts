import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav aria-label="Navegação de página">
      <ul class="pagination">
        <li class="page-item" [class.disabled]="currentPage === 1">
          <a
            class="page-link"
            (click)="onPageChange(currentPage - 1)"
            aria-label="Anterior"
          >
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
        @for (page of pages; track page) {
        <li class="page-item" [class.active]="page === currentPage">
          <a class="page-link" (click)="onPageChange(page)">{{ page }}</a>
        </li>
        }
        <li class="page-item" [class.disabled]="currentPage === totalPages">
          <a
            class="page-link"
            (click)="onPageChange(currentPage + 1)"
            aria-label="Próximo"
          >
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      </ul>
    </nav>
  `,
  styles: [
    `
      .pagination {
        display: flex;
        padding-left: 0;
        list-style: none;
      }
      .page-item {
        cursor: pointer;
      }
      .page-link {
        position: relative;
        display: block;
        padding: 0.5rem 0.75rem;
        margin-left: -1px;
        line-height: 1.25;
        color: #007bff;
        background-color: #fff;
        border: 1px solid #dee2e6;
      }
      .page-item.active .page-link {
        z-index: 3;
        color: #fff;
        background-color: #007bff;
        border-color: #007bff;
      }
      .page-item.disabled .page-link {
        color: #6c757d;
        pointer-events: none;
        cursor: auto;
        background-color: #fff;
        border-color: #dee2e6;
      }
    `,
  ],
})
export class PaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() pageSize: number = 10;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get pages(): number[] {
    const pageCount = Math.min(5, this.totalPages);
    const startPage = Math.max(1, this.currentPage - Math.floor(pageCount / 2));
    const endPage = Math.min(this.totalPages, startPage + pageCount - 1);
    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
