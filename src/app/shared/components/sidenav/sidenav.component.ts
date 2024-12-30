import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, ViewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd, RouterModule } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { WhatsAppMessageComponent } from '../../../features/chat/components/whats-app-message/whats-app-message.component';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleAuthButtonComponent } from '../google-auth-button/google-auth-button.component';

interface SubMenuItem {
  label: string;
  route: string;
  isModal?: boolean;
  component?: any;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  subItems: SubMenuItem[];
}

@Component({
  selector: 'app-sidenav',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterLink,
    RouterLinkActive,
    ModalComponent,
    WhatsAppMessageComponent,
    GoogleAuthButtonComponent
  ],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent {
  @Output() expanded = new EventEmitter<boolean>();
  isExpanded = false;
  dropdownState: { [key: string]: boolean } = {};
  activeRoute = '';
  auth = inject(AuthService)


  @ViewChild('whatsAppModal') whatsAppModal!: ModalComponent;

  menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Alunos',
      icon: 'fas fa-user-graduate',
      subItems: [
        { label: 'Cadastrar aluno', route: '/admin/student-register' },
        { label: 'Lista de alunos', route: '/admin/student-list' },
        { label: 'Lista de presença', route: '/admin/student-login-list' },
        { label: 'Aula ao Vivo', route: '/admin/meet' },
        { label: 'Vagas de emprego', route: '/admin/job-vacancy' },
        {
          label: 'Enviar mensagem WhatsApp',
          route: '',
          isModal: true,
          component: WhatsAppMessageComponent
        }
      ]
    },
    {
      id: 'courses',
      label: 'Cursos',
      icon: 'fas fa-book',
      subItems: [
        { label: 'Criar Curso', route: '/admin/course-form' },
        { label: 'Listar Cursos', route: '/admin/course-list' }
      ]
    },
    {
      id: 'package',
      label: 'Pacotes',
      icon: 'fas fa-box',
      subItems: [
        { label: 'Adicionar Pacote', route: '/admin/package-form' },
        { label: 'Listar Pacotes', route: '/admin/package-list' }
      ]
    },
    {
      id: 'categorys',
      label: 'Categorias',
      icon: 'fas fa-tags',
      subItems: [
        { label: 'Criar Categorias', route: '/admin/category-form' },
        { label: 'Listar Categorias', route: '/admin/category-list' }
      ]
    },
    {
      id: 'classes',
      label: 'Turmas',
      icon: 'fas fa-users',
      subItems: [
        { label: 'Adicionar Turma', route: '/admin/class-form' },
        { label: 'Listar Turmas', route: '/admin/class-list' }
      ]
    },
    {
      id: 'employee',
      label: 'Funcionarios',
      icon: 'fas fa-user-tie',
      subItems: [
        { label: 'Adicionar Funcionario', route: '/admin/employee-form' },
        { label: 'Listar Funcionarios', route: '/admin/employee-list' }
      ]
    },
    {
      id: 'roles',
      label: 'Permissões',
      icon: 'fas fa-lock',
      subItems: [
        { label: 'Adicionar Permissões', route: '/admin/role-form' },
        { label: 'Listar Permissões', route: '/admin/role-list' }
      ]
    },
    {
      id: 'library',
      label: 'Biblioteca',
      icon: 'fas fa-book',
      subItems: [
        { label: 'Listar Livros', route: '/admin/library-list' }
      ]
    }
  ];

  constructor(
    private router: Router,
  ) {
    // Observa mudanças na rota
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.activeRoute = event.url;
      // Atualiza os estados dos dropdowns e expande a sidenav se houver rota ativa
      this.updateDropdownStates();
      this.checkAndExpandForActiveRoute();
    });
  }

  checkAndExpandForActiveRoute() {
    // Verifica se há alguma rota ativa
    const hasActiveRoute = this.menuItems.some(item => this.hasActiveRoute(item));
    if (hasActiveRoute) {
      this.isExpanded = true;
      this.expanded.emit(true);
    }
  }

  updateDropdownStates(shouldExpand: boolean = true) {
    // Fecha todos os dropdowns primeiro
    Object.keys(this.dropdownState).forEach(key => {
      this.dropdownState[key] = false;
    });

    // Abre apenas o dropdown que contém a rota ativa
    for (const item of this.menuItems) {
      if (this.hasActiveRoute(item)) {
        this.dropdownState[item.id] = true;
        // Expande a sidenav se houver rota ativa
        this.isExpanded = true;
        this.expanded.emit(true);
        break;
      }
    }
  }

  hasActiveRoute(item: MenuItem): boolean {
    return item.subItems.some(subItem =>
      this.activeRoute.startsWith(subItem.route) && subItem.route !== ''
    );
  }

  isRouteActive(route: string): boolean {
    return this.activeRoute === route;
  }

  toggleDropdown(dropdown: string) {
    // Expande a sidenav antes de abrir o dropdown
    this.isExpanded = true;
    this.expanded.emit(true);

    // Fecha todos os outros dropdowns
    Object.keys(this.dropdownState).forEach(key => {
      if (key !== dropdown) {
        this.dropdownState[key] = false;
      }
    });
    // Toggle do dropdown clicado
    this.dropdownState[dropdown] = !this.dropdownState[dropdown];

    // Se todos os dropdowns estiverem fechados, permite que a sidenav seja recolhida
    if (Object.values(this.dropdownState).every(state => !state)) {
      this.isExpanded = false;
      this.expanded.emit(false);
    }
  }

  openModal(subItem: SubMenuItem) {
    if (subItem.isModal) {
      switch (subItem.component) {
        case WhatsAppMessageComponent:
          this.whatsAppModal.toggle();
          break;
        // Adicione outros casos para diferentes modais aqui
        default:
          console.warn('Modal component não reconhecido:', subItem.component);
      }
    }
  }

  expandSidenav() {
    this.isExpanded = true;
    this.expanded.emit(true);
    // Atualiza os dropdowns quando expandir manualmente
    this.updateDropdownStates(true);
  }

  collapseSidenav() {
    // Não colapsa se houver rota ativa
    if (this.menuItems.some(item => this.hasActiveRoute(item))) {
      return;
    }

    // Só permite colapsar se não houver nenhum dropdown aberto
    const anyDropdownOpen = Object.values(this.dropdownState).some(state => state);
    if (!anyDropdownOpen) {
      this.isExpanded = false;
      this.expanded.emit(false);
    }
  }

  isDropdownOpen(dropdownId: string): boolean {
    return this.dropdownState[dropdownId] || false;
  }

  async logout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  }
}
