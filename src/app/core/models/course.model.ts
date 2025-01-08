import { Entity } from "./entity";

export interface Video extends Entity {
  name: string;
  description: string;
  duration: number;
  webViewLink: string;
  thumbnail: string;
}

export interface CourseVideo {
  videoId: string;
  name: string;
  duration: number;
  webViewLink: string;
  active: boolean;
}

export interface CourseModule {
  name: string;
  description: string;
  videos: CourseVideo[];
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
  modules: CourseModule[];
  reviews: CourseReview[];
}
