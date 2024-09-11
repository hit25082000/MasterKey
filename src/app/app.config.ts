import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getMessaging, provideMessaging } from '@angular/fire/messaging';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),
    provideHttpClient(),
    provideFirebaseApp(() => initializeApp({ "projectId":"master-key-a3c69","appId":"1:224667468198:web:152db07a094c0524ef4f67","storageBucket":"master-key-a3c69.appspot.com","apiKey":"AIzaSyCr6PMcKmVO9nEN_6bd0VvRCOhANgAEneY","authDomain":"master-key-a3c69.firebaseapp.com","messagingSenderId":"224667468198","measurementId":"G-LWL506F6FH"})),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideFunctions(() => getFunctions()),
    provideMessaging(() => getMessaging()),
    provideStorage(() => getStorage()),
  ]
};

