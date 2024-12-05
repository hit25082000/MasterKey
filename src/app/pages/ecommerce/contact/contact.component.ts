import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FaqComponent } from '../features/faq/faq.component';

interface ContatoForm {
  nome: string;
  email: string;
  mensagem: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FaqComponent
  ],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {
  private fb = inject(FormBuilder);

  contatoForm = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    mensagem: ['', [Validators.required, Validators.minLength(10)]]
  });

  onSubmit(): void {
    if (this.contatoForm.valid) {
      console.log(this.contatoForm.value);
      // Aqui você implementaria a lógica para enviar o formulário
      this.contatoForm.reset();
    }
  }
}
