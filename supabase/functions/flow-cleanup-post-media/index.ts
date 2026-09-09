import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const FORCE_DELETE_DAYS = 7;
const WARNING_THRESHOLD = 15;

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all profiles that have pending supabase storage posts
    const { data: posts, error: fetchError } = await supabase
      .from('posts')
      .select('id, profile_id, zernio_post_id, media_storage_source, storage_bucket, storage_path, force_delete_at')
      .eq('media_storage_source', 'supabase')
      .not('storage_path', 'is', null)
      .not('storage_bucket', 'is', null);

    if (fetchError) throw fetchError;
    if (!posts || posts.length === 0) {
      return new Response(JSON.stringify({ message: "No pending posts found." }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Group posts by profile_id to invoke sync-posts once per profile
    const profileIds = [...new Set(posts.map(p => p.profile_id))];

    for (const profileId of profileIds) {
      // Düzeltme 2: Zernio bağlantı kodunu kopyalamamak için mevcut sync-posts çağrısını kullanıyoruz
      const { error: invokeError } = await supabase.functions.invoke('zernio-client', {
        body: { action: 'sync-posts', payload: { profileId } }
      });

      if (invokeError) {
         console.error(`Error syncing posts for profile ${profileId}:`, invokeError);
         continue; // skip cleanup for this profile if sync fails
      }

      // Re-fetch the updated posts for this profile
      const { data: updatedPosts } = await supabase
        .from('posts')
        .select('id, media_urls, force_delete_at, storage_bucket, storage_path')
        .eq('profile_id', profileId)
        .eq('media_storage_source', 'supabase');

      if (!updatedPosts) continue;

      let pendingCountForProfile = 0;

      for (const post of updatedPosts) {
        // Zernio linki geldi mi kontrolü (supabase string'i içermeyen geçerli link var mı?)
        const mediaUrls = post.media_urls || [];
        const hasZernioLink = mediaUrls.some(url => url.startsWith('http') && !url.includes('.supabase.co/storage/'));

        if (hasZernioLink) {
          // Zernio'dan link gelmiş, geçici storage silinmeli
          await supabase.storage.from(post.storage_bucket).remove([post.storage_path]);
          await supabase.from('posts').update({
            media_storage_source: 'zernio',
            storage_deleted_at: new Date().toISOString()
          }).eq('id', post.id);
        } else {
          // Link yok, zaman aşımı kontrolü
          const now = new Date();
          const forceDeleteAt = post.force_delete_at ? new Date(post.force_delete_at) : new Date(now.getTime() + FORCE_DELETE_DAYS * 24 * 60 * 60 * 1000);

          if (now >= forceDeleteAt) {
             // 4. Şart: Zorla Silme (Force-Delete) Yolu
             await supabase.storage.from(post.storage_bucket).remove([post.storage_path]);
             await supabase.from('posts').update({
                media_storage_source: 'deleted',
                storage_deleted_at: now.toISOString()
             }).eq('id', post.id);

             // Bildirim at
             await supabase.from('notifications').insert({
               profile_id: profileId,
               title: 'Depolama Temizliği',
               message: `Gönderi için Zernio kalıcı bağlantı sağlamadı, medya otomatik silindi.`,
               type: 'storage_auto_delete'
             });
          } else {
             pendingCountForProfile++;
          }
        }
      }

      // 1. Şart: Tekrar Önleme (No-Spam) Erken Uyarı Bildirimi
      if (pendingCountForProfile >= WARNING_THRESHOLD) {
         // Son 24 saat içinde aynı türde (storage_warning) ve okunmamış bildirim var mı?
         const { data: recentWarnings } = await supabase
           .from('notifications')
           .select('id')
           .eq('profile_id', profileId)
           .eq('type', 'storage_warning')
           .eq('is_read', false)
           .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
           .limit(1);

         if (!recentWarnings || recentWarnings.length === 0) {
            await supabase.from('notifications').insert({
               profile_id: profileId,
               title: 'Depolama Uyarısı',
               message: `${pendingCountForProfile} gönderi hâlâ geçici depoda tutuluyor, incelemek ister misiniz?`,
               type: 'storage_warning'
            });
         }
      }
    }

    return new Response(JSON.stringify({ success: true, processedProfiles: profileIds.length }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
