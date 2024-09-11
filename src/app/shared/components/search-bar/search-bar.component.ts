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
  searchControl = new FormControl('');
  searchValue = signal<string>('');

  filteredList = computed(() => {
    return this.dataList().filter(item =>
      JSON.stringify(item).toLowerCase().includes(this.searchValue())
    );
  });

  filter(){
    this.searchValue.set(this.searchControl.value!.toLowerCase())
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.subscribe(() => {
      this.filteredList();
    });
  }
}
