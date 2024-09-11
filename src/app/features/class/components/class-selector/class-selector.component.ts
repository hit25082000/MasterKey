import { ClassManagementService } from './../../services/class-management.service';
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, WritableSignal, input, inject } from '@angular/core';
import { SearchBarComponent } from '../../../../shared/components/search-bar/search-bar.component';
import { Class } from '../../../../core/models/class.model';
import { ClassService } from '../../services/class.service';

export interface Video {
  id: string;
  title: string;
  duration: number; // Duração em minutos
  url: string;
}

@Component({
  selector: 'app-class-selector',
  standalone: true,
  imports: [CommonModule,SearchBarComponent],
  templateUrl: './class-selector.component.html',
  styleUrls: ['./class-selector.component.scss']
})
export class ClassSelectorComponent implements OnInit {
  studentId = input<string>('');
  allClasses = signal<Class[]>([]); // Signal para a lista de vídeos
  selectedClassIds = signal<string[]>([]); // Signal para os IDs dos vídeos selecionados
  nonSelectedClassIds = signal<string[]>([]); // Signal para os IDs dos vídeos selecionados
  classManagementService = inject(ClassManagementService)
  classService = inject(ClassService)

  selectedClasses = computed(() => {
    return this.allClasses().filter(studentClass => this.selectedClassIds().includes(studentClass.id));
  });

  nonSelectedClasses = computed(() => {
    return this.allClasses().filter(studentClass => this.nonSelectedClassIds().includes(studentClass.id));
  });

  async ngOnInit() {
    this.loadAllClasses();
    if(this.studentId() != ''){
      await this.loadSelectedClasses()
    }
  }

  async loadSelectedClasses(){
    this.classService.getStudentClasses(this.studentId()).then(classes => {
      var selectedIds : string[] = []
      var nonSelectedIds : string[] = this.allClasses().map(item => item.id)

      classes.forEach((selectedClassItem : Class)=>{
        selectedIds.push(selectedClassItem.id)
      })

      selectedIds.forEach((selectedId)=>{
        nonSelectedIds = nonSelectedIds.filter(item => item !== selectedId)
      })

      this.selectedClassIds.set(selectedIds)
      this.nonSelectedClassIds.set(nonSelectedIds)

      console.log(this.nonSelectedClassIds())
      console.log(this.nonSelectedClasses())
    })
  }

  async loadAllClasses() {
    const classes: Class[] = await this.classService.getAll()

    this.allClasses.set(classes);
  }

  onCheckboxChange(classId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;

    if (checkbox.checked) {
      this.selectedClassIds.set([...this.selectedClassIds(), classId]);
      this.nonSelectedClassIds.set(this.nonSelectedClassIds().filter(id => id !== classId));
    } else {
      this.selectedClassIds.set(this.selectedClassIds().filter(id => id !== classId));
      this.nonSelectedClassIds.set([...this.nonSelectedClassIds(), classId]);
    }
  }

  addStudentToClasses(studentId : string){
    this.allClasses().forEach(studentClass => {
      if(!studentClass.students.includes(studentId)){
        studentClass.students.push(studentId)
        this.classManagementService.update(studentClass.id,studentClass)
      }
    });
  }

  async removeStudentFromClass(studentId : string, classId : string){
    this.selectedClassIds.set(this.selectedClassIds().filter(id => id !== classId));
    this.nonSelectedClassIds.set([...this.nonSelectedClassIds(), classId]);

    const newClass: Class = await this.classService.getById(classId)

    if(newClass.students.includes(studentId)){
      newClass.students = newClass.students.filter(classStudent => classStudent !== studentId);
      this.classManagementService.update(classId, newClass)
    }
  }
}
