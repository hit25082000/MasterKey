import { Component, EventEmitter, input, Input, Output, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CourseSelectorComponent, ModalComponent],
  templateUrl: './exam-form.component.html',
  styleUrls: ['./exam-form.component.scss'],
})
export class ExamFormComponent implements OnInit {
  exam = input.required<Exam | null>();
  @Output() formSubmit = new EventEmitter<Exam>();
  @Output() formCancel = new EventEmitter<void>();
  Options = Object.keys(Options);
  examForm: FormGroup;
  questionForm!: FormArray;

  constructor(private fb: FormBuilder) {
    this.examForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', Validators.required],
      courseId: ['', Validators.required],
      questions: this.fb.array([]),
    });
  }

  ngOnInit() {
    if (this.exam() != null) {
      console.log(this.exam())
      this.examForm.patchValue(this.exam()!);
      this.exam()!.questions.forEach((question) => this.addQuestion(question));
    }
  }

  get questionsFormArray(): FormArray {
    return this.examForm.get('questions') as FormArray;
  }

  addQuestion(question?: Question) {
    const questionForm = this.fb.group({
      id: [question?.id || ''],
      text: [question?.text || '', Validators.required],
      options: this.fb.array(
        question?.options || [Options.A, Options.B, Options.C, Options.D],
        [Validators.required, Validators.minLength(4), Validators.maxLength(4), this.uniqueOptionsValidator()]
      ),
      correctAnswer: [question?.correctAnswer || null, Validators.required],
    });
    this.questionsFormArray.push(questionForm);
  }

  removeQuestion(index: number) {
    this.questionsFormArray.removeAt(index);
  }

  onSubmit() {
    if (this.examForm.valid) {
      const examData: Exam = {
        ...this.examForm.value,
      };

      if (!examData.createdAt) {
        examData.createdAt = new Date();
      }
      examData.updatedAt = new Date();

      this.formSubmit.emit(examData);
    }
  }

  onCancel() {
    this.formCancel.emit();
  }

  private generateId(): string {
    return Date.now().toString();
  }

  uniqueOptionsValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const options = control.value;
      const uniqueOptions = new Set(options);
      return uniqueOptions.size === options.length ? null : { 'duplicateOptions': true };
    };
  }
}
