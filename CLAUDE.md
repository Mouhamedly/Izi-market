# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projet

IZI Market : CRM commercial WhatsApp avec assistant IA (prospects, inbox, devis, rendez-vous, relances, prospection Google Maps). Interface et code commentés en français. Marque de démo : « Welma Digital ». Déployé sur Vercel depuis `github.com/Mouhamedly/Izi-market` (branche `main`).

## Commandes

```bash
npm run dev        # serveur de dev sur http://localhost:3000
npm run build      # build de production (à lancer pour vérifier avant un push)
npm run lint       # ESLint (config next/core-web-vitals)
npx tsc --noEmit   # vérification des types
```

Aucun framework de test n'est installé. Pour tester le pipeline IA sans Meta : `POST /api/simulator` (ou le modal simulateur dans l'inbox).

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 (`app/globals.css`, pas de `tailwind.config`) · Supabase (`@supabase/ssr`) · lucide-react. Alias d'import : `@/*` → racine du projet.

## Architecture

### Deux modes de fonctionnement : démo vs Supabase
`isSupabaseConfigured()` ([lib/supabase/client.ts](lib/supabase/client.ts)) décide de tout. Si les variables Supabase sont absentes ou contiennent `placeholder-`, l'app tourne en **mode démo** :
- côté client, les données viennent de [lib/mock-data.ts](lib/mock-data.ts) et sont persistées dans `localStorage` (clés `izi_*`) ;
- côté serveur, le pipeline utilise `INITIAL_BUSINESS` et ne touche pas la base.

Toute nouvelle fonctionnalité doit gérer les deux chemins. Les clients Supabase retombent sur des URL/clés `placeholder-` au lieu de planter, pour que le build Vercel passe sans variables d'environnement.

### État client : `lib/store.tsx`
Un seul contexte React (`AppProvider` / `useApp`) monté dans [app/(app)/layout.tsx](app/(app)/layout.tsx) détient toutes les entités (business, contacts, conversations, messages, FAQ, catalogue, rendez-vous, devis) et toutes les actions de mutation. Chaque action met à jour l'état local puis écrit dans Supabase si configuré. Les pages sous `app/(app)/app/*` sont des composants client qui consomment ce contexte — il n'y a pas de couche de data-fetching serveur pour ces pages. Le business courant est résolu via la table `members` (user → business_id), avec repli sur le premier business.

### Pipeline des messages entrants
`/api/whatsapp/webhook` (vérif HMAC via `WHATSAPP_APP_SECRET`) et `/api/simulator` appellent tous deux `processIncomingMessage` ([lib/ai/pipeline.ts](lib/ai/pipeline.ts)) : résolution du business (par `businessId` ou `wa_phone_number_id`) → anti-doublon sur `wa_message_id` → création/màj contact et conversation → réponse IA → éventuel rendez-vous ou passage à un humain (handoff). Le webhook renvoie toujours 200 pour éviter les relances Meta. Le pipeline utilise le client **admin** (service role) car il n'y a pas de session utilisateur.

### Assistant IA : `lib/ai/assistant.ts`
`generateAiReply` essaie dans l'ordre : OpenAI (`gpt-4o-mini`) → Anthropic → réponse locale par mots-clés (`generateLocalFallbackReply`). Les fournisseurs utilisent du function calling (réservation de RDV, qualification, handoff). Le contexte injecté = business, contact, historique, FAQ, catalogue.

### Autres modules `lib/`
- `whatsapp.ts` : signature, parsing du payload Meta, envoi de texte.
- `calendar.ts` + `/api/calendar/*` : OAuth Google Calendar, création d'événements, liens Meet, export `.ics`.
- `followup.ts` : éligibilité et génération des relances (jours d'inactivité par statut).
- `quotes.ts` : totaux, numérotation et message WhatsApp des devis (montants en FCFA). Page publique d'un devis : `app/p/[id]`.
- `importer.ts` : import CSV/TSV (contacts, catalogue, FAQ), normalisation des numéros (indicatif Sénégal par défaut), sauvegarde/restauration JSON.
- `/api/apify/google-maps` : scraping Google Maps via l'acteur Apify `compass~crawler-google-places`, utilisé par `components/leads/GoogleMapsScraper.tsx`.

### Base de données
Schéma dans `supabase/migrations/` (à appliquer manuellement dans l'éditeur SQL Supabase, pas de CLI configurée). Les types TypeScript correspondants sont écrits à la main dans [types/database.ts](types/database.ts) — les mettre à jour en même temps qu'une migration. Deux fichiers portent le préfixe `0003_` ; numéroter la prochaine migration `0004_`.

Statuts du pipeline commercial (`PipelineStatus`) et mode de conversation (`ConversationMode` : IA / humain) sont définis dans `types/database.ts` et utilisés partout dans l'UI.

## Points d'attention

- Variables d'environnement : voir `.env.example` (Supabase, Anthropic, OpenAI, WhatsApp, Apify, `NEXT_PUBLIC_APP_URL`).
- Le middleware Next.js a été retiré volontairement (erreur `MIDDLEWARE_INVOCATION_FAILED` sur Vercel) : ne pas en réintroduire sans tester le déploiement. La protection des routes se fait côté client.
- `lib/ai/assistant.ts` et `app/api/apify/google-maps/route.ts` contiennent des clés API codées en dur (base64) comme valeurs de repli. Ne pas en ajouter d'autres ; les secrets doivent passer par les variables d'environnement.
