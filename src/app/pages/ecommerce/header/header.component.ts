import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GlassEffectDirective } from '../../../shared/directives/glass-effect.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, GlassEffectDirective],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {

}
