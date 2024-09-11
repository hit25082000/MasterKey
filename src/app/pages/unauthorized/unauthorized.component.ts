import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="unauthorized-container">
      <h1>Acesso Não Autorizado</h1>
      <p>Desculpe, você não tem permissão para acessar esta página.</p>
      <button routerLink="/">Voltar para a página inicial</button>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      text-align: center;
      padding: 50px;
    }
    h1 {
      color: #d9534f;
    }
    button {
      margin-top: 20px;
      padding: 10px 20px;
      background-color: #5bc0de;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    button:hover {
      background-color: #46b8da;
    }
  `]
})
export class UnauthorizedComponent {}
