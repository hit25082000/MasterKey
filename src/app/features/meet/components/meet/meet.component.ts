import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { LogCategory, SystemLogService } from '../../../../core/services/system-log.service';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { environment } from '../../../../../environments/environment';
import { Subscription } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ChatService } from '../../../chat/services/chat.service';
import { GoogleAuthButtonComponent } from '../../../../shared/components/google-auth-button/google-auth-button.component';

@Component({
  selector: 'app-meeting',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, GoogleAuthButtonComponent],
  templateUrl: './meet.component.html',
  styleUrls: ['./meet.component.scss'],
})
export class MeetComponent implements OnInit, OnDestroy {
  private googleAuthService = inject(GoogleAuthService);
  private notificationService = inject(NotificationService);
  private firestoreService = inject(FirestoreService);
  private chatService = inject(ChatService);
  private httpClient = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private systemLogService = inject(SystemLogService);
  private fb = inject(FormBuilder);

  private subscriptions = new Subscription();

  meetingForm = this.fb.group({
    title: ['', Validators.required],
    startDate: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    selectedClass: ['', Validators.required],
  });

  availableClasses = signal<any[]>([]);
  selectedClassEmails = signal<string[]>([]);
  meetLink = signal<string>('');
  showMeetIcon = signal<boolean>(false);
  isGoogleConnected = signal<boolean>(false);

