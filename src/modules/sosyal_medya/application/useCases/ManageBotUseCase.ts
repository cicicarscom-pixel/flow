import { injectable, inject } from 'tsyringe';
import { IWahaService, IServiceResponse } from '@domain/interfaces/IWahaService';

@injectable()
export class ManageBotUseCase {
  private wahaService: IWahaService;

  constructor(@inject('IWahaService') wahaService: IWahaService) {
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
    const statusResponse = await this.wahaService.getSessionStatus(merchantId);
    
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
    return await this.wahaService.getSessionStatus(merchantId);
  }
}
