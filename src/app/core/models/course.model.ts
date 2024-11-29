import { Entity } from "./entity";

export interface Video extends Entity {
  id: string;
  name: string;
  duration: number;
  url: string;
}

export interface CourseReview extends Entity {
  id: string;
  userId: string;
  courseId: string;
  rating: number;
  comment: string;
  videoUrl?: string;
  createdAt: Date;
}

export interface Course extends Entity {
  id: string;
  name: string;
  description: string;
  price: number;
  promoPrice: number;
  portionCount: number;
  hidePrice: boolean;
  image: string;
  active: boolean;
  category: string;
  highlight: boolean;
  checkoutUrl: string;
  workHours: number;
  videos: Video[];
  reviews: CourseReview[];
  // createdAt: Date;
  // updatedAt: Date;
}
