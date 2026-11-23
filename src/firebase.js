import { initializeApp } from "firebase/app";
import { CustomProvider, initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";
import { browserLocalPersistence, indexedDBLocalPersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
export const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

// ---------- App Check ----------
// Desde 2 de novembro de 2026 o Firebase AI Logic (Gemini) exige App Check:
// cada pedido tem de levar uma prova de que vem do Vozzi. Sem prova válida o
// Gemini responde "401 Firebase App Check token is invalid".
//
// Duas formas de dar essa prova (configuradas no .env / .env.local):
//
// 1) Token de depuração (só pela consola Firebase, sem reCAPTCHA)
//      VITE_APPCHECK_DEBUG_TOKEN=<token gerado em App Check > Gerir tokens de depuração>
//    Simples e gratuito. Ideal para npm run dev e para demonstrações.
//    Atenção: se publicares o site com este token, ele fica visível no código
//    do site e qualquer pessoa o pode reutilizar para gastar a tua quota.
//
// 2) reCAPTCHA Enterprise (o fornecedor de produção para a web)
//      VITE_RECAPTCHA_ENTERPRISE_SITE_KEY=<ID da chave>
//    O token de depuração continua a ser usado no npm run dev.
const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN;
const enterpriseKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY;
const useDebug = Boolean(debugToken) && (import.meta.env.DEV || !enterpriseKey);

if (app && useDebug) {
  // Tem de ser definido ANTES de initializeAppCheck.
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
}

// No modo de depuração o SDK usa o token acima e nunca chama o fornecedor.
// O CustomProvider aqui é só um "lugar vazio", para não carregar o reCAPTCHA.
const debugOnlyProvider = new CustomProvider({
  getToken: () => Promise.reject(new Error("Sem fornecedor de produção: falta VITE_APPCHECK_DEBUG_TOKEN.")),
});

export const appCheck = app && (useDebug || enterpriseKey)
  ? initializeAppCheck(app, {
    provider: useDebug ? debugOnlyProvider : new ReCaptchaEnterpriseProvider(enterpriseKey),
    isTokenAutoRefreshEnabled: true,
  })
  : null;

if (app && !appCheck) {
  console.warn("[Vozzi] App Check não configurado: falta VITE_APPCHECK_DEBUG_TOKEN (ou "
    + "VITE_RECAPTCHA_ENTERPRISE_SITE_KEY) no .env. A normalização com o Gemini vai falhar.");
}
// A sessão fica guardada no navegador (IndexedDB e, se não houver, localStorage).
// Assim, ao fechar e voltar a abrir a aplicação, o utilizador continua com sessão
// iniciada até carregar em "Sair". A sessão é guardada por endereço: localhost:5173
// e vozzi-40d01.web.app têm sessões separadas.
export const auth = app
  ? initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] })
  : null;
export const db = app ? getFirestore(app) : null;
