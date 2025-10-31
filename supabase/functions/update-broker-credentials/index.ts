import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logError, createErrorResponse } from '../_shared/errorHandler.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`[update-broker-credentials] Request from user: ${user.id}`);

    const { account_no, app_code } = await req.json();

    // Validate inputs
    if (!account_no || account_no.trim().length === 0) {
      throw new Error('Account number is required');
    }

    if (!app_code || app_code.trim().length === 0) {
      throw new Error('App code is required');
    }

    console.log(`[update-broker-credentials] Updating credentials for account: ${account_no}`);

    // Update secrets using Supabase Admin API
    const supabaseAdminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Store credentials using encryption function (handles encryption if key is configured)
    const { error: upsertError } = await supabaseAdminClient.rpc(
      'encrypt_and_store_broker_credentials',
      {
        p_user_id: user.id,
        p_account_no: account_no.trim(),
        p_app_code: app_code.trim(),
      }
    );

    if (upsertError) {
      console.error('[update-broker-credentials] Error upserting credentials:', upsertError);
      throw new Error(`Failed to save credentials: ${upsertError.message}`);
    }

    console.log(`[update-broker-credentials] Credentials updated successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Credentials saved successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    logError('update-broker-credentials', error, { 
      hasAuthHeader: !!req.headers.get('Authorization') 
    });
    
    return createErrorResponse(error, 400, corsHeaders);
  }
});