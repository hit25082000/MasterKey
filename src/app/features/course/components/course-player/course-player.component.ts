import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { Video, Course } from '../../../../core/models/course.model';
import { Exam, Answer } from '../../../../core/models/exam.model';
import { ExamService } from '../../../../core/services/exam.service';
import { from } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../../../../shared/pipes/safe.pipe';

@Component({
  selector: 'app-course-player',
  standalone:true,
  imports:[CommonModule,SafePipe],
  templateUrl: './course-player.component.html',
  styleUrls: ['./course-player.component.scss']
})
export class CoursePlayerComponent implements OnInit {
  course!: Course;
  currentVideo!: Video;
  watchedVideos: Set<string> = new Set();
  exams: Exam[] = [];

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private examService: ExamService
  ) {}

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('id') as string;
    this.loadCourse(courseId);
    this.loadExams(courseId);
  }

  loadCourse(courseId: string) {
    console.log(courseId)
    from(this.courseService.getById(courseId)).subscribe(course => {
      this.course = course;
      this.currentVideo = course.videos[0];
    });
  }

  loadExams(courseId: string) {
    this.examService.getExamsByCourse(courseId).subscribe(exams => {
      this.exams = exams;
    });
  }

  playVideo(video: Video) {
    this.currentVideo = video;
    this.watchedVideos.add(video.id);
    this.saveProgress();
  }

  saveProgress() {
    //this.courseService.saveProgress(this.course.id, Array.from(this.watchedVideos)).subscribe();
  }

  takeExam(exam: Exam) {
    // Implementar lógica para iniciar o exame
  }

  submitAnswer(answer: Answer) {
    //this.examService.submitAnswer(answer).subscribe();
  }
}
