import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  ValidatorFn,
  AbstractControl
} from '@angular/forms';
import { Exam, Question, Options } from '../../../../core/models/exam.model';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ExamService } from '../../../../core/services/exam.service';
import { LoadingService } from '../../../../shared/services/loading.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './exam-form.component.html',
  styleUrls: ['./exam-form.component.scss']
})
export class ExamFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private examService = inject(ExamService);
  private notificationService = inject(NotificationService);
  private loadingService = inject(LoadingService);
  private fb = inject(FormBuilder);

  Options = [
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
    { value: 'D', label: 'D' }
  ];
  examForm: FormGroup;
  courseId = signal<string>('');
  examId = signal<string | null>(null);
  isLoading = signal(true);
  showErrors = signal(false);

  constructor() {
    this.examForm = this.initForm();
  }

  private initForm(): FormGroup {
    return this.fb.group({
      id: [''],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      courseId: ['', Validators.required],
      questions: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
  }

  async ngOnInit() {
    try {
      const params = this.route.snapshot.paramMap.get('id');
      if (!params) {
        throw new Error('Parâmetros não fornecidos');
      }

      if (params.includes('_')) {
        const [courseId, examId] = params.split('_');
        this.examId.set(examId);
        this.courseId.set(courseId);
        await this.loadExam(examId);
      } else {
        this.courseId.set(params);
        this.addQuestion();
      }

      this.examForm.patchValue({ courseId: this.courseId() });
    } catch (error) {
      console.error('Erro ao inicializar:', error);
      this.notificationService.error('Erro ao carregar formulário');
      this.router.navigate(['/admin/courses']);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadExam(examId: string) {
    try {
      this.loadingService.show();

      const exam = await firstValueFrom(this.examService.getExamById(examId));

      if (!exam) {
        throw new Error('Exame não encontrado');
      }

      // Limpa o formulário antes de carregar os novos dados
      this.examForm.reset();

      // Limpa o array de questões
      while (this.questionsFormArray.length) {
        this.questionsFormArray.removeAt(0);
      }

      // Preenche os dados básicos do exame
      this.examForm.patchValue({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        courseId: exam.courseId
      });

      // Adiciona cada questão ao formulário
      if (exam.questions && exam.questions.length > 0) {
        exam.questions.forEach(question => {
          // Garante que temos 4 opções, preenchendo com strings vazias se necessário
          const options = Array(4).fill('').map((_, i) => question.options?.[i] || '');

          const questionGroup = this.fb.group({
            id: [question.id],
            text: [question.text, [Validators.required, Validators.minLength(10)]],
            options: this.fb.array(
              options,
              [Validators.required, this.uniqueOptionsValidator()]
            ),
            correctAnswer: [question.correctAnswer || '', [Validators.required]]
          });

          this.questionsFormArray.push(questionGroup);
        });
      }

    } catch (error) {
      console.error('Erro ao carregar exame:', error);
      this.notificationService.error('Erro ao carregar exame');
    } finally {
      this.loadingService.hide();
    }
  }

  get questionsFormArray(): FormArray {
    return this.examForm.get('questions') as FormArray;
  }

  addQuestion(question?: Question) {
    const questionGroup = this.createQuestionGroup(question);
    this.questionsFormArray.push(questionGroup);
  }

  removeQuestion(indexToRemove: number) {
    try {
      // Cria um novo array de controles excluindo o índice especificado
      const newControls = this.questionsFormArray.controls
        .filter((_, index) => index !== indexToRemove);

      // Reseta o FormArray
      this.examForm.setControl('questions', this.fb.array([]));

      // Adiciona os controles filtrados de volta
      newControls.forEach(control => {
        (this.examForm.get('questions') as FormArray).push(control);
      });

      // Atualiza validação
      this.examForm.updateValueAndValidity();

      this.notificationService.success('Questão removida com sucesso');
    } catch (error) {
      this.notificationService.error('Erro ao remover questão');
    }
  }

  async onSubmit() {
    if (this.examForm.valid) {
      try {
        this.loadingService.show();
        const formValue = this.examForm.value;

        const examData: Exam = {
          id: this.examId() || '',
          title: formValue.title,
          description: formValue.description,
          courseId: this.courseId(),
          questions: formValue.questions.map((question: any) => ({
            ...question,
            id: question.id || crypto.randomUUID()
          })),
          createdAt: formValue.createdAt || new Date(),
          updatedAt: new Date()
        };

        if (this.examId()) {
          await firstValueFrom(this.examService.updateExam(examData));
          this.notificationService.success('Exame atualizado com sucesso');
        } else {
          const createdExam = await firstValueFrom(this.examService.createExam(examData));
          console.log('Exame criado:', createdExam);
          this.notificationService.success('Exame criado com sucesso');
        }

        this.router.navigate(['/admin/exams', this.courseId()]);
      } catch (error) {
        console.error('Erro ao salvar exame:', error);
        this.notificationService.error('Erro ao salvar exame');
      } finally {
        this.loadingService.hide();
      }
    } else {
      this.showErrors.set(true);
      this.notificationService.error('Por favor, corrija os erros no formulário');
    }
  }

  onCancel() {
    this.router.navigate(['/admin/exams', this.courseId()]);
  }

  uniqueOptionsValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const options = control.value;
      const uniqueOptions = new Set(options);
      return uniqueOptions.size === options.length ? null : { 'duplicateOptions': true };
    };
  }

  trackByFn(index: number): number {
    return index;
  }

  getErrorMessage(controlName: string): string {
    const control = this.examForm.get(controlName);

    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo é obrigatório';
      }
      if (control.errors['minlength']) {
        const requiredLength = control.errors['minlength'].requiredLength;
        return `Mínimo de ${requiredLength} caracteres`;
      }
      if (control.errors['maxlength']) {
        const requiredLength = control.errors['maxlength'].requiredLength;
        return `Máximo de ${requiredLength} caracteres`;
      }
      if (control.errors['duplicateOptions']) {
        return 'As opções devem ser únicas';
      }
    }
    return '';
  }

  getQuestionErrorMessage(questionIndex: number, controlName: string): string {
    const questionGroup = this.questionsFormArray.at(questionIndex) as FormGroup;
    const control = questionGroup.get(controlName);

    if (control?.errors) {
      if (control.errors['required']) {
        return 'Este campo é obrigatório';
      }
      if (control.errors['minlength']) {
        const requiredLength = control.errors['minlength'].requiredLength;
        return `Mínimo de ${requiredLength} caracteres`;
      }
      if (controlName === 'text' && control.errors['minlength']) {
        return 'A pergunta deve ter no mínimo 10 caracteres';
      }
      if (controlName === 'options') {
        if (control.errors['minlength']) {
          return 'São necessárias 4 opções';
        }
        if (control.errors['maxlength']) {
          return 'Máximo de 4 opções permitidas';
        }
        if (control.errors['duplicateOptions']) {
          return 'As opções devem ser únicas';
        }
      }
      if (controlName === 'correctAnswer' && control.errors['required']) {
        return 'Selecione a resposta correta';
      }
    }
    return '';
  }

  hasErrors(): boolean {
    return !this.examForm.valid || this.questionsFormArray.length === 0;
  }

  validateAndSubmit() {
    this.showErrors.set(true);

    if (this.hasErrors()) {
      // Marca todos os campos como touched para mostrar os erros
      Object.keys(this.examForm.controls).forEach(key => {
        const control = this.examForm.get(key);
        control?.markAsTouched();
      });

      this.questionsFormArray.controls.forEach(questionControl => {
        const questionGroup = questionControl as FormGroup;
        Object.keys(questionGroup.controls).forEach(key => {
          const control = questionGroup.get(key);
          control?.markAsTouched();
        });
      });

      // Rola a página até o sumário de erros
      setTimeout(() => {
        const summary = document.querySelector('.validation-summary');
        summary?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      this.notificationService.error('Por favor, corrija os erros antes de continuar');
      return;
    }

    this.onSubmit();
  }
  shouldShowQuestionError(questionIndex: number, controlName: string): boolean {
    const questionGroup = this.questionsFormArray.at(questionIndex) as FormGroup;
    const control = questionGroup.get(controlName);
    return control ? (control.invalid && (control.touched || control.dirty)) : false;
  }
  shouldShowError(controlName: string): boolean {
    const control = this.examForm.get(controlName);
    return control ? (control.invalid && (control.touched || control.dirty)) : false;
  }

  // Método auxiliar para criar uma questão
  private createQuestionGroup(question?: Question): FormGroup {
    return this.fb.group({
      id: [question?.id || ''],
      text: [question?.text || '', [Validators.required, Validators.minLength(10)]],
      options: this.fb.array(
        question?.options || Array(4).fill(''),
        [Validators.required, this.uniqueOptionsValidator()]
      ),
      correctAnswer: [question?.correctAnswer || '', [Validators.required]]
    });
  }

  // Método para obter as opções de uma questão específica
  getQuestionOptions(questionIndex: number): FormArray {
    const questionGroup = this.questionsFormArray.at(questionIndex) as FormGroup;
    return questionGroup.get('options') as FormArray;
  }

  // Método para verificar se uma opção está selecionada como correta
  isCorrectAnswer(questionIndex: number, option: string): boolean {
    const questionGroup = this.questionsFormArray.at(questionIndex) as FormGroup;
    return questionGroup.get('correctAnswer')?.value === option;
  }
}
