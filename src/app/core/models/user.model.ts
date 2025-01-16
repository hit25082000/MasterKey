export interface User {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone1: string;
  role: 'admin' | 'student';
  active: boolean;
} 