import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, input, inject, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../../../core/models/category.model';

@Component({
  selector: 'app-category-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-selector.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategorySelectorComponent),
      multi: true
    }
  ]
})
export class CategorySelectorComponent implements OnInit, ControlValueAccessor {
  allCategory = signal<Category[]>([]);
  selectedCategoryId = signal<string>('');
  categoryService = inject(CategoryService);
  defaultCategoryId = input<string>('');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  async ngOnInit() {
    await this.loadallCategory();

    if (this.defaultCategoryId()) {
      const category = this.allCategory().find(c => c.id === this.defaultCategoryId());
      if (category) {
        this.writeValue(category.id);
      }
    }
  }

  async loadallCategory() {
    this.allCategory.set(await this.categoryService.getAll());
  }

  onSelectCategory(category: Category): void {
    this.selectedCategoryId.set(category.id);
    this.onChange(category.id);
    this.onTouched();
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    if (value) {
      this.selectedCategoryId.set(value);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    // Implementar se necessário
  }
}
