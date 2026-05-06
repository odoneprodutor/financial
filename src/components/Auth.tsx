import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isResetMode) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'E-mail de recuperação enviado!' });
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Verifique seu e-mail para confirmar o cadastro!' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Ocorreu um erro na autenticação.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-12">
          <div className="w-16 h-16 border border-white/20 flex items-center justify-center text-xl font-serif italic rounded-full text-white mx-auto mb-6">
            F.N
          </div>
          <h1 className="text-4xl font-serif italic text-white tracking-tight mb-2">Fortuna Financial</h1>
          <p className="text-[10px] uppercase tracking-[0.4em] opacity-30">Acesso Restrito ao Estrategista</p>
        </div>

        <div className="bg-[#0d0d0d] border border-white/5 p-10 rounded-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          
          <form onSubmit={handleAuth} className="space-y-6">
            <AnimatePresence>
              {isSignUp && !isResetMode && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                >
                  <label className="text-[10px] uppercase tracking-widest opacity-30 mb-2 block font-bold">Nome Completo</label>
                  <div className="relative">
                    <Sparkles className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                    <input 
                      type="text"
                      required={isSignUp}
                      className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm focus:outline-none focus:border-white/30 text-white placeholder:opacity-20"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div>
              <label className="text-[10px] uppercase tracking-widest opacity-30 mb-2 block font-bold">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                <input 
                  type="email"
                  required
                  className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm focus:outline-none focus:border-white/30 text-white placeholder:opacity-20"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {!isResetMode && (
              <div>
                <label className="text-[10px] uppercase tracking-widest opacity-30 mb-2 block font-bold">Senha de Acesso</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                  <input 
                    type="password"
                    required={!isResetMode}
                    className="w-full bg-white/5 border border-white/10 p-4 pl-12 text-sm focus:outline-none focus:border-white/30 text-white placeholder:opacity-20"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {!isSignUp && (
                  <button 
                    type="button"
                    onClick={() => setIsResetMode(true)}
                    className="text-[9px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity mt-2 block ml-auto"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
            )}

            <AnimatePresence>
              {message && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={cn(
                    "p-4 text-[10px] uppercase tracking-widest text-center",
                    message.type === 'success' ? "text-[#10b981] bg-[#10b981]/5" : "text-[#f87171] bg-[#f87171]/5"
                  )}
                >
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black text-[10px] uppercase tracking-[0.3em] font-bold py-5 flex items-center justify-center gap-3 transition-all hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                isResetMode ? "Enviar Recuperação" : (isSignUp ? "Criar Credenciais" : "Entrar no Sistema")
              )}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            {isResetMode ? (
              <button 
                onClick={() => setIsResetMode(false)}
                className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
              >
                Voltar para o Login
              </button>
            ) : (
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[10px] uppercase tracking-widest opacity-30 hover:opacity-100 transition-opacity"
              >
                {isSignUp ? "Já possui acesso? Faça Login" : "Não tem conta? Solicite Acesso"}
              </button>
            )}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-[8px] uppercase tracking-[0.2em] opacity-20 flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" /> Criptografia de Ponta a Ponta • Supabase Auth
          </p>
        </div>
      </motion.div>
    </div>
  );
}
