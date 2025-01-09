import { CommonModule } from '@angular/common';
import { Component, Input, ElementRef, OnDestroy, AfterViewInit, inject } from '@angular/core';
import { ModalPosition } from './modal.types';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'modal.component.html',
  styleUrls: ['modal.component.scss'],
})
export class ModalComponent implements AfterViewInit, OnDestroy {
  @Input() position: ModalPosition = 'center';
  @Input() offsetX: number = 0;
  @Input() offsetY: number = 0;
  @Input() id?: string;
  @Input() showCancelButton: boolean = false;
  @Input() cancelButtonText: string = "Cancelar";

  private elementRef = inject(ElementRef);
  private _show: boolean = false;

  get show(): boolean {
    return this._show;
  }

  set show(value: boolean) {
    this._show = value;
    if (value) {
      this.disableBackgroundScroll();
    } else {
      this.enableBackgroundScroll();
    }
  }

  get modalPositionClass(): string {
    return `modal-position-${this.position}`;
  }

  get modalStyle(): { [key: string]: string } {
    return {
      transform: this.getTransformValue(),
    };
  }

  toggle() {
    this.show = !this.show;
  }

  ngAfterViewInit() {
    // Adiciona listener para prevenir scroll do fundo quando scrollar o modal
    const modalContent = this.elementRef.nativeElement.querySelector('.modal-content');
    if (modalContent) {
      modalContent.addEventListener('wheel', this.handleModalScroll.bind(this));
      modalContent.addEventListener('touchmove', this.handleModalScroll.bind(this));
    }
  }

  ngOnDestroy() {
    // Remove o listener e garante que o scroll do fundo seja habilitado
    const modalContent = this.elementRef.nativeElement.querySelector('.modal-content');
    if (modalContent) {
      modalContent.removeEventListener('wheel', this.handleModalScroll.bind(this));
      modalContent.removeEventListener('touchmove', this.handleModalScroll.bind(this));
    }
    this.enableBackgroundScroll();
  }

  private handleModalScroll(event: Event) {
    event.stopPropagation();
    const modalContent = event.currentTarget as HTMLElement;
    const isAtTop = modalContent.scrollTop === 0;
    const isAtBottom = modalContent.scrollHeight - modalContent.scrollTop === modalContent.clientHeight;

    if ((isAtTop && (event as WheelEvent).deltaY < 0) || 
        (isAtBottom && (event as WheelEvent).deltaY > 0)) {
      event.preventDefault();
    }
  }

  private disableBackgroundScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = this.getScrollbarWidth() + 'px';
  }

  private enableBackgroundScroll() {
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  }

  private getScrollbarWidth(): number {
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    document.body.appendChild(outer);

    const inner = document.createElement('div');
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
    outer.parentNode?.removeChild(outer);

    return scrollbarWidth;
  }

  private getTransformValue(): string {
    const baseTransform = this.getBaseTransform();
    return `${baseTransform} translate(${this.offsetX}px, ${this.offsetY}px)`;
  }

  private getBaseTransform(): string {
    switch (this.position) {
      case 'center':
        return 'translate(-50%, -50%)';
      case 'top':
        return 'translate(-50%, 0)';
      case 'bottom':
        return 'translate(-50%, -100%)';
      case 'left':
        return 'translate(0, -50%)';
      case 'right':
        return 'translate(-100%, -50%)';
      case 'top-left':
        return 'translate(0, 0)';
      case 'top-right':
        return 'translate(-100%, 0)';
      case 'bottom-left':
        return 'translate(0, -100%)';
      case 'bottom-right':
        return 'translate(-100%, -100%)';
      default:
        return 'translate(-50%, -50%)';
    }
  }
}
