import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Zernio webhook events typically have this structure (generalized)
interface ZernioWebhookEvent {
  event: string; // e.g. 'message.received', 'comment.created', 'review.created'
  timestamp: string;
  data: any;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Zernio Webhook Signature Verification (Security)
    // const signature = req.headers.get('x-zernio-signature');
    // const secret = Deno.env.get("ZERNIO_WEBHOOK_SECRET");
    // TODO: Implement HMAC SHA256 verification of the payload using the secret

    const payload: ZernioWebhookEvent = await req.json();
    console.log(`[Webhook Received] Event: ${payload.event}`);

    // Initialize Supabase Client with SERVICE_ROLE to bypass RLS for background ingestion
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Resolve Profile ID from Zernio Account ID
    // Most events contain an accountId or profileId indicating which business received the interaction.
    const zernioAccountId = payload.data?.accountId;
    let profileId = null;

    if (zernioAccountId) {
      const { data: accountData, error: accountError } = await supabase
        .from('social_accounts')
        .select('profile_id')
        .eq('zernio_account_id', zernioAccountId)
        .single();

      if (!accountError && accountData) {
        profileId = accountData.profile_id;
      } else {
        console.warn(`Zernio Account ID ${zernioAccountId} not mapped to any profile.`);
        // If not mapped, we might not be able to store it properly with RLS, or we use a fallback.
      }
    }

    // 3. Handle specific Zernio Events
    switch (payload.event) {
      
      case 'message.received':
      case 'message.sent': {
        const { conversationId, id: messageId, direction, message, senderName, platform } = payload.data;
        
        if (!profileId) throw new Error("Cannot process message without mapped profileId");

        // A. Upsert Conversation
        const { data: convData, error: convError } = await supabase
          .from('conversations')
          .upsert({
            profile_id: profileId,
            zernio_conversation_id: conversationId,
            platform: platform || 'unknown',
            participant_name: senderName || 'Bilinmeyen Kullanıcı',
            status: 'active'
          }, { onConflict: 'zernio_conversation_id' })
          .select('id')
          .single();

        if (convError) throw convError;

        // B. Insert Message
        const { error: msgError } = await supabase
          .from('messages')
          .insert({
            profile_id: profileId,
            conversation_id: convData.id,
            zernio_message_id: messageId,
            direction: direction, // 'incoming' or 'outgoing'
            content: message
          });

        if (msgError && msgError.code !== '23505') { // Ignore unique constraint violations (duplicates)
          throw msgError;
        }

        // C. TODO: Trigger the AI Bot to generate a reply if direction === 'incoming'
        // await fetch('https://.../functions/v1/gemini-chat', { ... });
        
        break;
      }

      case 'post.published':
      case 'post.created': {
        const { id: postId, message, mediaItems, platforms, createdAt, status } = payload.data;
        if (!profileId) throw new Error("Cannot process post without mapped profileId");

        const mediaList = mediaItems?.map((m: any) => m.url) || [];
        const platformList = platforms?.map((pl: any) => typeof pl === 'string' ? pl : pl.platform) || [];

        const { error: postError } = await supabase
          .from('posts')
          .insert({
            profile_id: profileId,
            zernio_post_id: postId,
            content: message || '',
            media_urls: mediaList,
            status: status || 'published',
            platforms: platformList,
            scheduled_for: createdAt || new Date().toISOString()
          });

        if (postError && postError.code !== '23505') throw postError;
        break;
      }

      case 'comment.created': {
        const { id: commentId, postId, message, fromName, platform } = payload.data;
        
        if (!profileId) throw new Error("Cannot process comment without mapped profileId");

        // Try to link to a known post, if available
        const { data: postData } = await supabase
          .from('posts')
          .select('id')
          .eq('zernio_post_id', postId)
          .single();

        const { error: commentError } = await supabase
          .from('comments')
          .insert({
            profile_id: profileId,
            post_id: postData?.id || null, // Null if the post wasn't created via our app
            zernio_post_id: postId,
            zernio_comment_id: commentId,
            username: fromName || 'Bilinmeyen',
            content: message,
            platform: platform || 'unknown'
          });

        if (commentError && commentError.code !== '23505') throw commentError;
        break;
      }

      case 'review.created': {
        const { id: reviewId, reviewerName, rating, text, platform } = payload.data;
        
        if (!profileId) throw new Error("Cannot process review without mapped profileId");

        const { error: reviewError } = await supabase
          .from('reviews')
          .insert({
            profile_id: profileId,
            zernio_review_id: reviewId,
            reviewer_name: reviewerName || 'Anonim',
            rating: rating || 5,
            content: text,
            platform: platform || 'google'
          });

        if (reviewError && reviewError.code !== '23505') throw reviewError;
        break;
      }

      default:
        console.log(`Unhandled Zernio Event: ${payload.event}`);
    }

    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });

  } catch (error) {
    console.error("Zernio Webhook Error:", error.message);
    // Important: Webhooks should usually return 200 to acknowledge receipt even if processing fails,
    // otherwise Zernio will keep retrying and might disable the webhook. 
    // Return 200 but log the error.
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    });
  }
});
