import { Entity } from "./entity";

export interface Book extends Entity {
  title: string;
  author: string;
  imageUrl: string;
  pdfUrl: string;
}
