export interface IServiceResponse<T> {
  data?: T | null;
  error?: Error | any | null;
  success?: boolean;
}

export interface IWahaService {
  getBotSettings(merchantId: string | number): Promise<IServiceResponse<any>>;
  updateBotSettings(merchantId: string | number, settingsData: any): Promise<IServiceResponse<any>>;
  getWahaSession(merchantId: string | number): Promise<IServiceResponse<any>>;
  upsertWahaSession(merchantId: string | number, sessionData: any): Promise<IServiceResponse<any>>;
  startSession(merchantId: string | number): Promise<IServiceResponse<any>>;
  getQrCode(merchantId: string | number): Promise<IServiceResponse<any>>;
  getPairingCode(merchantId: string | number, phoneNumber: string): Promise<IServiceResponse<any>>;
  getSessionStatus(merchantId: string | number): Promise<IServiceResponse<any>>;
}
