import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Package } from '../../../../core/models/package.model';
import { PackageService } from '../../services/package.service';
import { PackageManagementService } from '../../services/package-management.service';
import { ConfirmationService } from '../../../../shared/services/confirmation.service';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-package-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ConfirmationDialogComponent],
  templateUrl: './package-list.component.html',
  styleUrl: './package-list.component.scss'
})
export class PackageListComponent implements OnInit {
  packageService = inject(PackageService)
  packageManagementService = inject(PackageManagementService)
  confirmationService = inject(ConfirmationService)
  packages = signal<Package[]>([])

  constructor(
    private router: Router){}

  async ngOnInit(): Promise<void> {
    try {
      this.packages = this.packageService.packages;
    } catch (err) {
      console.error(err);
    } finally {
    }
  }

  deleteStudent(id: string) {
    this.confirmationService.confirm({
      header: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir este pacote?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.packageManagementService.delete(id).subscribe({
          next: () => {
            this.packages.set(this.packages().filter(pkg => pkg.id !== id));
          },
          error: (error) => {
            console.error('Erro ao deletar pacote:', error);
          }
        });
      }
    });
  }

  createPackage(){
    this.router.navigate(['/admin/package-form']);
  }

  editStudent(id : string){
    this.router.navigate(['/admin/package-form', id]);
  }
}
