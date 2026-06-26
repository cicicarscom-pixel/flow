import { Transaction } from '../../domain/entities/Transaction';

export class TransactionMapper {
  static toDomain(raw: any): Transaction {
    return new Transaction({
      id: raw.id,
      name: raw.name,
      amount: raw.amount,
      date: raw.date,
      createdAt: raw.created_at
    });
  }

  static toPersistence(entity: Transaction): any {
    return {
      id: entity.id,
      name: entity.name,
      amount: entity.amount,
      date: entity.date,
      created_at: entity.createdAt
    };
  }
}
