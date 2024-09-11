import BaseUser from "./default-user.model";

export interface Class {
  id: string,
  name : string,
  time : Date,
  dayWeek : string[],
  startDate: Date,
  finishDate: Date,
  status: boolean,
  room: string,
  students: string[],
  teacher: string,
}
