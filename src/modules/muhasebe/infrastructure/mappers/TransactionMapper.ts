import { Transaction } from '@domain/entities/Transaction';

export class TransactionMapper {
  static toDomain(raw: any): Transaction {
    return new Transaction({
      id: raw.id,
      name: raw.name || raw.title,
      title: raw.title || raw.name,
      amount: raw.amount,
      date: raw.date,
      type: raw.type,
      status: raw.status,
      createdAt: raw.created_at
    });
  }

  static toPersistence(entity: Transaction): any {
    return {
      id: entity.id,
      name: entity.name,
      title: entity.title,
      amount: entity.amount,
      date: entity.date,
      type: entity.type,
      status: entity.status,
      created_at: entity.createdAt
    };
  }
}
