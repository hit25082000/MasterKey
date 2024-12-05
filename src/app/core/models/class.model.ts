import BaseUser from "./base-user.model";

export interface Class {
  id?: string;
  name: string;
  time: string;
  daysWeek: string[];
  startDate: string;
  finishDate: string;
  status: boolean;
  room: string;
  teacher: string;
}
