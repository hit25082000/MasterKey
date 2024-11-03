import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss'
})
export class FaqComponent {
  activeFaq = signal<number>(-1);

  toggleFaq(index: number) {
    this.activeFaq.set(this.activeFaq() === index ? -1 : index);
  }
}
