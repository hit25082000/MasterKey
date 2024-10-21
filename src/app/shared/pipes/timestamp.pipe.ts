import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timestamp',
  standalone: true
})
export class TimestampPipe implements PipeTransform {
  transform(value: any, format: string = 'dd/MM/yyyy HH:mm'): string {
    if (!value || !value.seconds) {
      return '';
    }
    const date = new Date(value.seconds * 1000);
    return this.formatDate(date, format);
  }

  private formatDate(date: Date, format: string): string {
    const pad = (num: number): string => num.toString().padStart(2, '0');

    const replacements: { [key: string]: string } = {
      dd: pad(date.getDate()),
      MM: pad(date.getMonth() + 1),
      yyyy: date.getFullYear().toString(),
      HH: pad(date.getHours()),
      mm: pad(date.getMinutes()),
      ss: pad(date.getSeconds())
    };

    return format.replace(/dd|MM|yyyy|HH|mm|ss/g, match => replacements[match]);
  }
}
