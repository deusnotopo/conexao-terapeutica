import { supabase } from '../lib/supabase';
import { Result } from '../lib/result';
import { Platform } from 'react-native';

// URL base do app — web usa Firebase Hosting, nativo usa deep link
const APP_URL = Platform.OS === 'web'
  ? 'https://conexao-unicornio.web.app'
  : 'conexaoterapeutica://';

// Use a loose type to accommodate Supabase's complex auth union types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AuthData = any;

export const authService = {
  async signIn(email: string, password: string): Promise<Result<AuthData>> {
    if (!email || !password) {
      return Result.fail('Por favor, preencha o email e senha.');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) return Result.fail(error.message);
      return Result.ok(data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao fazer login');
    }
  },

  async signUp(email: string, password: string, fullName: string): Promise<Result<AuthData>> {
    if (!email || !password || !fullName) {
      return Result.fail('Por favor, preencha todos os campos.');
    }
    if (password.length < 6) {
      return Result.fail('A senha deve ter pelo menos 6 caracteres.');
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName },
          // Supabase envia o link de confirmação apontando para esta URL.
          // Deve estar na whitelist de Redirect URLs no painel do Supabase.
          emailRedirectTo: APP_URL,
        },
      });

      if (error) return Result.fail(error.message);
      return Result.ok(data);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao criar conta');
    }
  },

  async signOut(): Promise<Result<true>> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao sair');
    }
  },

  async resetPassword(email: string): Promise<Result<true>> {
    if (!email) return Result.fail('Por favor, informe seu e-mail.');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: Platform.OS === 'web'
          ? `${APP_URL}/reset-password`
          : 'conexaoterapeutica://reset-password',
      });
      if (error) return Result.fail(error.message);
      return Result.ok(true);
    } catch (e: any) {
      return Result.fail(e?.message || 'Erro ao enviar e-mail de recuperação.');
    }
  },
};
