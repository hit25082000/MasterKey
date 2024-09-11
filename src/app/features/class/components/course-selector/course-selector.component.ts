import { StudentManagementService } from './../../../student/services/student-management.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed,  input, inject } from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { Course } from '../../../../core/models/course.model';
import { CourseService } from '../../../course/services/course.service';
import { StudentService } from '../../../student/services/student.service';
import { Student } from '../../../../core/models/student.model';

@Component({
  selector: 'app-course-selector',
  standalone: true,
  imports: [CommonModule,SearchBarComponent],
  templateUrl: './course-selector.component.html',
  styleUrls: ['./course-selector.component.scss']
})
export class CourseSelectorComponent implements OnInit {
  defaultSelect = input<string[]>([]);
  allCourses = signal<Course[]>([]);
  selectedCourseIds = signal<string[]>([]);
  nonSelectedCourseIds = signal<string[]>([]);
  studentManagementService = inject(StudentManagementService)
  courseService = inject(CourseService)
  studentService = inject(StudentService)

  selectedCourses = computed(() => {
    return this.allCourses().filter(studentCourse => this.selectedCourseIds().includes(studentCourse.id));
  });

  nonSelectedCourses = computed(() => {
    return this.allCourses().filter(studentCourse => this.nonSelectedCourseIds().includes(studentCourse.id));
  });

  async ngOnInit() {
    this.loadAllCourses().then(()=>{
      this.autoSelect(this.defaultSelect())
    })
  }

  async loadAllCourses() {
    const courses: Course[] = await this.courseService.getAll()

    this.allCourses.set(courses);
  }

  autoSelect(defaultSelect : string[]){
    if(defaultSelect.length > 0){
      this.selectedCourseIds.set(defaultSelect);
    }

    var nonSelectedIds : string[] = this.allCourses().map(item => item.id)

    this.selectedCourseIds().forEach((selectedId)=>{
      nonSelectedIds = nonSelectedIds.filter(item => item !== selectedId)
    })

    this.nonSelectedCourseIds.set(nonSelectedIds);
  }

  onCheckboxChange(courseId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.selectedCourseIds.set([...this.selectedCourseIds(), courseId]);
      this.nonSelectedCourseIds.set(this.nonSelectedCourseIds().filter(id => id !== courseId));
    } else {
      this.selectedCourseIds.set(this.selectedCourseIds().filter(id => id !== courseId));
      this.nonSelectedCourseIds.set([...this.nonSelectedCourseIds(), courseId]);
    }
  }

  async addCoursesToStudent(studentId : string){
    // if(this.defaultSelect().map == this.selectedCourseIds()){
    //   return;
    // }

    const newStudent = await this.studentService.getById(studentId)

    newStudent.courses = this.selectedCourseIds()

    this.studentManagementService.update(newStudent.id, newStudent)
  }

  async removeCourseFromStudent(studentId : string, courseId : string){
    this.selectedCourseIds.set(this.selectedCourseIds().filter(id => id !== courseId));
    this.nonSelectedCourseIds.set([...this.nonSelectedCourseIds(), courseId]);

    const newStudent: Student = await this.studentService.getById(studentId)

    if(!newStudent.courses){
      return;
    }

    if(newStudent.courses.includes(courseId)){
      newStudent.courses = newStudent.courses.filter(course => course !== studentId);
      this.studentManagementService.update(studentId, newStudent)
    }
  }
}
