import { Component, EventEmitter, input, Input, Output, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  ValidatorFn,
  AbstractControl,
} from '@angular/forms';
import { Exam, Question, Options } from '../../../../core/models/exam.model';
import { CommonModule } from '@angular/common';
import { Course } from '../../../../core/models/course.model';
import { CourseSelectorComponent } from '../../../course/components/course-selector/course-selector.component';
import { ModalComponent } from "../../../../shared/components/modal/modal.component";
import { NotificationService } from '../../../../shared/services/notification.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './exam-form.component.html',
  styleUrls: ['./exam-form.component.scss'],
})
export class ExamFormComponent implements OnInit {
  exam = input.required<Exam | undefined>();
  @Output() formSubmit = new EventEmitter<Exam>();
  @Output() formCancel = new EventEmitter<void>();
  Options = Object.keys(Options);
  examForm: FormGroup;
  notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);
  courseId = signal<string>('');
  showErrors = signal<boolean>(false);

  constructor(private fb: FormBuilder) {
    // Inicializa o formulário com validações e mensagens de erro
    this.examForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      courseId: ['', Validators.required],
      questions: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
  }

  ngOnInit() {
    // Pega o courseId da URL
    const courseIdFromUrl = this.route.snapshot.paramMap.get('id');
    if (courseIdFromUrl) {
      this.courseId.set(courseIdFromUrl);
      this.examForm.patchValue({ courseId: courseIdFromUrl });
    }

    if (this.exam() != undefined) {
      // Preenche o formulário com os dados do exame existente
      this.examForm.patchValue({
        title: this.exam()?.title,
        description: this.exam()?.description,
        courseId: this.exam()?.courseId || this.courseId()
      });

      // Adiciona as questões existentes
      this.exam()?.questions.forEach(question => this.addQuestion(question));
    }
  }

  get questionsFormArray(): FormArray {
    return this.examForm.get('questions') as FormArray;
  }

  addQuestion(question?: Question) {
    const questionForm = this.fb.group({
      id: [question?.id || ''],
      text: [question?.text || '', [
        Validators.required,
        Validators.minLength(10)
      ]],
      options: this.fb.array(
        question?.options || [Options.A, Options.B, Options.C, Options.D],
        [
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(4),
          this.uniqueOptionsValidator()
        ]
      ),
      correctAnswer: [question?.correctAnswer || '', [
        Validators.required
      ]],
    });

    this.questionsFormArray.push(questionForm);
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

  onSubmit() {
    if (this.examForm.valid) {
      const examData: Exam = {
        ...this.examForm.value,
        courseId: this.courseId(),
        createdAt: this.exam()?.createdAt || new Date(),
        updatedAt: new Date()
      };
      console.log(examData);
      this.formSubmit.emit(examData);
    } else {
      // Marca todos os campos como touched e mostra mensagens de erro
      Object.keys(this.examForm.controls).forEach(key => {
        const control = this.examForm.get(key);
        control?.markAsTouched();
      });

      // Marca campos das questões como touched
      this.questionsFormArray.controls.forEach(questionControl => {
        const questionGroup = questionControl as FormGroup;
        Object.keys(questionGroup.controls).forEach(key => {
          const control = questionGroup.get(key);
          control?.markAsTouched();
        });
      });

      this.notificationService.error('Por favor, corrija os erros no formulário antes de enviar');
    }
  }

  onCancel() {
    this.formCancel.emit();
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
}
