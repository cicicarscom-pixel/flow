import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IWhatsAppGateway } from '../../domain/gateways/IWhatsAppGateway';
import { BusinessRuleError } from '../../../../shared/errors/BusinessRuleError';

export class CancelAppointmentUseCase {
  constructor(
    private appointmentRepo: IAppointmentRepository,
    private whatsappGateway: IWhatsAppGateway
  ) {}

  async execute(token: string, reason?: string): Promise<void> {
    const appointment = await this.appointmentRepo.findByToken(token);
    
    if (!appointment) {
      throw new BusinessRuleError('Geçersiz veya süresi dolmuş randevu bağlantısı.');
    }

    const cancelledAppointment = await this.appointmentRepo.cancel(appointment.id);
    
    await this.whatsappGateway.sendCancellation(
      cancelledAppointment.customerPhone,
      reason
    );
  }
}
