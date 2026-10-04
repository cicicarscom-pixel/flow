import { supabase } from '../../../../shared';
import { getCurrentOrgId } from '../../../../lib/org';
import { IWahaService, IServiceResponse } from '@domain/interfaces/IWahaService';

const WAHA_BASE_URL = 'http://31.97.37.208:3000';

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

  /**
   * WAHA ï¿½zerinde yeni bir oturum baï¿½latï¿½r.
   */
  async startSession(merchantId: string | number): Promise<IServiceResponse<any>> {
    if (!merchantId) {
      console.error('merchantId bulunamadï¿½');
      return { data: null, error: new Error('merchantId bulunamadï¿½') };
    }

    try {
      const requestBody = {
        name: String(merchantId),
        config: {
          webhooks: [
            {
              url: "https://qybzidylewzsnmlofjul.supabase.co/functions/v1/waha-webhook",
              events: ["message", "session.status"]
            }
          ]
        },
        engine: "NOWEB"
      };

      const response = await fetch(`${WAHA_BASE_URL}/api/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': process.env.EXPO_PUBLIC_WAHA_API_KEY /* GEÇİCİ: Bu uç nokta ve yetki doğrudan mobil cihazdan çağrılmamalıdır. Bir Edge Function'a taşınacak. */,
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 422 && errorData.message && errorData.message.includes('already started')) {
          console.log('Oturum yenileniyor (Auto-Heal)...');
          
          await fetch(`${WAHA_BASE_URL}/api/sessions/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Api-Key': process.env.EXPO_PUBLIC_WAHA_API_KEY /* GEÇİCİ: Bu uç nokta ve yetki doğrudan mobil cihazdan çağrılmamalıdır. Bir Edge Function'a taşınacak. */ },
            body: JSON.stringify({ name: String(merchantId), logout: true })
          });
          
          const retryResponse = await fetch(`${WAHA_BASE_URL}/api/sessions/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Api-Key': process.env.EXPO_PUBLIC_WAHA_API_KEY /* GEÇİCİ: Bu uç nokta ve yetki doğrudan mobil cihazdan çağrılmamalıdır. Bir Edge Function'a taşınacak. */ },
            body: JSON.stringify(requestBody)
          });
          
          if (!retryResponse.ok) {
            throw new Error('Oto-onarï¿½m sonrasï¿½ oturum baï¿½latï¿½lamadï¿½.');
          }
          
          await new Promise(resolve => setTimeout(resolve, 4000));

          const retryData = await retryResponse.json();
          return { data: retryData, error: null };
        }

        console.error('StartSession API Error Detail:', errorData);
        throw new Error(`Failed to start session: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('startSession Error:', error);
      return { data: null, error };
    }
  }

  /**
   * Baï¿½latï¿½lan oturumun QR kodunu getirir.
   */
  async getQrCode(merchantId: string | number): Promise<IServiceResponse<any>> {
    try {
      const response = await fetch(`${WAHA_BASE_URL}/api/${merchantId}/auth/qr`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': process.env.EXPO_PUBLIC_WAHA_API_KEY /* GEÇİCİ: Bu uç nokta ve yetki doğrudan mobil cihazdan çağrılmamalıdır. Bir Edge Function'a taşınacak. */,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('getQrCode API Error Detail:', errorData);
        throw new Error(`Failed to get QR code: ${response.statusText} - ${JSON.stringify(errorData)}`);
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('getQrCode Error:', error);
      return { data: null, error };
    }
  }

  /**
   * Numara eï¿½leï¿½tirme (Pairing Code) iï¿½in kod alï¿½r.
   */
  async getPairingCode(merchantId: string | number, phoneNumber: string): Promise<IServiceResponse<any>> {
    try {
      const response = await fetch(`${WAHA_BASE_URL}/api/${merchantId}/auth/request-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Api-Key': process.env.EXPO_PUBLIC_WAHA_API_KEY /* GEÇİCİ: Bu uç nokta ve yetki doğrudan mobil cihazdan çağrılmamalıdır. Bir Edge Function'a taşınacak. */,
        },
        body: JSON.stringify({ phoneNumber }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to request pairing code: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('getPairingCode Error:', error);
      return { data: null, error };
    }
  }

  /**
   * WAHA ï¿½zerinden mevcut oturumun durumunu getirir.
   */
  async getSessionStatus(merchantId: string | number): Promise<IServiceResponse<any>> {
    try {
      const response = await fetch(`${WAHA_BASE_URL}/api/sessions?all=true`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Api-Key': process.env.EXPO_PUBLIC_WAHA_API_KEY /* GEÇİCİ: Bu uç nokta ve yetki doğrudan mobil cihazdan çağrılmamalıdır. Bir Edge Function'a taşınacak. */,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get sessions: ${response.statusText}`);
      }
      
      const sessions = await response.json();
      const session = sessions.find((s: any) => s.name === String(merchantId));
      
      return { data: session || null, error: null };
    } catch (error) {
      console.error('getSessionStatus Error:', error);
      return { data: null, error };
    }
  }
}

