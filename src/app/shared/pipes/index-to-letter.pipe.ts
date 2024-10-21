import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'indexToLetter',
  standalone: true
})
export class IndexToLetterPipe implements PipeTransform {
  transform(value: number): string {
    return String.fromCharCode(65 + value);
  }
}
