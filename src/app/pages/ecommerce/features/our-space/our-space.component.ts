import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

type SlideState = 'previous' | 'current' | 'next';

interface TiltEffect {
  trigger: HTMLElement;
  cleanup: () => void;
}

interface RotationDegrees {
  x: number;
  y: number;
}

interface BackgroundPosition {
  x: number;
  y: number;
}

@Component({
  selector: 'app-our-space',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './our-space.component.html',
  styleUrl: './our-space.component.scss'
})
export class OurSpaceComponent implements OnInit, OnDestroy {
  currentIndex: number = 0;
  private tiltEffects: TiltEffect[] = [];
  
  readonly images: string[] = [
    'assets/ourPlace1.jpg',
    'assets/ourPlace2.jpg',
    'assets/ourPlace3.jpg'
  ];

  readonly titles: string[] = [
    'Sala de Treinamento',
    'Espaço Colaborativo',
    'Área de Estudos'
  ];

  readonly subtitles: string[] = [
    'MasterKey',
    'Ambiente',
    'Tecnologia'
  ];

  readonly descriptions: string[] = [
    'Um espaço projetado para o seu aprendizado',
    'Ambiente colaborativo e inspirador',
    'Tecnologia e conforto para seus estudos'
  ];

  constructor() { }

  ngOnInit(): void {
    setTimeout(() => {
      this.setupTiltEffect();
    }, 100);
  }

  ngOnDestroy(): void {
    this.tiltEffects.forEach(effect => effect.cleanup());
  }

  getSlideState(index: number): SlideState | null {
    const totalSlides = this.images.length;
    
    // Ajusta o índice para lidar com a transição circular
    const normalizedIndex = (index - this.currentIndex + totalSlides) % totalSlides;
    
    if (normalizedIndex === 0) return 'current';
    if (normalizedIndex === 1 || (normalizedIndex === -2 && totalSlides === 3)) return 'next';
    if (normalizedIndex === -1 || (normalizedIndex === 2 && totalSlides === 3)) return 'previous';
    
    return null;
  }

  prevSlide(): void {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.resetTiltEffect();
  }

  nextSlide(): void {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.resetTiltEffect();
  }

  private resetTiltEffect(): void {
    setTimeout(() => this.setupTiltEffect(), 100);
  }

  private setupTiltEffect(): void {
    this.tiltEffects.forEach(effect => effect.cleanup());
    this.tiltEffects = [];

    const currentSlide = document.querySelector('.slide[data-current]') as HTMLElement;
    if (!currentSlide) return;

    const slideInner = currentSlide.querySelector('.slide__inner') as HTMLElement;
    const slideInfo = currentSlide.querySelector('.slide-info') as HTMLElement;

    if (slideInner && slideInfo) {
      const effect = this.addTiltEffect(currentSlide, [slideInner, slideInfo]);
      this.tiltEffects.push(effect);
    }
  }

  private addTiltEffect(trigger: HTMLElement, targets: HTMLElement[]): TiltEffect {
    let rotDeg: RotationDegrees = { x: 0, y: 0 };
    let bgPos: BackgroundPosition = { x: 0, y: 0 };
    let lerpAmount = 0.1;
    let rafId: number | null = null;

    const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

    const animate = (): void => {
      targets.forEach(target => {
        const currentRotX = parseFloat(target.style.getPropertyValue('--rotX') || '0');
        const currentRotY = parseFloat(target.style.getPropertyValue('--rotY') || '0');
        const currentBgX = parseFloat(target.style.getPropertyValue('--bgPosX') || '0');
        const currentBgY = parseFloat(target.style.getPropertyValue('--bgPosY') || '0');

        const newRotX = lerp(currentRotX, rotDeg.y, lerpAmount);
        const newRotY = lerp(currentRotY, rotDeg.x, lerpAmount);
        const newBgX = lerp(currentBgX, bgPos.x, lerpAmount);
        const newBgY = lerp(currentBgY, bgPos.y, lerpAmount);

        target.style.setProperty('--rotX', `${newRotX}deg`);
        target.style.setProperty('--rotY', `${newRotY}deg`);
        target.style.setProperty('--bgPosX', `${newBgX}%`);
        target.style.setProperty('--bgPosY', `${newBgY}%`);
      });

      rafId = requestAnimationFrame(animate);
    };

    const onMouseMove = (e: MouseEvent): void => {
      const rect = trigger.getBoundingClientRect();
      const ox = (e.clientX - rect.left - rect.width * 0.5) / (Math.PI * 3);
      const oy = -(e.clientY - rect.top - rect.height * 0.5) / (Math.PI * 4);

      rotDeg = { x: ox, y: oy };
      bgPos = { x: -ox * 0.3, y: oy * 0.3 };
      lerpAmount = 0.1;

      if (!rafId) {
        rafId = requestAnimationFrame(animate);
      }
    };

    const onMouseLeave = (): void => {
      rotDeg = { x: 0, y: 0 };
      bgPos = { x: 0, y: 0 };
      lerpAmount = 0.06;
    };

    trigger.addEventListener('mousemove', onMouseMove);
    trigger.addEventListener('mouseleave', onMouseLeave);

    rafId = requestAnimationFrame(animate);

    return {
      trigger,
      cleanup: () => {
        trigger.removeEventListener('mousemove', onMouseMove);
        trigger.removeEventListener('mouseleave', onMouseLeave);
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      }
    };
  }
}
