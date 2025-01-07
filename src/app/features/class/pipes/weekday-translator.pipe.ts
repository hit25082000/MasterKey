import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'weekdayTranslator',
  standalone: true
})
export class WeekdayTranslatorPipe implements PipeTransform {
  private weekdayMap: { [key: string]: string } = {
    'MONDAY': 'Segunda-feira',
    'TUESDAY': 'Terça-feira',
    'WEDNESDAY': 'Quarta-feira',
    'THURSDAY': 'Quinta-feira',
    'FRIDAY': 'Sexta-feira',
    'SATURDAY': 'Sábado',
    'SUNDAY': 'Domingo'
  };

  transform(daysWeek: string[]): string {
    if (!daysWeek) return '';
    
    return daysWeek
      .map(day => this.weekdayMap[day] || day)
      .join(', ');
  }
}
