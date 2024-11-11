import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ModalComponent } from '../modal/modal.component';
import { WhatsAppMessageComponent } from '../../../features/chat/components/whats-app-message/whats-app-message.component';

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
  imports: [RouterLink, CommonModule, ModalComponent, WhatsAppMessageComponent],
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.scss'],
})
export class SidenavComponent {
  @Output() expanded = new EventEmitter<boolean>();
  isExpanded = false;
  dropdownState: { [key: string]: boolean } = {};

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
        { label: 'Criar Curso', route: '/admin/course-register' },
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
        { label: 'Criar Categorias', route: '/admin/category-register' },
        { label: 'Listar Categorias', route: '/admin/category-list' }
      ]
    },
    {
      id: 'classes',
      label: 'Turmas',
      icon: 'fas fa-users',
      subItems: [
        { label: 'Adicionar Turma', route: '/admin/class-register' },
        { label: 'Listar Turmas', route: '/admin/class-list' }
      ]
    },
    {
      id: 'employee',
      label: 'Funcionarios',
      icon: 'fas fa-user-tie',
      subItems: [
        { label: 'Adicionar Funcionario', route: '/admin/employee-register' },
        { label: 'Listar Funcionarios', route: '/admin/employee-list' }
      ]
    },
    {
      id: 'roles',
      label: 'Permissões',
      icon: 'fas fa-lock',
      subItems: [
        { label: 'Adicionar Permissões', route: '/admin/role-register' },
        { label: 'Listar Permissões', route: '/admin/role-list' }
      ]
    }
  ];

  expandSidenav() {
    this.isExpanded = true;
    this.expanded.emit(true);
  }

  collapseSidenav() {
    const allClosed = Object.values(this.dropdownState).every(
      (state) => state === false
    );

    if (allClosed) {
      this.isExpanded = false;
      this.expanded.emit(false);
    }
  }

  toggleDropdown(dropdown: string) {
    this.dropdownState[dropdown] = !this.dropdownState[dropdown];
  }

  isDropdownOpen(dropdown: string): boolean {
    return this.dropdownState[dropdown];
  }
}
