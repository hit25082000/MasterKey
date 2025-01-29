import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, switchMap, tap, distinctUntilChanged } from 'rxjs/operators';
import { PaymentTransaction, Subscription } from '../interfaces/payment.interface';

interface PaymentState {
  transactions: PaymentTransaction[];
  subscriptions: Subscription[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  transactions: [],
  subscriptions: [],
  loading: false,
  error: null
};

@Injectable({
  providedIn: 'root'
})
export class PaymentStateService {
  private state = new BehaviorSubject<PaymentState>(initialState);
  private customerId$ = new BehaviorSubject<string | null>(null);

  // Seletores observáveis
  transactions$ = this.state.pipe(map(state => state.transactions));
  subscriptions$ = this.state.pipe(map(state => state.subscriptions));
  loading$ = this.state.pipe(map(state => state.loading));
  error$ = this.state.pipe(map(state => state.error));

  constructor(private firestore: AngularFirestore) {
    // Iniciar observação de mudanças quando o customerId mudar
    this.setupStateObservables();
  }

  private setupStateObservables() {
    this.customerId$.pipe(
      distinctUntilChanged(),
      tap(() => this.setLoading(true)),
      switchMap(customerId => {
        if (!customerId) return [];

        const transactions$ = this.firestore
          .collection<PaymentTransaction>('transactions', ref =>
            ref.where('customerId', '==', customerId)
              .orderBy('createdAt', 'desc')
          )
          .valueChanges();

        const subscriptions$ = this.firestore
          .collection<Subscription>('subscriptions', ref =>
            ref.where('customerId', '==', customerId)
              .orderBy('createdAt', 'desc')
          )
          .valueChanges();

        return combineLatest([transactions$, subscriptions$]);
      })
    ).subscribe({
      next: ([transactions, subscriptions]) => {
        this.updateState({
          transactions,
          subscriptions,
          loading: false,
          error: null
        });
      },
      error: (error) => {
        this.updateState({
          ...this.state.value,
          loading: false,
          error: error.message
        });
      }
    });
  }

  // Métodos públicos para atualizar o estado
  setCustomerId(customerId: string) {
    this.customerId$.next(customerId);
  }

  private setLoading(loading: boolean) {
    this.updateState({
      ...this.state.value,
      loading
    });
  }

  private updateState(newState: PaymentState) {
    this.state.next(newState);
  }

  // Métodos para filtrar e agrupar dados
  getActiveSubscriptions(): Observable<Subscription[]> {
    return this.subscriptions$.pipe(
      map(subscriptions => 
        subscriptions.filter(sub => sub.status === 'ACTIVE')
      )
    );
  }

  getRecentTransactions(limit: number = 5): Observable<PaymentTransaction[]> {
    return this.transactions$.pipe(
      map(transactions => 
        transactions
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit)
      )
    );
  }

  getPendingPayments(): Observable<PaymentTransaction[]> {
    return this.transactions$.pipe(
      map(transactions =>
        transactions.filter(tx => tx.status === 'PENDING')
      )
    );
  }

  getTransactionsByStatus(status: string): Observable<PaymentTransaction[]> {
    return this.transactions$.pipe(
      map(transactions =>
        transactions.filter(tx => tx.status === status)
      )
    );
  }

  getSubscriptionsByStatus(status: string): Observable<Subscription[]> {
    return this.subscriptions$.pipe(
      map(subscriptions =>
        subscriptions.filter(sub => sub.status === status)
      )
    );
  }

  // Métodos para cálculos e estatísticas
  getTotalPaidAmount(): Observable<number> {
    return this.transactions$.pipe(
      map(transactions =>
        transactions
          .filter(tx => tx.status === 'CONFIRMED')
          .reduce((total, tx) => total + tx.amount, 0)
      )
    );
  }

  getMonthlyRecurringRevenue(): Observable<number> {
    return this.subscriptions$.pipe(
      map(subscriptions =>
        subscriptions
          .filter(sub => sub.status === 'ACTIVE' && sub.cycle === 'MONTHLY')
          .reduce((total, sub) => total + sub.value, 0)
      )
    );
  }

  // Métodos para atualização em lote
  async refreshTransactions() {
    this.setLoading(true);
    try {
      const customerId = this.customerId$.value;
      if (!customerId) return;

      const snapshot = await this.firestore
        .collection<PaymentTransaction>('transactions')
        .ref.where('customerId', '==', customerId)
        .get();

      const transactions = snapshot.docs.map(doc => doc.data() as PaymentTransaction);
      
      this.updateState({
        ...this.state.value,
        transactions,
        loading: false,
        error: null
      });
    } catch (error: any) {
      this.updateState({
        ...this.state.value,
        loading: false,
        error: error?.message || 'Erro ao atualizar transações'
      });
    }
  }

  async refreshSubscriptions() {
    this.setLoading(true);
    try {
      const customerId = this.customerId$.value;
      if (!customerId) return;

      const snapshot = await this.firestore
        .collection<Subscription>('subscriptions')
        .ref.where('customerId', '==', customerId)
        .get();

      const subscriptions = snapshot.docs.map(doc => doc.data() as Subscription);
      
      this.updateState({
        ...this.state.value,
        subscriptions,
        loading: false,
        error: null
      });
    } catch (error: any) {
      this.updateState({
        ...this.state.value,
        loading: false,
        error: error?.message || 'Erro ao atualizar assinaturas'
      });
    }
  }

  // Método para limpar o estado
  clearState() {
    this.state.next(initialState);
    this.customerId$.next(null);
  }
} 
