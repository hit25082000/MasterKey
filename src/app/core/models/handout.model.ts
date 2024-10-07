import { Entity } from "./entity";

export interface Handout extends Entity {
  name: string;
  image: string;
  url: string;
}
