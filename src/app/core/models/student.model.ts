import BaseUser from "./base-user.model";

export interface Student extends BaseUser {
  responsible?: string;
  rgResponsible?: string;
  cpfResponsible?: string;
  courses?: string[];
  packages?: string[];
}
