import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url('EXPO_PUBLIC_SUPABASE_URL deve ser uma URL válida.'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'EXPO_PUBLIC_SUPABASE_ANON_KEY é obrigatória.'),
  EXPO_PUBLIC_RECAPTCHA_SITE_KEY: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Variáveis de ambiente inválidas ou faltando:", _env.error.format());
  throw new Error("Invalid Environment Variables - Verifique o arquivo .env");
}

export const ENV = _env.data;
