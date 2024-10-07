import { Entity } from "./entity";

export interface JobVacancy extends Entity {
  titulo: string;
  empresa: string;
  descricao: string;
  salario: number;
  localizacao: string;
  dataPublicacao: Date;
}
