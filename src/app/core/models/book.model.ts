import { Entity } from "./entity";

export interface Book extends Entity {
  title: string;
  author: string;
  imageUrl: string;
  pdfUrl: string;
  year: number;
  pages: number;
  description?: string;
  isbn?: string;
  publisher?: string;
  language?: string;
  category?: string;
}
