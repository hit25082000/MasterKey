import { CommonModule } from '@angular/common';
import { Component, OnInit, input, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchBarComponent } from '../search-bar/search-bar.component';

@Component({
  selector: 'app-generic-selector',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchBarComponent],
  templateUrl: './generic-selector.component.html',
  styleUrls: ['./generic-selector.component.scss']
})
export class GenericSelectorComponent implements OnInit {
  items = input<any[]>([]);
  selectedIds = input<string[]>([]);
  displayProperty = input<string>('name');
  idProperty = input<string>('id');
  selectionChange = output<string[]>();

  filteredItems = signal<any[]>([]);

  selectedItems = computed(() => {
    return this.items().filter(item => this.selectedIds().includes(item[this.idProperty()]));
  });

  ngOnInit() {
    this.filteredItems.set(this.items());
  }

  isSelected(item: any): boolean {
    return this.selectedIds().includes(item[this.idProperty()]);
  }

  onCheckboxChange(item: any, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const itemId = item[this.idProperty()];

    let newSelectedIds: string[];
    if (checkbox.checked) {
      newSelectedIds = [...this.selectedIds(), itemId];
    } else {
      newSelectedIds = this.selectedIds().filter(id => id !== itemId);
    }

    this.selectionChange.emit(newSelectedIds);
  }
}
