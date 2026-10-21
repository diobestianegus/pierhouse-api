# Pierhouse

Pulizie condivise per Pie, Edo, Albi e Umbe. Interfaccia React su GitHub Pages; API e database D1 su un account Cloudflare indipendente da ChatGPT. I promemoria delle 18:00 usano un Cron Trigger Cloudflare con fuso Europe/Rome, inclusi i cambi di ora legale.

## Avvio

`npm ci`, copia `.env.example` in `.env.local` e imposta l'URL del backend, poi `npm run dev`.

## Pubblicazione da Safari (senza browser condiviso)

Apri [Deploy to Cloudflare](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Fdiobestianegus%2FPierhouse%2Ftree%2Fmigration%2Fgithub-pages) nel browser in cui hai già effettuato l’accesso a Cloudflare. Collega GitHub, scegli il nome della copia della repository e conferma la pubblicazione del Worker. Il database D1 viene predisposto da Cloudflare; lo schema e le chiavi push vengono creati in modo persistente e privato al primo avvio. Non servono chiavi API da inviare in chat.

Al termine conserva l’URL pubblico `https://pierhouse-api.<nome>.workers.dev`: serve per collegare GitHub Pages. Questo passaggio pubblica il backend, non trasferisce i dati esistenti e non attiva da solo il frontend. I dati privati vanno importati prima del passaggio definitivo. Le autorizzazioni a collegare GitHub vengono gestite direttamente da Cloudflare nel tuo browser.

## Attivazione del backend da computer

1. Accedi al tuo account Cloudflare con `npx wrangler login`.
2. Crea D1: `npx wrangler d1 create pierhouse`. Inserisci l'ID restituito in `backend/wrangler.jsonc`.
3. Applica lo schema: `npx wrangler d1 execute pierhouse --remote --config backend/wrangler.jsonc --file backend/schema.sql`.
4. Le chiavi VAPID vengono generate automaticamente e salvate soltanto nel database privato. Se preferisci chiavi gestite esternamente puoi configurare entrambi i secret `PUSH_VAPID_PUBLIC_KEY` e `PUSH_VAPID_PRIVATE_KEY`; non inserirli nel repository.
5. Esegui `npm run backend:deploy` e verifica `/health` sull'URL restituito.
6. Importa la copia privata dei dati con `npx wrangler d1 execute pierhouse --remote --config backend/wrangler.jsonc --file .migration/records.sql`. Il file non viene pubblicato nel repository. Prima del passaggio definitivo aggiorna il backup per non perdere modifiche recenti.

## GitHub Pages

Imposta `VITE_API_BASE_URL` nelle **Settings → Secrets and variables → Actions → Variables** della repository. In **Settings → Pages** seleziona **GitHub Actions**. Il workflow pubblica solo quando il backend è stato configurato. Il percorso base predefinito è `/Pierhouse/`.

## Voce e notifiche

Gli audio Chatterbox sono salvati in `public/voices/chatterbox` e associati al testo in `lib/chatterbox-clips.json`. Le battute cambiate richiedono un nuovo audio. La voce del dispositivo rimane un'opzione esplicita.

Sul nuovo dominio ogni telefono deve aggiungere nuovamente l'app alla Home e autorizzare le notifiche. Le registrazioni push del vecchio dominio non si trasferiscono. Il pulsante di prova verifica la ricezione effettiva.

## Verifiche

`npm run build` e `npm run backend:check`. Quest'ultimo prepara il Worker senza pubblicarlo. Nessuna chiave, registrazione push o copia privata delle assenze deve essere inclusa nel repository.
