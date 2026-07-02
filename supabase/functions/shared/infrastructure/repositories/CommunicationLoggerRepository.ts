export class CommunicationLoggerRepository {
  async logInteraction(
    supabaseClient: any,
    merchantId: string,
    platform: 'whatsapp' | 'social',
    senderId: string,
    userMessage: string,
    aiResponse: string
  ): Promise<void> {
    const { error } = await supabaseClient
      .from('ai_communication_logs')
      .insert({
        merchant_id: merchantId,
        platform,
        sender_id: senderId,
        user_message: userMessage,
        ai_response: aiResponse
      });

    if (error) {
      console.error("CommunicationLoggerRepository Error:", error);
    }
  }
}
