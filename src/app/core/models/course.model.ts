export interface Video {
  id : string;
  title: string;
  duration: number;
  url: string;
}

export interface Course {
  id: string;
  name: string;
  videoCount: number;
  price: string;
  promoPrice: number;
  portionCount: number;
  hidePrice: boolean;
  image: string;
  status: string;
  category: string;
  categoryEcommerce: string;
  highlight: boolean;
  checkoutUrl: string;
  description: string;
  workHours: number;
  videos: Video[];
}
