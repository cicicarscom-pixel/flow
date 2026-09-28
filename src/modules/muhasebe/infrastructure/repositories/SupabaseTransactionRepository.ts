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
    const { data, error } = await supabase.rpc('create_finance_entry', {
      p_type: transaction.type,
      p_title: transaction.title,
      p_amount: transaction.amount,
      p_date: transaction.date,
      p_payment_status: transaction.status === 'completed' ? 'paid' : (transaction.status || 'paid')
    });
    
    if (error) {
      throw new NetworkError(`Islem olusturulurken hata olustu: ${error.message}`);
    }
    return TransactionMapper.toDomain({
      id: data?.id || 'new-id',
      title: transaction.title,
      amount: transaction.amount,
      date: transaction.date,
      type: transaction.type,
      status: transaction.status
    });
  }
}
