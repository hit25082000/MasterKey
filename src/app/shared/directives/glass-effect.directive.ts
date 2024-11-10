import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[glassEffect]',
  standalone: true
})
export class GlassEffectDirective implements OnInit {
  constructor(private el: ElementRef) {}

  ngOnInit() {
    const element = this.el.nativeElement;

    element.style.background = 'rgba(255, 255, 255, 0.1)';
    element.style.backdropFilter = 'blur(10px)';
    element.style.borderRadius = '8px';
    element.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  }
}
