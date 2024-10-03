import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { WhatsAppMessageComponent } from '../../../features/chat/components/whats-app-message/whats-app-message.component';

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [RouterLink, CommonModule, ModalComponent, WhatsAppMessageComponent],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent {
  @Output() expanded = new EventEmitter<boolean>();
  isExpanded = false;
  dropdownState: { [key: string]: boolean } = {};

  expandSidenav() {
    this.isExpanded = true;
    this.expanded.emit(true);
  }

  collapseSidenav() {
    const allClosed = Object.values(this.dropdownState).every(
      (state) => state === false
    );

    if (allClosed) {
      this.isExpanded = false;
      this.expanded.emit(false);
    }
  }

  toggleDropdown(dropdown: string) {
    this.dropdownState[dropdown] = !this.dropdownState[dropdown];
  }

  isDropdownOpen(dropdown: string): boolean {
    return this.dropdownState[dropdown];
  }
}
