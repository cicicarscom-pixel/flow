import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';
import { IWhatsAppGateway } from '../../domain/gateways/IWhatsAppGateway';
import { BusinessRuleError } from '../../../../shared/errors/BusinessRuleError';

export class ApproveAppointmentUseCase {
  constructor(
    private appointmentRepo: IAppointmentRepository,
    private whatsappGateway: IWhatsAppGateway
  ) {}

  async execute(token: string): Promise<void> {
    const appointment = await this.appointmentRepo.findByToken(token);
    
    if (!appointment) {
      throw new BusinessRuleError('Geçersiz veya süresi dolmuş randevu bağlantısı.');
    }

    const approvedAppointment = await this.appointmentRepo.approve(appointment.id);
    
    await this.whatsappGateway.sendConfirmation(
      approvedAppointment.customerPhone,
      approvedAppointment.date
    );
  }
}
