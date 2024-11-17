import { CommonModule } from '@angular/common';
import { Component, input, Input } from '@angular/core';
import { ModalPosition } from './modal.types';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'modal.component.html',
  styleUrls: ['modal.component.scss'],
})
export class ModalComponent {
  @Input() position: ModalPosition = 'center';
  @Input() offsetX: number = 0;
  @Input() offsetY: number = 0;
  @Input() id?: string;

  show: boolean = false;

  showCancelButton = input(false)
  cancelButtonText = "Cancelar"

  get modalPositionClass(): string {
    return `modal-position-${this.position}`;
  }

  get modalStyle(): { [key: string]: string } {
    return {
      transform: this.getTransformValue(),
    };
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

  toggle() {
    this.show = !this.show;
  }
}
