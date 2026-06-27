import { IWhatsAppGateway } from '@domain/gateways/IWhatsAppGateway';

export class WahaRandevuService implements IWhatsAppGateway {
  async sendHourSelection(customerPhone: string, availableHours: string[], bookingToken: string): Promise<void> {
    console.log(`[WAHA MOCK] Sending hour selection to ${customerPhone}`);
    console.log(`Available hours: ${availableHours.join(', ')}`);
    console.log(`Booking Token: ${bookingToken}`);
    return Promise.resolve();
  }

  async sendConfirmation(customerPhone: string, appointmentDate: string): Promise<void> {
    console.log(`[WAHA MOCK] Sending confirmation to ${customerPhone} for ${appointmentDate}`);
    return Promise.resolve();
  }

  async sendCalendarEvent(customerPhone: string, eventDetails: any): Promise<void> {
    console.log(`[WAHA MOCK] Sending calendar event to ${customerPhone}`);
    return Promise.resolve();
  }

  async sendCancellation(customerPhone: string, reason?: string): Promise<void> {
    console.log(`[WAHA MOCK] Sending cancellation to ${customerPhone}. Reason: ${reason || 'N/A'}`);
    return Promise.resolve();
  }
}
