import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { importPKCS8, SignJWT } from "https://deno.land/x/jose@v4.14.4/index.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to generate Google Access Token using Service Account JSON
async function getGoogleAccessToken(credentials: any): Promise<string> {
  const privateKey = await importPKCS8(credentials.private_key, 'RS256');
  const jwt = await new SignJWT({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.metadata.readonly',
    aud: 'https://oauth2.googleapis.com/token',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(privateKey);

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error('Failed to obtain access token from Google: ' + JSON.stringify(data));
  }
  return data.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing Authorization header');

    const reqBody = await req.json();
    const { folderId } = reqBody;

    if (!folderId) throw new Error('folderId is required');

    // Supabase client initialize
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) throw new Error('Unauthorized');

    // Google Service Account Authentication
    const serviceAccountStr = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountStr) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not configured in Edge Function secrets.");

    const credentials = JSON.parse(serviceAccountStr);
    const accessToken = await getGoogleAccessToken(credentials);

    // Step 1: Verify access to the folder via pure REST API
    const getFolderRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name&supportsAllDrives=true`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!getFolderRes.ok) {
      console.error("Google Drive API Access Error:", await getFolderRes.text());
      return new Response(JSON.stringify({ 
        error: "Klasöre erişim sağlanamadı. Lütfen klasörünüzü servis hesabıyla 'Editor' veya 'Görüntüleyici' olarak paylaştığınızdan emin olun."
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 2: Establish the Watch Channel via REST API
    const channelId = crypto.randomUUID();
    // Expiration set to 7 days (maximum allowed for Drive folders)
    const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const webhookUrl = `${supabaseUrl}/functions/v1/drive-webhook`;

    console.log(`Setting up watch channel for folder: ${folderId}`);

    const watchRes = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/watch?supportsAllDrives=true`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
        expiration: expiration.toString(),
        token: `userId=${user.id}`
      })
    });

    if (!watchRes.ok) {
      const errText = await watchRes.text();
      console.error("Watch Request Failed:", errText);
      throw new Error(`Watch API failed: ${errText}`);
    }

    const watchData = await watchRes.json();
    const resourceId = watchData.resourceId;

    // Step 3: Use Service Role Key to save to DB
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");

    await supabaseAdmin
      .from('drive_watch_channels')
      .delete()
      .eq('profile_id', user.id);

    const { error: insertError } = await supabaseAdmin
      .from('drive_watch_channels')
      .insert({
        profile_id: user.id,
        folder_id: folderId,
        channel_id: channelId,
        resource_id: resourceId,
        expiration: expiration.toString()
      });

    if (insertError) throw insertError;

    // Finally, update the profiles table
    await supabaseClient
      .from('profiles')
      .update({ google_drive_folder_id: folderId })
      .eq('id', user.id);

    return new Response(JSON.stringify({ success: true, channelId, resourceId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Setup Drive Watch Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
