# 🔐 Guide de Configuration Google OAuth & Supabase pour Backgammon Tour

> **Destinataire** : Fondateur & Équipe Technique Backgammon Tour.  
> **Objectif** : Activer l'authentification 1-clic Google / Gmail en production et en local sans friction.

---

## 1. Création des Identifiants sur Google Cloud Console

1. Rendez-vous sur la [Google Cloud Console](https://console.cloud.google.com/).
2. Sélectionnez votre projet ou créez un nouveau projet (ex: `backgammon-tour-prod`).
3. Dans le menu de gauche, accédez à **APIs & Services** > **Écran de consentement OAuth** :
   - Type d'utilisateur : **Externe**.
   - Nom de l'application : `Backgammon Tour`.
   - Adresse e-mail d'assistance utilisateur : votre adresse de contact.
   - Domaines autorisés : `supabase.co`, `backgammontour.com`.
   - Champs d'application (Scopes) : `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`.
4. Accédez ensuite à **APIs & Services** > **Identifiants** :
   - Cliquez sur **+ Créer des identifiants** > **ID client OAuth**.
   - Type d'application : **Application Web**.
   - Nom : `Backgammon Tour Web Client`.

### Origines JavaScript Autorisées
Ajoutez les origines suivantes :
- `http://localhost:3000` (développement local)
- `https://<VOTRE-PROJECT-REF>.supabase.co`
- `https://backgammontour.com`
- `https://www.backgammontour.com`

### URI de Redirection Autorisés (Obligatoire)
Ajoutez précisément ces URI :
- `https://<VOTRE-PROJECT-REF>.supabase.co/auth/v1/callback` *(Callback Supabase officiel)*
- `https://backgammontour.com/auth/callback` *(Callback Next.js de production)*
- `http://localhost:3000/auth/callback` *(Callback Next.js local)*

5. Cliquez sur **Créer** et copiez votre **ID Client** et votre **Code Secret Client**.

---

## 2. Configuration dans le Dashboard Supabase

1. Ouvrez votre projet sur le [Dashboard Supabase](https://app.supabase.com/).
2. Rendez-vous dans **Authentication** > **Providers** > **Google** :
   - Activez le bouton bascule **Enable Sign in with Google**.
   - Collez l'**ID Client Google** (Client ID).
   - Collez le **Secret Client Google** (Client Secret).
   - Vérifiez que l'URL de rappel affichée correspond bien à :  
     `https://<VOTRE-PROJECT-REF>.supabase.co/auth/v1/callback`.
   - Cliquez sur **Save**.

### Configuration des URL de Redirection (URL Configuration)
3. Toujours dans Supabase, rendez-vous dans **Authentication** > **URL Configuration** :
   - **Site URL** : `https://backgammontour.com` (ou `http://localhost:3000` en environnement de dev).
   - **Redirect URLs** : Ajoutez la liste des wildcards autorisés :
     - `http://localhost:3000/**`
     - `https://backgammontour.com/**`
     - `https://*.vercel.app/**`
   - Cliquez sur **Save**.

---

## 3. Variables d'Environnement de l'Application

Dans votre fichier `.env.local` (local) et dans les paramètres de déploiement Vercel / Netlify :

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<VOTRE-PROJECT-REF>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Fonctionnement du Flux d'Authentification

1. Le composant `UserAccountMenu.tsx` déclenche la connexion :
   ```ts
   await supabase.auth.signInWithOAuth({
       provider: 'google',
       options: {
           redirectTo: `${window.location.origin}/auth/callback`,
       },
   });
   ```
2. L'utilisateur valide sur l'écran sécurisé Google.
3. Google redirige vers le serveur Supabase qui échange le code OAuth contre une session chiffrée.
4. La route `src/app/auth/callback/route.ts` finalise l'échange de session côté Next.js et redirige l'utilisateur vers son plateau ou son tableau de bord avec statut synchronisé.
