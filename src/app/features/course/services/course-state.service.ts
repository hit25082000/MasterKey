import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CourseStateService {
  private tempCourseId = signal<string | null>(null);

  setTempCourseId(id: string | null) {
    this.tempCourseId.set(id);
  }

  getTempCourseId() {
    return this.tempCourseId();
  }

  clearTempCourseId() {
    this.tempCourseId.set(null);
  }
}
