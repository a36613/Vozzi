import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase.js";

// Estrutura no Firestore:
//   buttons/{id}                  botões pré-definidos (só leitura na app)
//     color, icon, isDefault, name, text
//   users/{uid}                   perfil do utilizador
//     name
//   users/{uid}/ubuttons/{id}     botões criados pelo utilizador
//     color, emoji, name, text
export const DEFAULT_BUTTONS = "buttons";
export const USERS = "users";
export const USER_BUTTONS = "ubuttons";

// Cores pastel do design. A primeira é a cor por omissão de um botão novo.
export const BUTTON_COLORS = [
  "#CCE1FF", "#FFF0BC", "#FFD3E1", "#CBF0E3", "#E1D8FF", "#FFE4C9",
  "#D0F1F8", "#E1E7F2", "#F7DDED", "#D7F0F1", "#EDF0FF",
];
export const DEFAULT_COLOR = BUTTON_COLORS[0];

export const isHexColor = (value) => /^#[0-9A-Fa-f]{6}$/.test(value || "");

// Cores fortes (ex.: "#4F46E5") são clareadas para o fundo do cartão ficar
// pastel como no design; cores já claras são usadas tal como estão.
export function cardBackground(color) {
  if (!isHexColor(color)) return "#EDF0FF";
  const rgb = [1, 3, 5].map((i) => Number.parseInt(color.slice(i, i + 2), 16));
  const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  if (luminance > 0.78) return color;
  const mixed = rgb.map((c) => Math.round(c * 0.28 + 255 * 0.72));
  return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

// ---------- Limites dos campos do botão ----------
// Símbolo: um emoji OU uma palavra. Nome e texto: até 3 palavras curtas.
export const MAX_WORDS = 3;
export const MAX_WORD_LENGTH = 14;
export const MAX_SYMBOL_WORD_LENGTH = 12;
export const MAX_TEXT_LENGTH = 200;

const segmenter = typeof Intl !== "undefined" && Intl.Segmenter
  ? new Intl.Segmenter("pt", { granularity: "grapheme" })
  : null;
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

// Divide em "carateres visíveis": 👨‍👩‍👧 conta como um só.
export function graphemes(value) {
  if (segmenter) return [...segmenter.segment(value)].map((part) => part.segment);
  return Array.from(value);
}

export const isEmoji = (value) => {
  const parts = graphemes((value || "").trim());
  return parts.length === 1 && EMOJI.test(parts[0]);
};

export const words = (value) => (value || "").trim().split(/\s+/).filter(Boolean);
export const cleanSpaces = (value) => (value || "").trim().replace(/\s+/g, " ");

const SINGLE_WORD = new RegExp(`^[\\p{L}\\p{N}][\\p{L}\\p{N}'-]{0,${MAX_SYMBOL_WORD_LENGTH - 1}}$`, "u");

export function symbolError(value) {
  const symbol = (value || "").trim();
  if (!symbol) return "Escolhe um emoji ou escreve uma palavra.";
  if (isEmoji(symbol) || SINGLE_WORD.test(symbol)) return "";
  return `Usa um só emoji ou uma palavra (até ${MAX_SYMBOL_WORD_LENGTH} letras).`;
}

export function shortTextError(value, what) {
  const list = words(value);
  if (list.length === 0) return `Escreve ${what}.`;
  if (list.length > MAX_WORDS) return `Usa no máximo ${MAX_WORDS} palavras.`;
  if (list.some((word) => graphemes(word).length > MAX_WORD_LENGTH)) {
    return `Cada palavra pode ter até ${MAX_WORD_LENGTH} letras.`;
  }
  return "";
}

// Texto que o botão insere: até 200 carateres, sem limite de palavras.
export function textError(value) {
  const text = cleanSpaces(value);
  if (!text) return "Escreve o texto que o botão insere.";
  if (text.length > MAX_TEXT_LENGTH) return `Usa no máximo ${MAX_TEXT_LENGTH} carateres.`;
  return "";
}

export const userButtonsRef = (uid) => collection(db, USERS, uid, USER_BUTTONS);
export const userButtonRef = (uid, id) => doc(db, USERS, uid, USER_BUTTONS, id);
export const userRef = (uid) => doc(db, USERS, uid);

// Garante que existe users/{uid} com o campo name.
export async function ensureUserProfile(user, name) {
  const ref = userRef(user.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists() && !name) return snapshot.data();
  const profile = {
    name: (name || snapshot.data()?.name || user.email?.split("@")[0] || "Utilizador").trim(),
  };
  await setDoc(ref, profile);
  return profile;
}

export const saveProfileName = (uid, name) => setDoc(userRef(uid), { name: name.trim() });

export function saveUserButton(uid, id, fields) {
  const data = {
    color: fields.color,
    emoji: fields.emoji.trim(),
    name: cleanSpaces(fields.name),
    text: cleanSpaces(fields.text),
  };
  return id ? updateDoc(userButtonRef(uid, id), data) : addDoc(userButtonsRef(uid), data);
}

export const deleteUserButton = (uid, id) => deleteDoc(userButtonRef(uid, id));

export function errorMessage(error, where = "") {
  console.error(`[Vozzi] ${where}`, error?.code, error?.message, error);
  const messages = {
    "permission-denied": "Sem permissão para aceder aos dados. Confirma as regras do Firestore.",
    "auth/invalid-credential": "Email ou palavra-passe incorretos.",
    "auth/invalid-email": "O email não é válido.",
    "auth/email-already-in-use": "Já existe uma conta com este email.",
    "auth/weak-password": "A palavra-passe tem de ter pelo menos 6 caracteres.",
    "auth/missing-password": "Escreve a palavra-passe.",
    "auth/too-many-requests": "Demasiadas tentativas. Espera um pouco e tenta de novo.",
    "auth/operation-not-allowed": "Ativa o método Email/palavra-passe na consola Firebase (Authentication).",
    unavailable: "Não foi possível contactar o serviço. Verifica a ligação à Internet.",
    unauthenticated: "A sessão terminou. Entra outra vez na tua conta.",
    "auth/user-token-expired": "A sessão terminou. Entra outra vez na tua conta.",
    "appCheck/recaptcha-error": "Falhou a verificação de segurança (reCAPTCHA). Confirma a chave e os domínios.",
    "appCheck/throttled": "Demasiadas verificações de segurança falhadas. Espera um pouco e tenta outra vez.",
    "auth/network-request-failed": "Sem ligação à Internet. Verifica a rede e tenta outra vez.",
  };
  return messages[error?.code]
    || error?.message
    || "Ocorreu um erro. Tenta novamente.";
}
