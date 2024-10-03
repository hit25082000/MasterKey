import { Injectable, ComponentFactoryResolver, ApplicationRef, Injector, EmbeddedViewRef, ComponentRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { ModalComponent } from '../components/modal/modal.component';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalClosedSubject = new Subject<void>();
  private modalComponentRef: ComponentRef<ModalComponent> | null = null;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private appRef: ApplicationRef,
    private injector: Injector
  ) {}

  showUnauthorizedModal(): Observable<void> {
    const factory = this.componentFactoryResolver.resolveComponentFactory(ModalComponent);
    this.modalComponentRef = factory.create(this.injector);

    this.appRef.attachView(this.modalComponentRef.hostView);

    const domElem = (this.modalComponentRef.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement;
    document.body.appendChild(domElem);

    this.modalComponentRef.instance.show = true;
    this.modalComponentRef.instance.toggle = () => {
      this.closeModal();
    };

    // Crie o conteúdo do modal
    const content = document.createElement('div');
    content.innerHTML = `
      <h2>Acesso Não Autorizado</h2>
      <p>Você não tem permissão para acessar esta página.</p>
    `;

    // Adicione o conteúdo ao ng-content do ModalComponent
    const modalContent = domElem.querySelector('.modal');
    if (modalContent) {
      modalContent.appendChild(content);
    }

    return this.modalClosedSubject.asObservable();
  }

  closeModal() {
    if (this.modalComponentRef) {
      this.appRef.detachView(this.modalComponentRef.hostView);
      this.modalComponentRef.destroy();
      this.modalComponentRef = null;
      this.modalClosedSubject.next();
    }
  }
}