  ngOnInit(): void {
    // Monitorar status da conexão Google
    this.subscriptions.add(
      this.googleAuthService.accessToken$.subscribe(token => {
        this.isGoogleConnected.set(!!token && !this.googleAuthService.isTokenExpired());
      })
    );

    // Carregar turmas disponíveis
    this.loadClasses();

    // Verificar código de autenticação
    this.subscriptions.add(
      this.route.queryParams.subscribe(params => {
        const code = params['code'];
        if (code) {
          this.handleAuthCode(code);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private async handleAuthCode(code: string) {
    try {
      const redirectUri = window.location.origin + '/admin/meet';
      await this.googleAuthService.exchangeCodeForToken(code, redirectUri).toPromise();
      
      // Restaurar dados do formulário salvos
      const savedFormData = localStorage.getItem('meetingFormData');
      if (savedFormData) {
        this.meetingForm.patchValue(JSON.parse(savedFormData));
        localStorage.removeItem('meetingFormData');
      }

      this.notificationService.success('Conectado com sucesso ao Google');
    } catch (error) {
      console.error('Erro na autenticação:', error);
      this.notificationService.error('Erro na autenticação com o Google');
    }
  }

  async loadClasses() {
    try {
      const classes = await this.firestoreService.getCollection('classes');
      this.availableClasses.set(classes);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
      this.notificationService.error('Erro ao carregar turmas');
    }
  }

  async onSubmit() {
    if (!this.isGoogleConnected()) {
      this.notificationService.error('Por favor, conecte sua conta Google primeiro');
      return;
    }

    if (this.meetingForm.valid) {
      try {
        const formData = this.meetingForm.value;
        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.startDate}T${formData.endTime}`);

        // Carregar emails dos alunos
        await this.loadStudentEmails(formData.selectedClass!);

        const meetingData = {
          title: formData.title!,
          startDateTime: startDateTime.toISOString(),
          endDateTime: endDateTime.toISOString(),
          attendeesEmails: this.selectedClassEmails(),
        };

        // Criar reunião no Google Meet
        const meetLink = await this.createGoogleMeet(meetingData);
        
        if (meetLink) {
          // Salvar informações da reunião
          await this.saveMeetingInfo(meetingData, meetLink, formData.selectedClass!);
          
          // Notificar alunos
          await this.notifyStudents(meetingData, meetLink);

          // Registrar log
          await this.systemLogService.logAction(
            LogCategory.MEETING_CREATION,
            'Criação de reunião',
            {
              meetingTitle: formData.title,
              classId: formData.selectedClass,
            }
          ).toPromise();

          this.notificationService.success('Reunião criada com sucesso!');
          this.meetingForm.reset();
        }
      } catch (error: any) {
        console.error('Erro ao criar reunião:', error);
        
        if (error.status === 401) {
          this.notificationService.error('Sessão expirada. Por favor, reconecte sua conta Google');
          this.googleAuthService.logout();
        } else {
          this.notificationService.error('Erro ao criar reunião. Por favor, tente novamente.');
        }
      }
    }
  }

  private async loadStudentEmails(classId: string) {
    try {
      const classStudents = await this.firestoreService.getDocumentsByAttribute(
        'class_students',
        'classId',
        classId
      );
      
      const studentIds = classStudents.map(cs => cs.studentId);
      const students = await Promise.all(
        studentIds.map(id => this.firestoreService.getDocument('students', id))
      );
      
      this.selectedClassEmails.set(students.map(student => student.email));
    } catch (error) {
      console.error('Erro ao carregar emails dos alunos:', error);
      throw new Error('Erro ao carregar emails dos alunos');
    }
  }

  private async createGoogleMeet(meetingData: any): Promise<string> {
    return new Promise((resolve, reject) => {
      this.googleAuthService.getAccessToken().pipe(
        switchMap(token => {
          if (!token) {
            throw new Error('Token não disponível');
          }

          const endpoint = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
          const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          });

          const requestBody = {
            summary: meetingData.title,
            description: 'Reunião criada via aplicação',
            start: {
              dateTime: meetingData.startDateTime,
              timeZone: 'America/Sao_Paulo',
            },
            end: {
              dateTime: meetingData.endDateTime,
              timeZone: 'America/Sao_Paulo',
            },
            conferenceData: {
              createRequest: {
                requestId: `meet_${new Date().getTime()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
              },
            },
            attendees: meetingData.attendeesEmails.map((email: string) => ({ email })),
          };

          return this.httpClient.post(endpoint, requestBody, {
            headers,
            params: { conferenceDataVersion: '1' },
          });
        }),
        catchError(error => {
          console.error('Erro ao criar reunião:', error);
          if (error.status === 401) {
            this.googleAuthService.logout();
          }
          throw error;
        })
      ).subscribe({
        next: (response: any) => {
          if (response.conferenceData?.entryPoints) {
            const videoEntryPoint = response.conferenceData.entryPoints.find(
              (ep: any) => ep.entryPointType === 'video'
            );
            if (videoEntryPoint) {
              this.meetLink.set(videoEntryPoint.uri);
              this.showMeetIcon.set(true);
              resolve(videoEntryPoint.uri);
            } else {
              reject(new Error('Link da reunião não encontrado'));
            }
          } else {
            reject(new Error('Dados da conferência não encontrados'));
          }
        },
        error: (error) => reject(error)
      });
    });
  }

  async notifyStudents(meetingData: any, meetLink: string) {
    const message = `Nova reunião agendada: ${meetingData.title}
Link do Meet: ${meetLink}
Data: ${new Date(meetingData.startDateTime).toLocaleDateString()}
Horário: ${new Date(meetingData.startDateTime).toLocaleTimeString()}`;

    for (const email of this.selectedClassEmails()) {
      try {
        const users = await this.firestoreService.getDocumentsByAttribute(
          'users',
          'email',
          email
        );

        if (users?.[0]) {
          await this.chatService.sendMessage(
            'SYSTEM',
            users[0].id,
            message,
            'Sistema'
          );

          await this.systemLogService.logAction(
            LogCategory.NOTIFICATION,
            'Notificação de reunião enviada',
            {
              studentId: users[0].id,
              meetingTitle: meetingData.title,
              meetLink
            }
          ).toPromise();
        }
      } catch (error) {
        console.error(`Erro ao notificar aluno ${email}:`, error);
      }
    }
  }

  private async saveMeetingInfo(meetingData: any, meetLink: string, classId: string) {
    await this.firestoreService.addToCollection('meetings', {
      ...meetingData,
      meetLink,
      classId,
      createdAt: new Date().toISOString(),
    });
  }

  openMeetLink() {
    if (this.meetLink()) {
      window.open(this.meetLink(), '_blank');
    }
  }
}
