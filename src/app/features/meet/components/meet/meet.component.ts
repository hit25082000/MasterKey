import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-meeting',
  standalone: true,
  imports: [CommonModule,ReactiveFormsModule],
  templateUrl: './meet.component.html',
  styleUrls: ['./meet.component.scss']
})
export class MeetingComponent implements OnInit {
  meetingForm!: FormGroup;
  availableClasses = [
    { id: '1', name: 'Turma A' },
    { id: '2', name: 'Turma B' },
    { id: '3', name: 'Turma C' },
    // Adicione mais turmas conforme necessário
  ];
  selectedClassEmails: string[] = []; // Lista de emails dos alunos selecionados

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit(): void {
    this.meetingForm = this.fb.group({
      title: ['', Validators.required],
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      selectedClasses: [[], Validators.required]
    });
  }

  onSubmit() {
    if (this.meetingForm.valid) {
      const { title, startDate, startTime, endTime, selectedClasses } = this.meetingForm.value;

      // Formatar a data e hora para o formato ISO
      const startDateTime = new Date(`${startDate}T${startTime}`).toISOString();
      const endDateTime = new Date(`${startDate}T${endTime}`).toISOString();

      // Simulando a obtenção de emails dos alunos baseados nas turmas selecionadas
      this.selectedClassEmails = selectedClasses.map((classId: string) => {
        // Substitua isso pela lógica real de obtenção de emails dos alunos
        return `aluno_${classId}@escola.com`;
      });

      const meetingData = {
        title,
        startDateTime,
        endDateTime,
        attendeesEmails: this.selectedClassEmails
      };

      // Enviar a solicitação para o backend (API) para criar a reunião
      this.http.post('/api/create-meeting', meetingData).subscribe(
        response => console.log('Reunião criada com sucesso!', response),
        error => console.error('Erro ao criar reunião:', error)
      );
    }
  }
}
