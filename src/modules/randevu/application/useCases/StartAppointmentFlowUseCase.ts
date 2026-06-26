import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IWhatsAppGateway } from '../../domain/gateways/IWhatsAppGateway';
import { AppointmentStatus } from '../../domain/enums/AppointmentStatus';
import { BusinessRuleError } from '../../../../shared/errors/BusinessRuleError';

export class StartAppointmentFlowUseCase {
  constructor(
    private appointmentRepo: IAppointmentRepository,
    private whatsappGateway: IWhatsAppGateway
  ) {}

  async execute(customerPhone: string, serviceId: string, date: string): Promise<void> {
    // 1. Get available hours
    const availableHours = await this.appointmentRepo.findAvailableHours(date, serviceId);
    
    if (availableHours.length === 0) {
      throw new BusinessRuleError('Bu tarih için uygun saat bulunamadı.');
    }

    // 2. Create pending appointment to get a booking token
    const token = crypto.randomUUID();
    
    await this.appointmentRepo.create({
      customerPhone,
      serviceId,
      date,
      status: AppointmentStatus.Pending,
      bookingToken: token
    } as any);

    // 3. Send hours via WhatsApp
    await this.whatsappGateway.sendHourSelection(customerPhone, availableHours, token);
  }
}
