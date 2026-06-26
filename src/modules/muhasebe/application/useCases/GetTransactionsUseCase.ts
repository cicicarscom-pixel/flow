import { injectable, inject } from 'tsyringe';
import { ITransactionRepository } from '../../domain/repositories/ITransactionRepository';
import { Transaction } from '../../domain/entities/Transaction';
import { BusinessRuleError } from '../../../../shared/errors/BusinessRuleError';

@injectable()
export class GetTransactionsUseCase {
  constructor(
    @inject('ITransactionRepository') private transactionRepository: ITransactionRepository
  ) {}

  async execute(): Promise<Transaction[]> {
    try {
      return await this.transactionRepository.findAll();
    } catch (error: any) {
      // Re-throw or wrap the error into a BusinessRuleError if needed
      if (error.name === 'NetworkError') {
        throw error;
      }
      throw new BusinessRuleError(`İşlemler listelenemedi: ${error.message || 'Bilinmeyen hata'}`);
    }
  }
}
