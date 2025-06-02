// supabase/functions/reset-user-password/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', 
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const siteUrl = Deno.env.get('SITE_URL');


    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey || !siteUrl) {
      return new Response(JSON.stringify({ error: 'Missing Supabase or SITE_URL environment variables' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabaseClientForAuth = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user: callingUser }, error: userError } = await supabaseClientForAuth.auth.getUser(token);

    if (userError || !callingUser) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: userError?.message || 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (callingUser.user_metadata?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'User is not an admin' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Missing email in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      }
    });

    // Supabase's generateLink for 'recovery' type handles sending the email if an email provider is configured.
    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${siteUrl}/auth/update-password` // Ensure this page exists in your Next.js app
        }
    });


    if (resetError) {
      console.error('Supabase admin password reset error:', resetError);
      return new Response(JSON.stringify({ error: resetError.message || 'Failed to initiate password reset' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // The `data` object contains the user and properties of the link, but the email sending is handled by Supabase.
    return new Response(JSON.stringify({ message: 'Password recovery email initiated successfully.', details: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (e) {
    console.error('Unexpected error:', e);
    return new Response(JSON.stringify({ error: e.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
