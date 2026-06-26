export interface IWhatsAppGateway {
  sendHourSelection(customerPhone: string, availableHours: string[], bookingToken: string): Promise<void>;
  sendConfirmation(customerPhone: string, appointmentDate: string): Promise<void>;
  sendCalendarEvent(customerPhone: string, eventDetails: any): Promise<void>;
  sendCancellation(customerPhone: string, reason?: string): Promise<void>;
}
