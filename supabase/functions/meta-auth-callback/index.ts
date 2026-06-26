import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const urlObj = new URL(req.url);
  const isGet = req.method === 'GET';

  const handleResponse = (data: any, status: number) => {
    if (isGet) {
      if (status === 200 && data.success) {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': 'aiesnaf://redirect?success=true'
          }
        });
      } else {
        const errMsg = data.error || 'An error occurred during authentication';
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `aiesnaf://redirect?success=false&error=${encodeURIComponent(errMsg)}`
          }
        });
      }
    } else {
      return new Response(JSON.stringify(data), {
        status: status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  };

  try {
    let authCode: string | null = null;
    let userId: string | null = null;
    let redirectUri: string | null = null;

    if (isGet) {
      // Check for Facebook cancellation or error parameters
      const errorParam = urlObj.searchParams.get('error');
      const errorDesc = urlObj.searchParams.get('error_description');
      if (errorParam || errorDesc) {
        const fullError = errorDesc || errorParam || 'User cancelled or login failed';
        return handleResponse({ success: false, error: fullError }, 400);
      }

      authCode = urlObj.searchParams.get('code');
      const state = urlObj.searchParams.get('state') || '';
      
      // Parse state to extract userId. Format: `${randomState}_${userId}`
      const lastUnderscore = state.lastIndexOf('_');
      if (lastUnderscore !== -1) {
        userId = state.substring(lastUnderscore + 1);
      } else {
        userId = state;
      }
      
      redirectUri = `${urlObj.origin}${urlObj.pathname}`;
    } else {
      const body = await req.json();
      authCode = body.authCode;
      userId = body.userId;
      redirectUri = body.redirectUri;
    }

    if (!authCode || !userId) {
      throw new Error("Missing authCode or userId");
    }

    const metaAppId = Deno.env.get("META_APP_ID");
    const metaAppSecret = Deno.env.get("META_APP_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!metaAppId || !metaAppSecret) {
      throw new Error("Missing META_APP_ID or META_APP_SECRET in Edge Function environment variables");
    }

    const targetRedirectUri = redirectUri || "aiesnaf://redirect";

    console.log(`Exchanging authCode for permanent token. Redirect URI: ${targetRedirectUri}, userId: ${userId}`);

    // 1. Exchange the authCode for the access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${metaAppId}` +
      `&client_secret=${metaAppSecret}` +
      `&redirect_uri=${encodeURIComponent(targetRedirectUri)}` +
      `&code=${authCode}`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokenData.error || tokenData)}`);
    }

    const accessToken = tokenData.access_token;
    console.log("Access token successfully acquired from Meta Graph API");

    // 2. Fetch User's WhatsApp Business Accounts (WABA ID)
    const wabaUrl = `https://graph.facebook.com/v18.0/me/whatsapp_business_accounts?access_token=${accessToken}`;
    const wabaResponse = await fetch(wabaUrl);
    const wabaData = await wabaResponse.json();

    if (!wabaResponse.ok || wabaData.error) {
      throw new Error(`Failed to retrieve WhatsApp Business Accounts: ${JSON.stringify(wabaData.error || wabaData)}`);
    }

    const accounts = wabaData.data;
    if (!accounts || accounts.length === 0) {
      throw new Error("No WhatsApp Business Accounts found for the authenticated user");
    }

    const wabaId = accounts[0].id;
    console.log(`Successfully retrieved WABA ID: ${wabaId}`);

    // 3. Fetch Phone Numbers associated with the WABA ID
    const phoneUrl = `https://graph.facebook.com/v18.0/${wabaId}/phone_numbers?access_token=${accessToken}`;
    const phoneResponse = await fetch(phoneUrl);
    const phoneData = await phoneResponse.json();

    if (!phoneResponse.ok || phoneData.error) {
      throw new Error(`Failed to retrieve Phone Numbers: ${JSON.stringify(phoneData.error || phoneData)}`);
    }

    const phoneNumbers = phoneData.data;
    if (!phoneNumbers || phoneNumbers.length === 0) {
      throw new Error(`No Phone Numbers found associated with WhatsApp Business Account ID: ${wabaId}`);
    }

    const phoneNumberId = phoneNumbers[0].id;
    const displayPhone = phoneNumbers[0].display_phone_number;
    console.log(`Successfully retrieved Phone Number ID: ${phoneNumberId} (${displayPhone})`);

    // 4. Update the user's record in Supabase profiles table
    console.log(`Updating Supabase profile for user ID: ${userId}`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        whatsapp_access_token: accessToken,
        whatsapp_business_account_id: wabaId,
        whatsapp_phone_number_id: phoneNumberId,
        phone_number: displayPhone ? `+${displayPhone.replace(/\D/g, '')}` : null
      })
      .eq('id', userId);

    if (updateError) {
      throw updateError;
    }

    console.log("Supabase profile successfully updated with Meta credentials");

    return handleResponse({ 
      success: true, 
      whatsapp_business_account_id: wabaId, 
      whatsapp_phone_number_id: phoneNumberId 
    }, 200);

  } catch (error) {
    console.error("[Meta Callback Error]:", error.message);
    return handleResponse({ success: false, error: error.message }, 500);
  }
});
