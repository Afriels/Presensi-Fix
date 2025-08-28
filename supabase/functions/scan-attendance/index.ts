// FIX: Removed invalid type reference. Added a manual declaration for the Deno global
// to make standard TypeScript compilers aware of the Deno-specific APIs which are
// available in the Supabase Functions runtime environment.
declare const Deno: {
  serve(handler: (req: Request) => Response | Promise<Response>): void;
  env: {
    get(key: string): string | undefined;
  };
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// !! PENTING: Ganti ini dengan password/kunci rahasia yang Anda inginkan.
// Ini akan menjadi "password" yang Anda masukkan di aplikasi App Inventor.
const API_SECRET_KEY = "KUNCI_RAHASIA_ANDA_DISINI_12345"; 

Deno.serve(async (req) => {
  // Tangani preflight request untuk CORS. Ini wajib ada.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Validasi Keamanan (Login Sederhana)
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${API_SECRET_KEY}`) {
      return new Response(JSON.stringify({ error: 'Akses ditolak. Kunci API tidak valid.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401, // Unauthorized
      });
    }

    // 2. Ambil data NIS dari request body
    const { nis } = await req.json();
    if (!nis) {
      throw new Error('NIS (Nomor Induk Siswa) tidak ditemukan dalam request.');
    }

    // 3. Buat koneksi ke Supabase (menggunakan kredensial service_role yang aman)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Masukkan data ke dalam tabel attendance_log
    const { error } = await supabaseClient
      .from('attendance_log')
      .insert({ nis: nis });

    if (error) {
      throw error;
    }

    // 5. Kirim respon sukses
    return new Response(JSON.stringify({ message: `Absensi untuk NIS ${nis} berhasil dicatat.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    // Tangani jika terjadi error
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
