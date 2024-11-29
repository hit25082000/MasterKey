import { Component, EventEmitter, input, Output, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Exam, Question, Options } from '../../../../core/models/exam.model';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../shared/services/notification.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './exam-form.component.html',
  styleUrl: './exam-form.component.scss',
})
export class ExamFormComponent implements OnInit {
  // Inputs e Outputs
  exam = input<Exam | null>();
  @Output() formSubmit = new EventEmitter<void>();
  @Output() formCancel = new EventEmitter<void>();

  // Constantes
  readonly Options = Object.values(Options);

  // Form
  examForm!: FormGroup;

  // Injeções
  private readonly fb = inject(FormBuilder);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.initForm();
    this.loadExamData();
  }

  private initForm(): void {
    this.examForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      questions: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });
  }

  private loadExamData(): void {
    if (this.exam()) {
      this.examForm.patchValue({
        title: this.exam()?.title,
        description: this.exam()?.description
      });

      this.exam()?.questions.forEach(question => this.addQuestion(question));
    }
  }

  get questionsFormArray(): FormArray {
    return this.examForm.get('questions') as FormArray;
  }

  addQuestion(question?: Question): void {
    const questionForm = this.fb.group({
      text: [question?.text || '', [Validators.required, Validators.minLength(10)]],
      options: this.fb.array(
        question?.options || Array(4).fill(''),
        [Validators.required]
      ),
      correctAnswer: [question?.correctAnswer || '', Validators.required]
    });

    this.questionsFormArray.push(questionForm);
  }

  removeQuestion(index: number): void {
    this.questionsFormArray.removeAt(index);
  }

  onSubmit(): void {
    if (this.examForm.invalid) {
      this.markFormGroupTouched(this.examForm);
      this.notificationService.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    this.formSubmit.emit();
  }

  onCancel(): void {
    this.formCancel.emit();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
      }
    });
  }
}
