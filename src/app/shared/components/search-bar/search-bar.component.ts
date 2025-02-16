import { CommonModule } from '@angular/common';
import { Component, OnInit, input, Output, signal, WritableSignal, computed } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit {
  dataList = input<any[]>(['']);
  searchKeys = input<string[]>(['']);
  searchControl = new FormControl('');
  searchValue = signal<string>('');

  filteredList = computed(() => {   
    if (!this.searchValue()) {
      return this.dataList();
    }

    return this.dataList().filter(item => {
      if (!item) return false;
      
      return this.searchKeys().some(key => {
        const value = item[key];
        if (!value) return false;
        return value.toString().toLowerCase().includes(this.searchValue().toLowerCase());
      });
    });
  });

  filter() {
    this.searchValue.set(this.searchControl.value?.toLowerCase() || '');
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe(value => {
      this.filter();
    });
  }
}
