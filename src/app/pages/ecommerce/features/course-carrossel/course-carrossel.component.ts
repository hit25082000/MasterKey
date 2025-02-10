import { Component, ElementRef, ViewChild, AfterViewInit, HostListener, inject } from '@angular/core';
import { Router, ROUTES } from '@angular/router';

@Component({
  selector: 'app-course-carrossel',
  standalone: true,
  imports: [],
  templateUrl: './course-carrossel.component.html',
  styleUrl: './course-carrossel.component.scss'
})
export class CourseCarrosselComponent implements AfterViewInit {
  @ViewChild('carouselContent') carouselContent!: ElementRef;
  router = inject(Router)
  currentIndex = 0;
  totalItems = 0;
  isMobile = window.innerWidth <= 1200;

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 1200;
    this.updateCarousel();
  }

  ngAfterViewInit() {
    this.totalItems = this.carouselContent.nativeElement.children.length;
    this.updateCarousel();
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.totalItems) % this.totalItems;
    this.updateCarousel();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.totalItems;
    this.updateCarousel();
  }

  private updateCarousel() {
    const items = Array.from(this.carouselContent.nativeElement.children);
    const cardWidth = this.isMobile ? 280 : 320; // Ajusta a largura do card baseado no dispositivo

    items.forEach((item: any, index: number) => {
      let distance = (index - this.currentIndex + this.totalItems) % this.totalItems;
      if (distance > this.totalItems / 2) distance -= this.totalItems;
      // Ajusta o posicionamento e escala baseado no dispositivo
      
      var translateX = this.isMobile
      ? '-50%' // Reduz o espaçamento em mobile
      : `calc(-50% - ${distance * cardWidth}px)`;
      var translateY = '-50%';
      
      if (distance === 0) {
        translateX = '-50%';
      }
      
      const scale = this.isMobile
      ? distance === 0 ? 1.2 : 1
      : distance === 0 ? 1.2 : 1;

      const translateZ = this.isMobile
      ? distance === 0 ? '50px' : '0'
      : distance === 0 ? '50px' : '0';
      
      console.log(translateX, translateY);
      // Aplica as transformações
      item.style.transform = `
        translateX(${translateX})
        translateY(${translateY})
        scale(${scale})
        translateZ(${translateZ})
      `;

      // Ajusta visibilidade e blur
      item.style.filter = distance === 0 ? 'blur(0)' : 'blur(2px)';
      item.style.opacity = Math.abs(distance) <= 1 ? '1' : '0.3';
    });
  }

  redirectCourseCarrossel(){
    this.router.navigate(['/products']).then(() => {
      window.scrollTo(0, 0);
    });
  }
}
