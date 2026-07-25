import { ITransactionRepository } from '@domain/repositories/ITransactionRepository';
import { Transaction } from '@domain/entities/Transaction';
import { TransactionMapper } from '../mappers/TransactionMapper';
import { supabase } from '../../../../shared';
import { NetworkError } from '../../../../shared/errors/NetworkError';

export class SupabaseTransactionRepository implements ITransactionRepository {
  async findAll(): Promise<Transaction[]> {
    const { data, error } = await supabase.from('transactions').select('*');
    if (error) {
      throw new NetworkError(`Veritabanından işlemler çekilirken hata oluştu: ${error.message}`);
    }
    return (data || []).map(row => TransactionMapper.toDomain(row));
  }

  async findById(id: string): Promise<Transaction | null> {
    const { data, error } = await supabase.from('transactions').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new NetworkError(`İşlem detayı çekilirken hata oluştu: ${error.message}`);
    }
    return TransactionMapper.toDomain(data);
  }

  async create(transaction: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    // Actually entity doesn't have an id in omit, but toPersistence needs a full Transaction
    // Let's create a dummy id for the persistence payload if necessary, or let DB handle it.
    const payload = {
      name: transaction.name,
      title: transaction.title,
      amount: transaction.amount,
      date: transaction.date,
      type: transaction.type,
      status: transaction.status
    };
    
    const { data, error } = await supabase.from('transactions').insert([payload]).select().single();
    if (error) {
      throw new NetworkError(`İşlem oluşturulurken hata oluştu: ${error.message}`);
    }
    return TransactionMapper.toDomain(data);
  }
}
