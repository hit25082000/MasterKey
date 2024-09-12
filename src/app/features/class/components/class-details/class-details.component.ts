import { PackageService } from '../../../package/services/package.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {  FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Course } from '../../../../core/models/course.model';
import { ClassManagementService } from '../../services/class-management.service';
import { ModalComponent } from "../../../../shared/components/modal/modal.component";
import { ClassSelectorComponent } from "../class-selector/class-selector.component";
import { StudentsSelectorComponent } from '../students-selector/students-selector.component';
import { TeacherSelectorComponent } from '../teacher-selector/teacher-selector.component';
import { Student } from '../../../../core/models/student.model';
import { ClassService } from '../../services/class.service';
import { DayWeekSelectorComponent } from '../day-week-selector/day-week-selector.component';

@Component({
  selector: 'app-class-detail',
  standalone: true,
  imports: [CommonModule, DayWeekSelectorComponent, StudentsSelectorComponent, TeacherSelectorComponent, ReactiveFormsModule, ModalComponent, ClassSelectorComponent],
  templateUrl: './class-details.component.html',
  styleUrls: ['./class-details.component.scss']
})
export class ClassDetailsComponent implements OnInit {
  classForm!: FormGroup;
  classId!: string;
  loading: boolean = true;
  error: string = '';
  studentList: string[] = [];
  teacherId: string = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private classManagementService: ClassManagementService,
    private classService : ClassService
  ) {}

  async ngOnInit() {
    this.classId = this.route.snapshot.paramMap.get('id')!;

    if (!this.classId) {
      this.error = 'ID da função não encontrada.';
      this.loading = false;
      return;
    }

    try {
      const classItem = await this.classService.getById(this.classId);
      this.studentList = classItem.students
      this.teacherId = classItem.teacher

      this.classForm = this.fb.group({
        id: [{ value: classItem.id, disabled: true }, Validators.required],
        name: [classItem.name, Validators.required],
        time: [classItem.time, Validators.required],
        dayWeek: [classItem.dayWeek, Validators.required],
        startDate: [classItem.startDate, Validators.required],
        finishDate: [classItem.finishDate, Validators.required],
        status: [classItem.status, Validators.required],
        room: [classItem.room, Validators.required],
        students: [classItem.students, Validators.required],
        teacher: [classItem.teacher, Validators.required],
      });

      this.loading = false;
    } catch (err) {
      this.error = 'Erro ao carregar os dados do aluno';
      console.error(err);
      this.loading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.classForm.valid && this.classForm.dirty) {
      try {
        await this.classManagementService.update(this.classId, this.classForm.value);
      } catch (error) {
        this.error = 'Erro ao atualizar aluno';
      }
    }
  }
}
