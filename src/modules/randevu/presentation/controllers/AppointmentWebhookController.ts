import { container } from '../../../../core/container';
import { StartAppointmentFlowUseCase } from '@application/useCases/StartAppointmentFlowUseCase';
import { ApproveAppointmentUseCase } from '@application/useCases/ApproveAppointmentUseCase';
import { CancelAppointmentUseCase } from '@application/useCases/CancelAppointmentUseCase';

export class AppointmentWebhookController {
  
  static async handleIncomingMessage(req: any, res: any) {
    try {
      const payload = req.body;
      
      // Basic routing based on payload content (WAHA structure)
      // This is a placeholder for actual webhook parsing logic
      
      if (payload.action === 'start_appointment') {
        const useCase = container.resolve(StartAppointmentFlowUseCase);
        await useCase.execute(payload.phone, payload.serviceId, payload.date);
        return res.status(200).json({ success: true, message: 'Flow started' });
      }

      if (payload.action === 'approve_appointment') {
        const useCase = container.resolve(ApproveAppointmentUseCase);
        await useCase.execute(payload.token);
        return res.status(200).json({ success: true, message: 'Appointment approved' });
      }

      if (payload.action === 'cancel_appointment') {
        const useCase = container.resolve(CancelAppointmentUseCase);
        await useCase.execute(payload.token, payload.reason);
        return res.status(200).json({ success: true, message: 'Appointment cancelled' });
      }

      return res.status(400).json({ success: false, message: 'Unknown action' });

    } catch (error: any) {
      console.error('Webhook Error:', error);
      return res.status(error.statusCode || 500).json({ success: false, error: error.message });
    }
  }
}
