import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorHandlingService {
  handleError(error: any, context: string) {
    console.error(`Erro em ${context}:`, error);
    return `Ocorreu um erro ao ${context}: ${error.message}`;
  }
}
