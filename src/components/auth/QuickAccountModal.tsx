'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, Sparkles } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { signUpWithEmail, signInWithEmail, readPlayerPassport, savePlayerPassport, STANDARD_USER_AVATARS } from '../../lib/supabase/auth';

interface QuickAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickAccountModal({ isOpen, onClose, onSuccess }: QuickAccountModalProps) {
  const { locale } = useTranslation();
  const lang = locale === 'en' ? 'en' : 'fr';
  const [mode, setMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'REGISTER') {
        const result = await signUpWithEmail({
          email,
          password,
          displayName: pseudo || 'Initié',
          username: pseudo || 'Initié',
        });
        if (result?.error) {
          setErrorMsg(result.error.message || "Erreur lors de l'inscription");
        } else {
          // Attacher la progression invité au nouveau profil
          const currentPassport = readPlayerPassport();
          savePlayerPassport({
            pseudo: pseudo || currentPassport?.pseudo || 'Initié',
            email,
            experienceLevel: currentPassport?.experienceLevel || 'beginner',
            avatarUrl: currentPassport?.avatarUrl || STANDARD_USER_AVATARS[0].url,
            registeredAt: currentPassport?.registeredAt || new Date().toISOString(),
            supabaseSynced: true,
          });
          onSuccess?.();
          onClose();
        }
      } else {
        const result = await signInWithEmail({ email, password });
        if (result?.error) {
          setErrorMsg(result.error.message || 'Identifiants invalides');
        } else {
          onSuccess?.();
          onClose();
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0F141C] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-white">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Titre & Avantage */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold">
            <Sparkles className="w-3 h-3 text-amber-400" />
            {mode === 'REGISTER'
              ? (lang === 'fr' ? 'Conservez vos 10 000 PTS & Vos Trophées' : 'Keep your 10,000 PTS & Trophies')
              : (lang === 'fr' ? 'Connexion Joueur' : 'Player Login')}
          </div>
          <h2 className="text-xl font-bold mt-2">
            {mode === 'REGISTER'
              ? (lang === 'fr' ? 'Créer mon compte en 1 clic' : 'Create 1-click account')
              : (lang === 'fr' ? 'Ravi de vous revoir' : 'Welcome back')}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {mode === 'REGISTER'
              ? (lang === 'fr' ? 'Accès gratuit à vie, synchronisé sur tous vos écrans.' : 'Free lifetime access synced on all screens.')
              : (lang === 'fr' ? 'Entrez vos identifiants pour continuer.' : 'Enter your credentials to continue.')}
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === 'REGISTER' && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-neutral-300">
                {lang === 'fr' ? 'Pseudo Joueur' : 'Player Username'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder={lang === 'fr' ? 'Ex: Alexandre' : 'Ex: Alex'}
                  value={pseudo}
                  onChange={e => setPseudo(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-neutral-300">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="votre.email@exemple.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-neutral-300">
              {lang === 'fr' ? 'Mot de passe' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 mt-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-400/20 transition-all disabled:opacity-50"
          >
            {loading
              ? (lang === 'fr' ? 'Synchronisation...' : 'Syncing...')
              : mode === 'REGISTER'
              ? (lang === 'fr' ? 'Enregistrer mon profil' : 'Register Profile')
              : (lang === 'fr' ? 'Se connecter' : 'Sign in')}
          </button>
        </form>

        {/* Switch Inscription / Connexion */}
        <div className="text-center pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setMode(m => (m === 'REGISTER' ? 'LOGIN' : 'REGISTER'));
            }}
            className="text-xs text-neutral-400 hover:text-amber-400 transition-colors"
          >
            {mode === 'REGISTER'
              ? (lang === 'fr' ? 'Déjà un compte ? Connectez-vous' : 'Already have an account? Sign in')
              : (lang === 'fr' ? 'Pas encore de compte ? Inscrivez-vous' : 'No account yet? Register')}
          </button>
        </div>
      </div>
    </div>
  );
}

