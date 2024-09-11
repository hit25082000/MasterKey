export default interface BaseUser {
  id: string;
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
  status: string;
  sex: string;
  polo: string;
  role: string;
  profilePic?: string;
  phone2?: string;
  description?: string;
}

