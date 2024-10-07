import { Entity } from "./entity";

export default interface BaseUser extends Entity {
  name: string;
  phone1: string;
  email: string;
  cpf: string;
  rg: string;
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  number: string;
  birthday: string;
  yearsOld: number;
  password: string;
  sex: string;
  polo: string;
  role: string;
  iconUrl?: string;
  phone2?: string;
  description?: string;
}

