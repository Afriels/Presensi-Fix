// supabase/functions/_shared/cors.ts

// Header ini memberitahu browser bahwa request dari domain manapun (*) diizinkan.
// Ini juga mendefinisikan header apa saja yang boleh dikirim oleh klien.
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
