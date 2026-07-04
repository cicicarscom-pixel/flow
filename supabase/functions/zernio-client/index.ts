import Zernio from "npm:@zernio/node";
import { createClient } from "npm:@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    const { action, payload = {} } = await req.json();

    // Initialize Zernio Client
    const zernioApiKey = Deno.env.get("ZERNIO_API_KEY");
    if (!zernioApiKey) throw new Error("ZERNIO_API_KEY is missing");
    const zernio = new Zernio({ apiKey: zernioApiKey });

    // Initialize Supabase Client (Service Role for DB operations bypassing RLS if needed, or Auth context)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // TODO: Extract user ID from req.headers.get('Authorization') to enforce security
    // const authHeader = req.headers.get('Authorization');
    // const { data: { user } } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''));

    let result = null;

    switch (action) {
      case 'get-connect-url': {
        // payload: { profileId? }
        // 1. Zernio profilini getir veya yoksa yarat
        let profileId = payload.profileId;
        if (!profileId) {
          console.log("No profileId provided. Listing profiles to find or create 'AI Esnaf Profil'...");
          let profiles = [];
          try {
            const listRes = await zernio.profiles.listProfiles();
            profiles = listRes.data?.profiles || listRes.profiles || listRes.data || [];
          } catch(e) {
            console.log("listProfiles error", e.message);
          }
          
          const existing = profiles.find((p: any) => p.name === 'AI Esnaf Profil');
          
          if (existing) {
             profileId = existing.id || existing.profileId || existing._id || existing.uuid;
          } else {
             const profileRes = await zernio.profiles.createProfile({ body: { name: 'AI Esnaf Profil' } });
             profileId = profileRes.data?.profile?.id || profileRes.data?.id || profileRes.id;
          }
        }
        
        // 2. Auth URL üret
        console.log("Getting connect URL for profileId:", profileId, "platform:", payload.platform);
        const urlRes = await zernio.connect.getConnectUrl({ 
          path: { platform: payload.platform },
          query: { 
            profileId, 
            ...(payload.redirectUrl ? { redirect_url: payload.redirectUrl } : {})
          } 
        });
        
        console.log("Connect URL response:", JSON.stringify(urlRes, null, 2));
        
        // Return EVERYTHING so the frontend doesn't miss the URL regardless of what it's named in v0.2.257
        result = { 
          ...urlRes,
          ...(urlRes.data || {}),
          authUrl: urlRes.data?.authUrl || urlRes.data?.url || urlRes.authUrl || urlRes.url,
          profileId 
        };
        break;
      }

      case 'sync-accounts': {
        const listRes = await zernio.profiles.listProfiles();
        const profiles = listRes.data?.profiles || listRes.profiles || listRes.data || [];
        const existing = profiles.find((p: any) => p.name === 'AI Esnaf Profil');
        
        if (!existing) {
          result = { accounts: [] };
          break;
        }
        
        const profileId = existing.id || existing.profileId || existing._id || existing.uuid;
        
        const accRes = await zernio.accounts.listAccounts({ query: { profileId } });
        const accounts = accRes.data?.accounts || accRes.accounts || accRes.data || [];
        
        // --- SUPABASE SYNC ---
        const { userId } = payload;
        if (userId && accounts.length > 0) {
          const mappedAccounts = accounts.map((acc: any) => ({
            profile_id: userId,
            zernio_account_id: acc._id || acc.id || acc.accountId || acc.uuid,
            platform: acc.platform || 'unknown',
            account_name: acc.username || acc.displayName || acc.name || acc.platform,
            status: 'active'
          }));
          
          const { error } = await supabase.from('social_accounts').upsert(
            mappedAccounts,
            { onConflict: 'zernio_account_id' }
          );
          if (error) {
            if (error.code === '42P10') {
              // UNIQUE constraint eksik — migration çalıştırın: supabase/migrations/20260629173000_social_accounts_unique_constraint.sql
              console.warn('[sync-accounts] UNIQUE constraint eksik. Geçici fallback aktif.');
              for (const acc of mappedAccounts) {
                const { data: ex } = await supabase.from('social_accounts')
                  .select('id').eq('zernio_account_id', acc.zernio_account_id).maybeSingle();
                if (!ex) {
                  const { error: iErr } = await supabase.from('social_accounts').insert(acc);
                  if (iErr) console.error('[sync-accounts] Insert error:', iErr);
                }
              }
            } else {
              console.error('[sync-accounts] Upsert error:', error);
            }
          }
        }
        
        result = { accounts, profileId };
        break;
      }

      case 'sync-posts': {
        const listRes = await zernio.profiles.listProfiles();
        const profiles = listRes.data?.profiles || listRes.profiles || listRes.data || [];
        const existing = profiles.find((p: any) => p.name === 'AI Esnaf Profil');
        
        if (!existing) {
          result = { posts: [] };
          break;
        }
        
        const profileId = existing.id || existing.profileId || existing._id || existing.uuid;
        
        const postsRes = await zernio.posts.listPosts({ query: { profileId } });
        const postsList = postsRes.data?.posts || postsRes.posts || postsRes.data || [];
        
        // --- SUPABASE SYNC ---
        const { userId } = payload;
        if (userId && postsList.length > 0) {
           const mappedPosts = postsList.map((p: any) => {
               let mediaList = p.mediaItems?.map((m: any) => m.url) || [];
               // Fallback: Instagram posts have 'picture' instead of 'mediaItems'
               if (mediaList.length === 0 && p.picture) mediaList = [p.picture];
               if (mediaList.length === 0 && p.image) mediaList = [p.image];
               if (mediaList.length === 0 && p.thumbnail) mediaList = [p.thumbnail];
               const platformList = p.platforms?.map((pl: any) => typeof pl === 'string' ? pl : pl.platform) || [];
               return {
                  profile_id: userId,
                  zernio_post_id: p._id || p.id,
                  content: p.content || '',
                  media_urls: mediaList,
                  status: p.status || 'published',
                  platforms: platformList,
                  scheduled_for: p.scheduledFor || p.createdAt || new Date().toISOString()
               };
            });
           
           // Check existing
           const { data: existingPosts } = await supabase.from('posts').select('zernio_post_id').eq('profile_id', userId);
           const existingIds = existingPosts?.map((p: any) => p.zernio_post_id) || [];
           
           // Insert missing
           const newPosts = mappedPosts.filter((p: any) => !existingIds.includes(p.zernio_post_id));
           if (newPosts.length > 0) {
              const { error } = await supabase.from('posts').insert(newPosts);
              if (error) console.error("Supabase insert error (posts):", error);
           }
        }
        
        result = { posts: postsList, profileId };
        break;
      }
      
      case 'get-inbox-pictures': {
        // Fast path: just get pictures for all posts (single API call)
        const listRes2 = await zernio.profiles.listProfiles();
        const profiles2 = listRes2.data?.profiles || listRes2.profiles || listRes2.data || [];
        const existing2 = profiles2.find((p: any) => p.name === 'AI Esnaf Profil');
        if (!existing2) { result = { pictures: {} }; break; }
        const profileId2 = existing2.id || existing2.profileId || existing2._id || existing2.uuid;
        const inboxRes2 = await zernio.comments.listInboxComments({ query: { profileId: profileId2 } });
        const posts2 = inboxRes2.data?.data || [];
        const pictures: Record<string, string> = {};
        posts2.forEach((p: any) => {
          if (p.id && p.picture) pictures[p.id] = p.picture;
        });
        result = { pictures, profileId: profileId2 };
        break;
      }

      case 'sync-comments': {
        const listRes = await zernio.profiles.listProfiles();
        const profiles = listRes.data?.profiles || listRes.profiles || listRes.data || [];
        const existing = profiles.find((p: any) => p.name === 'AI Esnaf Profil');
        
        if (!existing) {
          result = { comments: [] };
          break;
        }
        
        const profileId = existing.id || existing.profileId || existing._id || existing.uuid;
        
        // 1. Get posts that have comments
        const inboxRes = await zernio.comments.listInboxComments({ query: { profileId } });
        const commentedPosts = inboxRes.data?.data || [];
        const t0 = Date.now();
        console.log(`[sync-comments] START profileId=${profileId} postsWithComments=${commentedPosts.length}`);
        
        let allComments: any[] = [];
        
        // 2. Fetch comments for each post
        // We use Promise.all to fetch concurrently
        await Promise.all(commentedPosts.map(async (post: any) => {
           if (!post.id || !post.accountId) return;
           try {
              const commentsRes = await zernio.comments.getInboxPostComments({ 
                  path: { postId: post.id },
                  query: { accountId: post.accountId }
              });
               const commentsList = commentsRes.data?.comments || commentsRes.comments || [];
               
               // Debug: log actual post structure for first 2 posts
               if (allComments.length === 0) {
                  console.log("INBOX POST FIELDS:", JSON.stringify(Object.keys(post)));
                  console.log("INBOX POST DATA:", JSON.stringify({
                     id: post.id, picture: post.picture, image: post.image, 
                     thumbnail: post.thumbnail, media: post.media,
                     mediaUrl: post.mediaUrl, mediaItems: post.mediaItems,
                     platformPostId: post.platformPostId, platform: post.platform
                  }));
               }
               
               // Try ALL possible picture fields from inbox post
               let pictureUrl = post.picture 
                  || post.image 
                  || post.thumbnail 
                  || post.mediaUrl
                  || post.media?.[0]?.url 
                  || post.media?.[0]
                  || post.mediaItems?.[0]?.url
                  || null;
               

               // Format replies before adding to allComments
               const localMap = new Map();
               commentsList.forEach((c: any) => localMap.set(c.id || c._id, c));
               
               const enrichedComments = commentsList.map((c: any) => {
                  let content = c.message || c.content || c.text || '';
                  if (c.parentCommentId || c.isReply) {
                     const parentId = c.parentCommentId || c.parentId;
                     const parent = localMap.get(parentId);
                     if (parent && !content.startsWith('↳ @')) {
                        const pName = parent.from?.name || parent.from?.username || parent.username || parent.author?.name || 'Yorum';
                        content = `↳ @${pName}:\n${content}`;
                     } else if (!content.startsWith('↳ @')) {
                        content = `↳ @Yorum:\n${content}`;
                     }
                  }
                  return {
                     ...c,
                     message: content, // Override message with prefixed content
                     post: {
                        id: post.id,
                        content: post.content,
                        picture: pictureUrl,
                        accountId: post.accountId,
                        platform: post.platform || 'unknown'
                     }
                  };
               });
               console.log(`POST ${post.id} platform=${post.platform} picture=${pictureUrl ? 'YES:'+pictureUrl.substring(0,60) : 'NULL'} comments=${enrichedComments.length}`);
              allComments = [...allComments, ...enrichedComments];
           } catch (err) {
              console.error("Error fetching comments for post", post.id, err);
           }
        }));
        
        // 3. Update posts table with pictures from inbox (fix empty media_urls)
        const postPictures: Record<string, string> = {};
        commentedPosts.forEach((post: any) => {
           if (post.id && post.picture) postPictures[post.id] = post.picture;
        });
        
        if (Object.keys(postPictures).length > 0) {
           // Find posts with empty media_urls and update them
           const { data: emptyPosts } = await supabase
              .from('posts')
              .select('id, zernio_post_id, media_urls')
              .in('zernio_post_id', Object.keys(postPictures));
           
           if (emptyPosts) {
              await Promise.all(emptyPosts.map(async (ep) => {
                 if (!ep.media_urls || ep.media_urls.length === 0) {
                    const pic = postPictures[ep.zernio_post_id];
                    if (pic) {
                       await supabase
                          .from('posts')
                          .update({ media_urls: [pic] })
                          .eq('id', ep.id);
                    }
                 }
              }));
           }
        }
        
        // 4. Fix orphaned comments: post_id is NULL but zernio_post_id exists
        const { data: orphanedComments } = await supabase
           .from('comments')
           .select('id, zernio_post_id')
           .is('post_id', null)
           .not('zernio_post_id', 'is', null);
        
        if (orphanedComments && orphanedComments.length > 0) {
           const zPostIds = [...new Set(orphanedComments.map((c: any) => c.zernio_post_id))];
           const { data: matchingPosts } = await supabase
              .from('posts')
              .select('id, zernio_post_id')
              .in('zernio_post_id', zPostIds);
           
           if (matchingPosts) {
              const postMap: Record<string, string> = {};
              matchingPosts.forEach((p: any) => { postMap[p.zernio_post_id] = p.id; });
              
              await Promise.all(orphanedComments.map(async (oc) => {
                 const postId = postMap[oc.zernio_post_id];
                 if (postId) {
                    await supabase.from('comments').update({ post_id: postId }).eq('id', oc.id);
                 }
              }));
           }
        }
        
        // Sort all comments by date descending
        allComments.sort((a, b) => new Date(b.createdTime || b.createdAt).getTime() - new Date(a.createdTime || a.createdAt).getTime());
        
        console.log(`[sync-comments] END total=${allComments.length} duration=${Date.now()-t0}ms`);
        result = { comments: allComments, profileId };
        break;
      }
      
      case 'sync-messages': {
        const listRes = await zernio.profiles.listProfiles();
        const profiles = listRes.data?.profiles || listRes.profiles || listRes.data || [];
        const existing = profiles.find((p: any) => p.name === 'AI Esnaf Profil');
        
        if (!existing) {
          result = { conversations: [] };
          break;
        }
        
        const profileId = existing.id || existing.profileId || existing._id || existing.uuid;
        
        const inboxRes = await zernio.messages.listInboxConversations({ query: { profileId } });
        const convList = inboxRes.data?.data || [];
        
        // --- SUPABASE SYNC ---
        const { userId } = payload;
        if (userId && convList.length > 0) {
           const mappedMessages = convList.map((m: any) => {
              return {
                 conversation_id: m.id || m._id,
                 zernio_message_id: m.id || m._id,
                 direction: 'incoming',
                 content: m.snippet || m.text || '',
                 // Assuming profile_id works for users as we mapped it in posts
                 // profile_id: userId  <-- Wait, let's omit profile_id if it causes issues, or keep it.
              };
           });
           
           // Check existing
           const { data: existingMsgs } = await supabase.from('messages').select('zernio_message_id'); // We'll just check all for this user? RLS will handle or we just omit profile_id filter.
           const existingIds = existingMsgs?.map((m: any) => m.zernio_message_id) || [];
           
           const newMessages = mappedMessages.filter((m: any) => !existingIds.includes(m.zernio_message_id));
           if (newMessages.length > 0) {
              const { error } = await supabase.from('messages').insert(newMessages);
              if (error) console.error("Supabase insert error (messages):", error);
           }
        }
        
        result = { conversations: convList, profileId };
        break;
      }
      
      case 'sync-chat': {
        const { conversationId, accountId } = payload;
        if (!conversationId || !accountId) {
            throw new Error("conversationId and accountId are required for sync-chat");
        }
        const inboxRes = await zernio.messages.getInboxConversationMessages({ 
            path: { conversationId },
            query: { accountId }
        });
        
        result = { messages: inboxRes.data?.messages || inboxRes.messages || [] };
        break;
      }
      case 'sync-post-comments': {
        const { postId, accountId } = payload;
        if (!postId || !accountId) {
            throw new Error("postId and accountId are required for sync-post-comments");
        }
        const commentsRes = await zernio.comments.getInboxPostComments({ 
            path: { postId },
            query: { accountId }
        });
        
        result = { comments: commentsRes.data?.comments || commentsRes.comments || [] };
        break;
      }

      case 'create-post': {
        // Handle Base64 images by uploading them to Zernio first
        const finalMediaItems = [];
        if (payload.mediaItems && payload.mediaItems.length > 0) {
          for (const item of payload.mediaItems) {
            if (item.url && item.url.startsWith('data:')) {
               // Extract base64 and mime type
               const matches = item.url.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
               if (matches && matches.length === 3) {
                 const mimeType = matches[1];
                 const base64Data = matches[2];
                 
                 // Decode Base64 to Uint8Array in Deno
                 const binaryStr = atob(base64Data);
                 const bytes = new Uint8Array(binaryStr.length);
                 for (let i = 0; i < binaryStr.length; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                 }
                 
                 // Create Blob
                 const blob = new Blob([bytes], { type: mimeType });
                 
                 // Upload to Zernio
                 let uploadRes;
                 try {
                   uploadRes = await zernio.messages.uploadMediaDirect({
                      body: {
                         file: blob as any,
                         contentType: mimeType
                      }
                   });
                 } catch (uploadError) {
                   throw new Error("Zernio uploadMediaDirect Hatası: " + (uploadError.message || JSON.stringify(uploadError)));
                 }
                 
                 if (uploadRes?.data?.url || uploadRes?.url) {
                    finalMediaItems.push({
                       ...item,
                       url: uploadRes.data?.url || uploadRes.url
                    });
                 } else {
                    throw new Error("Resim yüklenemedi, Zernio'dan URL dönmedi: " + JSON.stringify(uploadRes));
                 }
               } else {
                 finalMediaItems.push(item);
               }
            } else {
               finalMediaItems.push(item);
            }
          }
        }

        const createPostPayload = {
          body: {
            title: payload.title,
            content: payload.content,
            platforms: payload.platforms,
            scheduledFor: payload.scheduledFor,
            publishNow: payload.publishNow,
            mediaItems: finalMediaItems.length > 0 ? finalMediaItems : undefined,
            tags: payload.tags
          }
        };

        try {
          const postData = await zernio.posts.createPost(createPostPayload);
          result = postData;
        } catch (postError) {
          throw new Error("Zernio createPost Hatası: " + (postError.message || JSON.stringify(postError)) + " | Payload: " + JSON.stringify(createPostPayload));
        }
        break;
      }

      case 'send-message': {
        const url = `https://api.zernio.com/v1/inbox/conversations/${payload.conversationId}/messages`;
        const fetchRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${zernioApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accountId: payload.accountId,
            message: payload.message
          })
        });
        
        if (!fetchRes.ok) {
          const errText = await fetchRes.text();
          throw new Error(`Zernio send-message API error: ${errText}`);
        }
        
        result = await fetchRes.json();
        break;
      }

      case 'reply-comment': {
        // First, automatically LIKE the comment (required by some platforms to make reply visible)
        if (payload.commentId) {
          const likeUrl = `https://api.zernio.com/v1/inbox/comments/${payload.postId}/${payload.commentId}/like`;
          try {
            await fetch(likeUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${zernioApiKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ accountId: payload.accountId })
            });
          } catch (e) {
            console.warn("Failed to auto-like comment:", e);
          }
        }

        const url = `https://api.zernio.com/v1/inbox/comments/${payload.postId}`;
        const fetchRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${zernioApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            accountId: payload.accountId,
            commentId: payload.commentId,
            message: payload.message
          })
        });
        
        if (!fetchRes.ok) {
          const errText = await fetchRes.text();
          throw new Error(`Zernio reply-comment API error: ${errText}`);
        }
        
        result = await fetchRes.json();
        break;
      }

      case 'get-youtube-insights': {
        result = await zernio.analytics.getYouTubeChannelInsights(payload);
        break;
      }
      case 'get-youtube-demographics': {
        result = await zernio.analytics.getYouTubeDemographics(payload);
        break;
      }
      case 'get-tiktok-insights': {
        result = await zernio.analytics.getTikTokAccountInsights(payload);
        break;
      }
      case 'get-youtube-daily-views': {
        result = await zernio.analytics.getYouTubeDailyViews(payload);
        break;
      }
      case 'get-linkedin-page-analytics': {
        result = await zernio.analytics.getLinkedInOrgAggregateAnalytics(payload);
        break;
      }
      case 'get-linkedin-post-stats': {
        result = await zernio.analytics.getLinkedInPostAnalytics(payload);
        break;
      }
      case 'get-linkedin-aggregate-stats': {
        result = await zernio.analytics.getLinkedInAggregateAnalytics(payload);
        break;
      }
      case 'get-instagram-insights': {
        result = await zernio.analytics.getInstagramAccountInsights(payload);
        break;
      }
      case 'get-instagram-demographics': {
        result = await zernio.analytics.getInstagramDemographics(payload);
        break;
      }
      case 'get-instagram-follower-history': {
        result = await zernio.analytics.getInstagramFollowerHistory(payload);
        break;
      }
      case 'get-gbp-search-keywords': {
        result = await zernio.analytics.getGoogleBusinessSearchKeywords(payload);
        break;
      }
      case 'get-gbp-performance': {
        result = await zernio.analytics.getGoogleBusinessPerformance(payload);
        break;
      }
      case 'get-facebook-insights': {
        result = await zernio.analytics.getFacebookPageInsights(payload);
        break;
      }
      case 'get-follower-stats': {
        result = await zernio.accounts.getFollowerStats(payload);
        break;
      }
      case 'get-daily-metrics': {
        result = await zernio.analytics.getDailyMetrics(payload);
        break;
      }
      case 'get-content-decay': {
        result = await zernio.analytics.getContentDecay(payload);
        break;
      }
      case 'get-post-timeline': {
        result = await zernio.analytics.getPostTimeline(payload);
        break;
      }
      case 'get-posting-frequency': {
        result = await zernio.analytics.getPostingFrequency(payload);
        break;
      }
      case 'get-best-times': {
        result = await zernio.analytics.getBestTimeToPost(payload);
        break;
      }
      case 'get-post-analytics': {
        result = await zernio.analytics.getPostTimeline(payload); // Fallback
        break;
      }

      case 'create-profile': {
        const { userId } = payload;
        if (!userId) throw new Error("Missing userId");
        
        const { error } = await supabase.from('profiles').upsert({ 
          id: userId, 
          business_name: 'AI Esnaf Profil',
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });
        
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'disconnect-account': {
        const { accountId } = payload;
        if (!accountId) throw new Error("Missing accountId");
        
        // Zernio'dan hesabı silmeye çalış
        let success = false;
        try {
           if (typeof zernio.accounts.deleteAccount === 'function') {
              await zernio.accounts.deleteAccount({ id: accountId });
              success = true;
           } else if (typeof zernio.accounts.removeAccount === 'function') {
              await zernio.accounts.removeAccount({ id: accountId });
              success = true;
           } else if (typeof zernio.connect.disconnect === 'function') {
              await zernio.connect.disconnect({ id: accountId });
              success = true;
           }
        } catch (err) {
           console.error("Zernio account deletion warning:", err.message);
        }

        // Eğer SDK üzerinden başarılı olamadıysa doğrudan REST API çağrısı dene
        if (!success) {
           try {
              const fetchRes = await fetch(`https://api.zernio.com/v1/accounts/${accountId}`, {
                 method: 'DELETE',
                 headers: {
                    'Authorization': `Bearer ${zernioApiKey}`,
                    'Content-Type': 'application/json'
                 }
              });
              if (!fetchRes.ok) {
                 console.warn("Direct Zernio DELETE failed:", await fetchRes.text());
              }
           } catch(e) {
              console.error("Direct fetch Zernio delete error:", e.message);
           }
        }

        // Supabase DB'den de sil (Garanti olması için)
        await supabase.from('social_accounts').delete().eq('zernio_account_id', accountId);

        result = { success: true };
        break;
      }

      default:
        throw new Error(`Bilinmeyen action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("Zernio Client Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
