import { Transaction } from '@domain/entities/Transaction';

export interface ITransactionRepository {
  findAll(): Promise<Transaction[]>;
  findById(id: string): Promise<Transaction | null>;
  create(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;
}
