import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { Video, Course } from '../../../../core/models/course.model';
import { Exam, Answer, ExamTake } from '../../../../core/models/exam.model';
import { ExamService } from '../../../../core/services/exam.service';
import { from, Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../../../../shared/pipes/safe.pipe';
import { ModalComponent } from "../../../../shared/components/modal/modal.component";
import { ExamTakeComponent } from '../../../exam/components/exam-take/exam-take.component';

@Component({
  selector: 'app-course-player',
  standalone:true,
  imports: [CommonModule, SafePipe, ModalComponent, ExamTakeComponent],
  templateUrl: './course-player.component.html',
  styleUrls: ['./course-player.component.scss']
})
export class CoursePlayerComponent implements OnInit {
  course!: Course;
  currentVideo!: Video;
  watchedVideos: Set<string> = new Set();
  exams$!: Observable<ExamTake[]>;
  isLoading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private courseService: CourseService,
    private examService: ExamService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const courseId = params.get('id');
      if (courseId) {
        this.loadCourse(courseId);
        this.loadExams(courseId);
      } else {
        console.error('ID do curso não fornecido');
        // Adicione aqui a lógica para lidar com a ausência do ID do curso
      }
    });
  }

  loadCourse(courseId: string) {
    from(this.courseService.getById(courseId)).subscribe(course => {
      this.course = course;
      this.currentVideo = course.videos![0];
      this.isLoading = false;
    });
  }

  loadExams(courseId: string) {
    this.exams$ = this.examService.getExamsTakeByCourse(courseId)
  }

  playVideo(video: Video) {
    this.currentVideo = video;
    this.watchedVideos.add(video.id);
    this.saveProgress(video.id);
  }

  saveProgress(videoId: string) {
    this.courseService.saveProgress(this.course.id, videoId).subscribe(
      () => {
        console.log('Progresso salvo com sucesso');
      },
      (error) => {
        console.error('Erro ao salvar progresso:', error);
      }
    );
  }
}
