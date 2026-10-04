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

  /**
   * Bağlantı durumunun tek doğru kaynağı WAHA'nın canlı durumudur (sunucudaki `waha-session` → status).
   * Eskiden `waha_sessions` tablosundan okunuyordu; o tablo boş olduğu için bağlı hesap bile "Bağlı değil" görünüyordu.
   */
  async getSessionStatus(merchantId: string | number): Promise<IServiceResponse<any>> {
    try {
      const response = await this.wahaService.getSessionStatus(merchantId);
      const s = response?.data;
      if (!s) return { data: null, error: response?.error ?? null };
      return { data: { status: s.status, me: s.me ?? undefined }, error: null };
    } catch (e) {
      console.warn("Could not get WhatsApp session status:", e);
      return { data: null, error: null };
    }
  }
}
