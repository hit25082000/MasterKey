import { Routes } from '@angular/router';
import { EcommerceComponent } from './ecommerce.component';
import { HomeComponent } from './home/home.component';
import { ProductsComponent } from './products/products.component';
import { AboutComponent } from './about/about.component';
import { ContactComponent } from './contact/contact.component';
import { CoursePreviewComponent } from './course-preview/course-preview.component';
import { CourseCheckoutComponent } from '../../features/checkout/components/course-checkout/course-checkout.component';
import { PaymentSuccessComponent } from './payment/payment-success/payment-success.component';
import { PaymentFailureComponent } from './payment/payment-failure/payment-failure.component';
import { PaymentPendingComponent } from './payment/payment-pending/payment-pending.component';

export const ECOMMERCE_ROUTES: Routes = [
    {
        path: 'home',
        component: HomeComponent,
        title: 'Início'
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'products',
        component: ProductsComponent,
        title: 'Produtos'
      },
      {
        path: 'about',
        component: AboutComponent,
        title: 'Sobre'
      },
      {
        path: 'contact',
        component: ContactComponent,
        title: 'Contato'
      },
      {
        path: 'course/:id',
        component: CoursePreviewComponent,
        title: 'Curso'
      },
      {
        path: 'checkout/:id',
        component: CourseCheckoutComponent,
        title: 'Checkout'
      },
      {
        path: 'payment/success',
        component: PaymentSuccessComponent
      },
      {
        path: 'payment/failure',
        component: PaymentFailureComponent
      },
      {
        path: 'payment/pending',
        component: PaymentPendingComponent
      }
];
