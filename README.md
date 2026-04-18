# Passforge (KeyForge)

A modern password and passphrase generator that runs in the browser. Generation is entirely client-side; secrets are never sent to this app’s server.

---

## Features

| | |
| --- | --- |
| **Password mode** | Length, upper/lowercase, digits, symbols, and optional exclusion of ambiguous characters (`0`, `O`, `l`, `I`, etc.) |
| **Passphrase** | BIP39 English wordlist; word count, separator (space, hyphen, dot), optional capitalization |
| **Entropy** | Approximate strength in bits with a plain-language label |
| **Have I Been Pwned** | Optional breach check: only the first 5 hex characters of the SHA-1 hash are sent to the API ([k-anonymity](https://www.troyhunt.com/ive-just-launched-pwned-passwords-version-2/)) |
| **UI** | Dark / light theme, copy to clipboard, responsive layout |

---

## Security & privacy

- Randomness: `crypto.getRandomValues` plus **rejection sampling** to avoid modulo bias (`randomIntBelow`).
- Generated passwords and passphrases are **not persisted by this application’s server**; they live in memory until you leave or refresh the page (browser-dependent).
- With Pwned checking enabled, the **full password still never leaves your device**; only the prefix required by HIBP’s range API is transmitted.

For high-value accounts, prefer a hardware key or a trusted password manager when possible; this tool is for fast, transparent generation.

---

## Tech stack

- [Next.js](https://nextjs.org/) 16 (App Router)
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other commands

```bash
npm run build   # production build
npm run start   # run the production server
npm run lint    # ESLint
```

---

## Project layout

```
src/
├── app/                
├── components/
│   └── KeyForgeApp.tsx  
└── lib/
    ├── char-pools.ts          
    ├── generate-password.ts   
    ├── generate-passphrase.ts  
    ├── password-entropy.ts    
    ├── pwned-check.ts         
    └── secure-random.ts       
```
<img width="1462" height="982" alt="Ekran görüntüsü 2026-04-18 233810" src="https://github.com/user-attachments/assets/dccd9365-b702-4699-9775-d5832c0fcd29" />

---

## Deployment

See the [Next.js deployment guide](https://nextjs.org/docs/app/building-your-application/deploying)—for example host the output of `npm run build` on [Vercel](https://vercel.com/).

---

## License

If the repository has no `LICENSE` file, add one that matches how you want others to use the project.
