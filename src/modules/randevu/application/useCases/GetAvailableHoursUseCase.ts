import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository';

export class GetAvailableHoursUseCase {
  constructor(
    private appointmentRepo: IAppointmentRepository
  ) {}

  async execute(date: string, serviceId: string): Promise<string[]> {
    return await this.appointmentRepo.findAvailableHours(date, serviceId);
  }
}
