import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-course-carrossel',
  standalone: true,
  imports: [],
  templateUrl: './course-carrossel.component.html',
  styleUrl: './course-carrossel.component.scss'
})
export class CourseCarrosselComponent implements AfterViewInit {
  @ViewChild('carouselContent') carouselContent!: ElementRef;
  currentIndex = 0;
  totalItems = 0;

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
    const centerOffset = window.innerWidth / 2;
    const cardWidth = 320; // Largura do card + margem

    items.forEach((item: any, index: number) => {
      let distance = (index - this.currentIndex + this.totalItems) % this.totalItems;
      if (distance > this.totalItems / 2) distance -= this.totalItems;

      // Calcula a posição X considerando o loop
      const translateX = distance * cardWidth;

      // Aplica as transformações
      item.style.transform = `
        translateX(${translateX}px)
        scale(${distance === 0 ? 1.1 : 0.8})
        translateZ(${distance === 0 ? '50px' : '0'})
      `;

      // Ajusta visibilidade e blur
      item.style.filter = distance === 0 ? 'blur(0)' : 'blur(2px)';
      item.style.opacity = Math.abs(distance) <= 1 ? '1' : '0.3';
      item.style.zIndex = distance === 0 ? '1' : '0';
      item.style.transition = 'all 0.5s ease';
    });
  }
}
