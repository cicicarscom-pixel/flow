import { supabase } from '../../../../shared';
import { getCurrentOrgId } from '../../../../lib/org';
import { IWahaService, IServiceResponse } from '@domain/interfaces/IWahaService';


export class WahaService implements IWahaService {
  /**
   * Esnafï¿½n mevcut bot ayarlarï¿½nï¿½ ve promptunu ï¿½eker.
   * Tablo: bot_settings
   */
  async getBotSettings(merchantId: string | number): Promise<IServiceResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('bot_settings')
        .select('*')
        .limit(1);

      if (error) {
        throw error;
      }
      
      const settingsData = data && data.length > 0 ? data[0] : null;
      return { data: settingsData, error: null };
    } catch (error) {
      console.error('getBotSettings Error:', error);
      return { data: null, error };
    }
  }

  /**
   * Prompt veya ayar deï¿½iï¿½ikliklerini kaydeder.
   * Tablo: bot_settings
   */
  async updateBotSettings(merchantId: string | number, settingsData: any): Promise<IServiceResponse<any>> {
    try {
      const { data: existingData } = await this.getBotSettings(merchantId);

      let response;
      if (existingData) {
        response = await supabase
          .from('bot_settings')
          .update({ ...settingsData, updated_at: new Date().toISOString() })
          .eq('org_id', (await getCurrentOrgId(supabase)) as string);
      } else {
        response = await supabase
          .from('bot_settings')
          .insert([{ ...settingsData, updated_at: new Date().toISOString() }]);
      }

      if (response.error) throw response.error;
      return { success: true, error: null };
    } catch (error) {
      console.error('updateBotSettings Error:', error);
      return { success: false, error };
    }
  }

  /**
   * Esnafï¿½n WAHA baï¿½lantï¿½ durumunu (QR, status vs.) ï¿½eker.
   * Tablo: waha_sessions
   */
  async getWahaSession(merchantId: string | number): Promise<IServiceResponse<any>> {
    try {
      const { data, error } = await supabase
        .from('waha_sessions')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return { data, error: null };
    } catch (error) {
      console.error('getWahaSession Error:', error);
      return { data: null, error };
    }
  }

  /**
   * Yeni oturum aï¿½ï¿½ldï¿½ï¿½ï¿½nda veya QR/Status gï¿½ncellendiï¿½inde tabloyu gï¿½nceller (upsert).
   * Tablo: waha_sessions
   */
  async upsertWahaSession(merchantId: string | number, sessionData: any): Promise<IServiceResponse<any>> {
    try {
      const { data: existingSession } = await this.getWahaSession(merchantId);

      let response;
      if (existingSession) {
        response = await supabase
          .from('waha_sessions')
          .update({ ...sessionData, last_sync_at: new Date().toISOString() })
          .eq('org_id', (await getCurrentOrgId(supabase)) as string);
      } else {
        response = await supabase
          .from('waha_sessions')
          .insert([{ ...sessionData, last_sync_at: new Date().toISOString() }]);
      }

      if (response.error) throw response.error;
      return { success: true, error: null };
    } catch (error) {
      console.error('upsertWahaSession Error:', error);
      return { success: false, error };
    }
  }

  // --- WAHA işlemleri: sunucu tarafındaki `waha-session` Edge Function'ı üzerinden ---
  // WAHA adresi ve yönetici anahtarı uygulamada TUTULMAZ. Oturum adı sunucuda JWT'den (kullanıcı kimliği) çözülür;
  // `merchantId` parametresi arayüz uyumu için durur ama gönderilmez.
  private async callWaha(body: Record<string, unknown>): Promise<IServiceResponse<any>> {
    try {
      const { data, error } = await supabase.functions.invoke('waha-session', { body });
      if (error) {
        let code = 'WAHA_ERROR';
        try { code = (await (error as any).context?.json?.())?.error || code; } catch (_) { /* gövde okunamadı */ }
        throw new Error(code);
      }
      if (data && data.success === false) throw new Error(data.error || 'WAHA_ERROR');
      return { data: data?.data ?? null, error: null };
    } catch (error) {
      console.error('waha-session Error:', (error as Error)?.message);
      return { data: null, error };
    }
  }

  /** Oturumu başlatır (hesap etkin değilse sunucu ACCOUNT_NOT_ACTIVE ile reddeder). */
  async startSession(_merchantId: string | number): Promise<IServiceResponse<any>> {
    return this.callWaha({ action: 'start' });
  }

  /** QR kodunu getirir. */
  async getQrCode(_merchantId: string | number): Promise<IServiceResponse<any>> {
    return this.callWaha({ action: 'qr' });
  }

  /** Numara eşleştirme (pairing) kodu alır. */
  async getPairingCode(_merchantId: string | number, phoneNumber: string): Promise<IServiceResponse<any>> {
    return this.callWaha({ action: 'pairing-code', phoneNumber });
  }

  /** Mevcut oturumun durumunu getirir (yalnız kullanıcının kendi oturumu). */
  async getSessionStatus(_merchantId: string | number): Promise<IServiceResponse<any>> {
    return this.callWaha({ action: 'status' });
  }
}
