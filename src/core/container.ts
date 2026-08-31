import { WahaService } from '../modules/sosyal_medya/infrastructure/services/WahaService';
import { SupabaseTransactionRepository } from '../modules/muhasebe/infrastructure/repositories/SupabaseTransactionRepository';
import { ManageBotUseCase } from '../modules/sosyal_medya/application/useCases/ManageBotUseCase';
import { GetTransactionsUseCase } from '../modules/muhasebe/application/useCases/GetTransactionsUseCase';
import { SupabaseAppointmentRepository } from '../modules/randevu/infrastructure/repositories/SupabaseAppointmentRepository';
import { SupabaseCustomerRepository } from '../modules/musteriler/infrastructure/repositories/SupabaseCustomerRepository';
import { WahaRandevuService } from '../modules/randevu/infrastructure/services/WahaRandevuService';
import { ApproveAppointmentUseCase } from '../modules/randevu/application/useCases/ApproveAppointmentUseCase';
import { CancelAppointmentUseCase } from '../modules/randevu/application/useCases/CancelAppointmentUseCase';
import { StartAppointmentFlowUseCase } from '../modules/randevu/application/useCases/StartAppointmentFlowUseCase';

// --- Infrastructure Services (Singletons) ---
const wahaService = new WahaService();
const transactionRepository = new SupabaseTransactionRepository();
const appointmentRepository = new SupabaseAppointmentRepository();
const customerRepository = new SupabaseCustomerRepository();
const wahaRandevuService = new WahaRandevuService();

// --- Use Cases (Singletons) ---
const manageBotUseCase = new ManageBotUseCase(wahaService);
const getTransactionsUseCase = new GetTransactionsUseCase(transactionRepository);
const approveAppointmentUseCase = new ApproveAppointmentUseCase(appointmentRepository, wahaRandevuService);
const cancelAppointmentUseCase = new CancelAppointmentUseCase(appointmentRepository, wahaRandevuService);
const startAppointmentFlowUseCase = new StartAppointmentFlowUseCase(appointmentRepository, wahaRandevuService);

export interface IDIContainer {
  resolve<T>(cls: new (...args: any[]) => T): T;
  resolve<T = any>(key: string): T;
}

// Simple DI container - drop-in replacement for tsyringe, no decorators needed
const container: IDIContainer = {
  resolve: (cls: any) => {
    if (cls === 'WahaService' || cls?.name === 'WahaService') return wahaService;
    if (cls === 'SupabaseTransactionRepository' || cls?.name === 'SupabaseTransactionRepository') return transactionRepository;
    if (cls === 'AppointmentRepository') return appointmentRepository;
    if (cls === 'CustomerRepository') return customerRepository;
    if (cls === ManageBotUseCase) return manageBotUseCase;
    if (cls === GetTransactionsUseCase) return getTransactionsUseCase;
    if (cls === ApproveAppointmentUseCase) return approveAppointmentUseCase;
    if (cls === CancelAppointmentUseCase) return cancelAppointmentUseCase;
    if (cls === StartAppointmentFlowUseCase) return startAppointmentFlowUseCase;
    throw new Error(`Class not registered in container: ${cls?.name || cls}. Add it to src/core/container.ts`);
  }
};

export { container };
