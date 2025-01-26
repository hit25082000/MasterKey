import { Component, inject } from '@angular/core';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss'
})
export class BannerComponent {
  openWhatsApp() {
    const message = encodeURIComponent('Olá! Gostaria de saber mais sobre os cursos.');
    const whatsappUrl = `https://wa.me/${environment.tel}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }

  scrollToFaq(event: Event) {
    event.preventDefault();
    const faqSection = document.getElementById('faq');
    if (faqSection) {
      faqSection.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
