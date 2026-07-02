import { useState } from 'react';
import { supabase } from '../../../../shared';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export function usePlayground(botInstruction: string, promptConfig: any) {
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
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          prompt: text.trim(),
          mode: 'playground',
          customInstruction: botInstruction
        }
      });

      if (error) {
        throw error;
      }

      let responseText = "Üzgünüm, şu an yanıt veremiyorum.";
      if (data && data.text) {
        responseText = data.text;
      } else if (data && data.adCopy) {
        responseText = data.adCopy;
      } else if (data && typeof data === 'string') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) responseText = parsed.text;
          else if (parsed.adCopy) responseText = parsed.adCopy;
        } catch (e) {
          responseText = data;
        }
      }

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: responseText,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Playground Gemini API Error:", err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Simülasyon bağlantı hatası oluştu. Lütfen daha sonra tekrar deneyin.",
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
