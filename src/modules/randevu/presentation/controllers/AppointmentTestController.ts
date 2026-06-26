import { container } from '../../../../core/container';
import { StartAppointmentFlowUseCase } from '../../application/useCases/StartAppointmentFlowUseCase';
import { ApproveAppointmentUseCase } from '../../application/useCases/ApproveAppointmentUseCase';

export class AppointmentTestController {
  
  // POST /api/test/start-flow
  static async startFlow(req: any, res: any) {
    try {
      const { phone, serviceId, date } = req.body;
      const useCase = container.resolve(StartAppointmentFlowUseCase);
      
      await useCase.execute(phone, serviceId, date);
      
      return res.status(200).json({ success: true, message: 'Appointment flow started. Check WAHA mock logs.' });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }

  // POST /api/test/approve
  static async approve(req: any, res: any) {
    try {
      const { token } = req.body;
      const useCase = container.resolve(ApproveAppointmentUseCase);
      
      await useCase.execute(token);
      
      return res.status(200).json({ success: true, message: 'Appointment approved. Check WAHA mock logs.' });
    } catch (error: any) {
      return res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}
