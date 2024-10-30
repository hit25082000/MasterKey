import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirestoreService } from '../../../../core/services/firestore.service';
import { ChatService } from '../../../chat/services/chat.service';
import { environment } from '../../../../../environments/environment';
import { NotificationType } from '../../../../shared/models/notifications-enum';
import {
  SystemLogService,
  LogCategory,
} from '../../../../core/services/system-log.service';
import { GoogleAuthService } from '../../../../core/services/google-auth.service';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-meeting',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './meet.component.html',
  styleUrls: ['./meet.component.scss'],
})
export class MeetingComponent implements OnInit {
  meetingForm!: FormGroup;
  availableClasses: any[] = [];
  selectedClassEmails: string[] = [];
  meetLink: string = '';
  showMeetIcon: boolean = false;
  private accessToken: string | null = null;
  isAuthenticated: boolean = false;
  router = inject(Router)
  constructor(
    private fb: FormBuilder,
    private firestoreService: FirestoreService,
    private chatService: ChatService,

    private httpClient: HttpClient,
    private route: ActivatedRoute,
    private notificationService: NotificationService,
    private systemLogService: SystemLogService,
    private googleAuthService: GoogleAuthService
  ) {}

  ngOnInit(): void {
    this.meetingForm = this.fb.group({
      title: ['', Validators.required],
      startDate: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      selectedClass: ['', Validators.required],
    });

    this.loadClasses();

    this.route.queryParams.subscribe((params) => {
      const code = params['code'] as string;
      if (code) {
        this.exchangeCodeForToken(code);
      }
    });

    this.googleAuthService.accessToken$.subscribe((token) => {
      if (token) {
        this.accessToken = token;
        this.isAuthenticated = true;
      } else {
        this.isAuthenticated = false;
      }
    });
  }

  private exchangeCodeForToken(code: string) {
    const redirectUri = 'http://localhost:4200/admin/meet';
    this.googleAuthService.exchangeCodeForToken(code, redirectUri).subscribe(
      () => {
        const savedFormData = localStorage.getItem('meetingFormData');
        if (savedFormData) {
          this.meetingForm.patchValue(JSON.parse(savedFormData));
          localStorage.removeItem('meetingFormData');
        }
      },
      (error) => {
        console.error('Erro na autenticação:', error);
        this.notificationService.success(
          'Erro na autenticação. Por favor, tente novamente.',
          1
        );
      }
    );
  }

  authenticateWithGoogle() {
    const redirectUri = 'http://localhost:4200/admin/meet';
    localStorage.setItem(
      'meetingFormData',
      JSON.stringify(this.meetingForm.value)
    );
    this.googleAuthService.initiateOAuthFlow(redirectUri);
  }

  async loadClasses() {
    this.availableClasses = await this.firestoreService.getCollection(
      'classes'
    );
  }

  async onSubmit() {
    if (this.meetingForm.valid && this.isAuthenticated) {
      try {
        const { title, startDate, startTime, endTime, selectedClass } =
          this.meetingForm.value;

        const startDateTime = new Date(
          `${startDate}T${startTime}`
        ).toISOString();
        const endDateTime = new Date(`${startDate}T${endTime}`).toISOString();

        await this.loadStudentEmails(selectedClass);

        const meetingData = {
          title,
          startDateTime,
          endDateTime,
          attendeesEmails: this.selectedClassEmails,
        };

        const meetLink = await this.createGoogleMeet(meetingData);
        await this.notifyStudents(meetingData, meetLink);

        await this.saveMeetingInfo(meetingData, meetLink, selectedClass);

        this.notificationService.success(
          'Reunião criada com sucesso!',
          1
        );

        // Gerar log de criação de reunião
        await this.systemLogService
          .logAction(LogCategory.MEETING_CREATION, 'Criação de reunião', {
            meetingTitle: title,
            classId: selectedClass,
          })
          .toPromise();
      } catch (error) {
        console.error('Erro ao criar reunião:', error);
        this.notificationService.success(
          'Erro ao criar reunião. Por favor, tente novamente.',
          1
        );
      }
    } else if (!this.isAuthenticated) {
      this.notificationService.success(
        'Por favor, autentique-se antes de criar uma reunião.',
        1
      );
    } else {
      this.notificationService.success(
        'Por favor, preencha todos os campos obrigatórios.',
        1
      );
    }
  }

  async loadStudentEmails(classId: string) {
    const classStudents = await this.firestoreService.getDocumentsByAttribute(
      'class_students',
      'classId',
      classId
    );
    const studentIds = classStudents.map((cs) => cs.studentId);

    const students = await Promise.all(
      studentIds.map((id) => this.firestoreService.getDocument('students', id))
    );
    this.selectedClassEmails = students.map((student) => student.email);
  }

  async createGoogleMeet(meetingData: any): Promise<string> {
    if (!this.accessToken) {
      await this.initiateOAuthFlow();
      return ''; // Retorne vazio, pois o fluxo de autenticação redirecionará a página
    }

    const endpoint =
      'https://www.googleapis.com/calendar/v3/calendars/primary/events';

    // Substitua [ACCESS_TOKEN] pelo token de acesso OAuth 2.0 real
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.accessToken}`,
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
          conferenceSolutionKey: {
            type: 'hangoutsMeet',
          },
        },
      },
      attendees: meetingData.attendeesEmails.map((email: string) => ({
        email,
      })),
    };

    try {
      const response = await this.httpClient
        .post(endpoint, requestBody, {
          headers,
          params: { conferenceDataVersion: '1' },
        })
        .toPromise();

      if (
        (response as any)['conferenceData'] &&
        (response as any)['conferenceData']['entryPoints']
      ) {
        const videoEntryPoint = (response as any)['conferenceData'][
          'entryPoints'
        ].find((ep: any) => ep.entryPointType === 'video');
        if (videoEntryPoint) {
          this.meetLink = videoEntryPoint.uri;
          this.showMeetIcon = true;
          return this.meetLink;
        }
      }
      throw new Error('Falha ao obter o link da reunião');
    } catch (error) {
      throw error;
    }
  }

  openMeetLink() {
    if (this.meetLink) {
      window.open(this.meetLink, '_blank');
    }
  }

  async notifyStudents(meetingData: any, meetLink: string) {
    const message = `Nova reunião: ${meetingData.title}. Link: ${meetLink}. Início: ${meetingData.startDateTime}`;
    for (const email of this.selectedClassEmails) {
      const student = await this.firestoreService.getDocumentsByAttribute(
        'users',
        'email',
        email
      );
      if (student.length > 0) {
        await this.chatService.sendMessage(
          'SYSTEM',
          student[0].id,
          message,
          'Sistema'
        );
      }
    }
  }

  async saveMeetingInfo(meetingData: any, meetLink: string, classId: string) {
    await this.firestoreService.addToCollection('meetings', {
      ...meetingData,
      meetLink,
      classId,
    });
  }

  private initiateOAuthFlow() {
    const clientId = environment.googleClientId; // Adicione isso ao seu environment.ts
    const redirectUri = 'http://localhost:4200/admin/meet'; // Ajuste conforme necessário
    const scope = 'https://www.googleapis.com/auth/calendar.events';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?scope=${scope}&access_type=offline&include_granted_scopes=true&response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    // Salvar os dados do formulário antes de redirecionar
    localStorage.setItem(
      'meetingFormData',
      JSON.stringify(this.meetingForm.value)
    );
    window.location.href = authUrl;
  }
}
