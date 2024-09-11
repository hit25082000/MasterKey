import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Permission } from './permission.enum'; // Caminho para o seu arquivo de enum
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-permission-select',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,FormsModule],
  templateUrl: './permission-select.component.html',
  styleUrls: ['./permission-select.component.scss']
})
export class PermissionSelectComponent implements OnInit {
  permissionForm!: FormGroup;
  permissions = Object.values(Permission);


  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.permissionForm = this.fb.group({
      selectedPermissions: new FormControl([])
    });
  }

  onSubmit() {

  }
}
