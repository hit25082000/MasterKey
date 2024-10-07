import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, input, inject, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../../../core/models/category.model';

@Component({
  selector: 'app-category-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-selector.component.html',
  styleUrls: ['./category-selector.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CategorySelectorComponent),
    multi: true,
  }]
})
export class CategorySelectorComponent implements OnInit {
  allCategory = signal<Category[]>([]);
  selectedCategoryId = signal<string>('');
  categoryService = inject(CategoryService)
  defaultCategoryId = input<string>('');

  selectedClasses = computed(() => {
    return this.allCategory().filter(studentClass => this.selectedCategoryId().includes(studentClass.id));
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  async ngOnInit() {
    if(this.defaultCategoryId()){
      this.autoSelect(this.defaultCategoryId())
    }
    await this.loadallCategory();
  }

  async loadallCategory() {
    this.allCategory.set(await this.categoryService.getAll());
  }

  autoSelect(defaultSelect : string){
    this.selectedCategoryId.set(defaultSelect)
    this.onChange(defaultSelect);
  }

  onSelectCategory(categoryId: string): void {
    this.selectedCategoryId.set(categoryId);
    this.onChange(categoryId);
  }

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
    // Implementar lógica de desabilitação, se necessário
  }
}