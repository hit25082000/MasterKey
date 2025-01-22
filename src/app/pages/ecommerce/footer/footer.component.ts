import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment.development';

interface ContactInformation{
  email: string,
  tel: string,
  loc: string,
  city: string,
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {
  contactInfo : ContactInformation = {
    email: environment.email,
    tel: environment.tel,
    loc: environment.loc,
    city: environment.city,
  } 
}
