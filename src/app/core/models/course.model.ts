import { Entity } from "./entity";

export interface Video extends Entity {
  name: string;
  duration: number;
  webViewLink: string;
}

export interface CourseReview extends Entity {
  userId: string;
  courseId: string;
  rating: number; // 1 a 5 estrelas
  comment: string;
  videoUrl?: string; // URL do vídeo de avaliação (opcional)
  createdAt: Date;
}

export interface Course extends Entity {
  name: string;
  price: number;
  promoPrice: number;
  portionCount: number;
  hidePrice: boolean;
  image: string;
  category: string;
  highlight: boolean;
  checkoutUrl: string;
  description: string;
  workHours: number;
  videos: Video[];
  reviews: CourseReview[];
}
