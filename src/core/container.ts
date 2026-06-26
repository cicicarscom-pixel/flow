import { container } from 'tsyringe';

// Import Infrastructure Services
import { WahaService } from '../modules/sosyal_medya/infrastructure/services/WahaService';
import { SupabaseTransactionRepository } from '../modules/muhasebe/infrastructure/repositories/SupabaseTransactionRepository';

// Register Services to Interfaces
container.register('IWahaService', { useClass: WahaService });
container.register('ITransactionRepository', { useClass: SupabaseTransactionRepository });

export { container };
