import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports:[CommonModule],
  templateUrl: 'modal.component.html',
  styleUrls: ['modal.component.scss'],
})
export class ModalComponent {
  show: boolean = false;

  toggle () {
    this.show = !this.show;
  }
}
