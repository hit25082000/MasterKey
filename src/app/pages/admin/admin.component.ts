import { Component } from '@angular/core';
import { SidenavComponent } from '../../shared/components/sidenav/sidenav.component';
import { RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [SidenavComponent, RouterOutlet, NgClass],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent {
  expanded = false

  expandSidenav(expand : boolean) {
    this.expanded = expand;
  }
}
