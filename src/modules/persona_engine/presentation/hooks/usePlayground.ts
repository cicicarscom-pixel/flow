import { useState } from 'react';
import { supabase } from '../../../../shared';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export interface PlaygroundPromptConfig {
  roleId?: string;
  customRoleText?: string;
  personaId?: string;
  moodId?: string;
}

export interface PlaygroundOptions {
  appointmentModuleEnabled?: boolean;
  // Faz 2: Karakter Ayarları kadranları. Opsiyonel — eğer verilmezse
  // persona-test seçili personanın kendi varsayılan değerlerini kullanır
  // (bkz. supabase/functions/persona-test/index.ts, ledger reposu).
  personaIntensity?: number;
  humorLevel?: number;
  modernAdaptation?: number;
}

// ==============================================================================
// PERSONA ENGINE — Faz 1: Canlı Test artık gerçek persona-test fonksiyonunu
// kullanıyor (eski bare 'gemini-chat' çağrısı kaldırıldı)
// ==============================================================================
// Önceki davranış: usePlayground sadece elle birleştirilmiş bir
// `customInstruction` (finalPrompt) string'ini 'gemini-chat'e gönderiyordu —
// bu, o an ekranda seçili olan Rol/Karakter/Üslup'u TAMAMEN görmezden
// geliyordu (persona/role/tone parametreleri hiç iletilmiyordu). Bu yüzden
// mobildeki "Canlı Test" hiçbir zaman gerçek bot davranışını yansıtmıyordu.
//
// Yeni davranış: flowweb'in src/app/(dashboard)/ai-asistan/page.tsx
// (handleSendMessage) ile birebir aynı şekilde, 'persona-test' edge
// fonksiyonu çağrılıyor — bu fonksiyon gerçek production pipeline'ını
// (PromptBuilder/AIOrchestrator/ToolRegistry, ledger reposu) executionMode
// "simulation" ile çalıştırır, hiçbir gerçek müşteri yan etkisi üretmez
// (bkz. supabase/functions/persona-test/index.ts, ledger reposu).
//
// Faz 2 güncellemesi: personaIntensity/humorLevel/modernAdaptation artık
// (BotYonetimiScreen.js'teki yeni kadranlardan) gönderiliyor — web'in Canlı
// Test çağrısıyla artık tam parametre paritesi var.
export function usePlayground(promptConfig: PlaygroundPromptConfig, options: PlaygroundOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Oturum bulunamadı, lütfen tekrar giriş yapın.',
        }]);
        return;
      }

      const isCustomRole = promptConfig?.roleId === 'custom';
      const businessRole = isCustomRole ? (promptConfig?.customRoleText || null) : (promptConfig?.roleId || null);

      const { data, error } = await supabase.functions.invoke('persona-test', {
        body: {
          merchantId: session.user.id,
          testMessage: text.trim(),
          personaSlug: promptConfig?.personaId || null,
          businessRole,
          tone: promptConfig?.moodId || null,
          customInstruction: isCustomRole ? (promptConfig?.customRoleText || null) : null,
          appointmentModuleEnabled: options.appointmentModuleEnabled ?? true,
          personaIntensity: options.personaIntensity,
          humorLevel: options.humorLevel,
          modernAdaptation: options.modernAdaptation,
        }
      });

      if (error || data?.error) {
        throw error || new Error(data?.error || 'Bilinmeyen hata');
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: (data && data.text) ? data.text : 'Cevap alınamadı.',
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Playground persona-test API Error:', err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: 'Simülasyon bağlantı hatası oluştu. Lütfen daha sonra tekrar deneyin.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return {
    messages,
    chatInput,
    setChatInput,
    sendMessage,
    isTyping
  };
}
