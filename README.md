<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TILLIT Parceiro+

Plataforma de indicação premium para o ecossistema TILLIT.

## Executar Localmente

**Pré-requisitos:** Node.js

1. Instalar dependências:
   ```bash
   npm install
   ```

2. Configurar variáveis de ambiente: copie `.env.example` para `.env.local` e preencha as credenciais do Firebase:
   ```bash
   cp .env.example .env.local
   ```

   Variáveis necessárias para Firebase (Firestore):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

3. Criar banco Firestore no [Console Firebase](https://console.firebase.google.com) e habilitar Firestore. Se usar consultas com filtro por parceiro, faça o deploy dos índices:
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. Rodar o app:
   ```bash
   npm run dev
   ```
