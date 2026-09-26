import { IWahaService, IServiceResponse } from '@domain/interfaces/IWahaService';

export class ManageBotUseCase {
  private wahaService: IWahaService;

  constructor(wahaService: IWahaService) {
    this.wahaService = wahaService;
  }

  async getSettings(merchantId: string | number): Promise<IServiceResponse<any>> {
    return await this.wahaService.getBotSettings(merchantId);
  }

  async updateSettings(merchantId: string | number, settingsData: any): Promise<IServiceResponse<any>> {
    if (!settingsData) {
      return { success: false, error: new Error("Settings data is required") };
    }
    return await this.wahaService.updateBotSettings(merchantId, settingsData);
  }

  async checkAndStartSession(merchantId: string | number): Promise<IServiceResponse<any>> {
    const statusResponse = await this.getSessionStatus(merchantId);
    
    if (!statusResponse.data || statusResponse.data.status !== 'WORKING') {
      return await this.wahaService.startSession(merchantId);
    }

    return statusResponse;
  }

  async startSession(merchantId: string | number): Promise<IServiceResponse<any>> {
    return await this.wahaService.startSession(merchantId);
  }

  async getQrCode(merchantId: string | number): Promise<IServiceResponse<any>> {
    return await this.wahaService.getQrCode(merchantId);
  }

  async getPairingCode(merchantId: string | number, phoneNumber: string): Promise<IServiceResponse<any>> {
    return await this.wahaService.getPairingCode(merchantId, phoneNumber);
  }

  async getSessionStatus(merchantId: string | number): Promise<IServiceResponse<any>> {
    try {
      const response = await this.wahaService.getWahaSession(merchantId);
      if (response && response.data) {
        // Return in the format expected by the UI (similar to Waha API format)
        if (response.data.status === 'WORKING') {
           // waha_sessions stores session_data
           return { data: { status: 'WORKING', me: response.data.session_data?.me }, error: null };
        }
        return { data: { status: response.data.status }, error: null };
      }
      return { data: null, error: null };
    } catch (e) {
      console.warn("Could not get session status from DB:", e);
      return { data: null, error: null };
    }
  }
}
