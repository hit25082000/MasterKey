import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FormValidationService {

  constructor() { }

  compareObjects(oldObject: any, newObject: any): boolean {
    var oldJson = JSON.stringify(oldObject);
    var newJson = JSON.stringify(newObject);

    return oldJson === newJson
  }
}
