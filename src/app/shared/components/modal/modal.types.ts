export type ModalPosition = 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ModalConfig {
  position?: ModalPosition;
  offsetX?: number;
  offsetY?: number;
}
