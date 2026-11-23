import { getAI, getGenerativeModel, GoogleAIBackend, ThinkingLevel } from "firebase/ai";
import { app } from "./firebase.js";

// Normalização de frases com o Gemini, através do Firebase AI Logic.
// O pedido sai do navegador para o Firebase, que o passa à Gemini Developer
// API. A chave do Gemini fica do lado do Firebase: não há chave neste código
// nem Cloud Function, por isso funciona no plano gratuito Spark.
//
// Modelo: o Gemini 3.5 Flash-Lite tem 500 pedidos/dia no nível gratuito
// (o 3.8 Flash só tem 20). Se a Google o retirar, troca só esta constante.
export const GEMINI_MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 9000;
const MAX_INPUT = 500;

const SYSTEM_INSTRUCTION = [
  "És um assistente de comunicação aumentativa e alternativa em português europeu.",
  "Recebes palavras ou expressões escolhidas por botões, pela ordem em que foram escolhidas.",
  "Junta-as numa frase natural, simples e direta, na primeira pessoa quando fizer sentido.",
  "Preserva a intenção original e todas as informações dadas.",
  "Corrige apenas a ordem das palavras e a gramática quando necessário.",
  "Não inventes pessoas, factos, necessidades, emoções ou intenções.",
  "Se a intenção não for clara, altera o mínimo possível.",
  "Devolve apenas a frase final, sem aspas nem explicações.",
].join(" ");

const ai = app ? getAI(app, { backend: new GoogleAIBackend() }) : null;

function createModel(withThinkingConfig) {
  return getGenerativeModel(ai, {
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 200,
      // Frase curta: não vale a pena o modelo "pensar" muito.
      ...(withThinkingConfig ? { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } } : {}),
    },
  }, { timeout: TIMEOUT_MS });
}

let model = ai ? createModel(true) : null;
let triedWithoutThinking = false;

function clean(text) {
  return text.trim().replace(/^["“”'«»]+|["“”'«»]+$/g, "").trim();
}

export async function normalizeText(text) {
  if (!model) throw new Error("O Firebase não está configurado.");
  const input = String(text || "").trim().slice(0, MAX_INPUT);
  if (!input) throw new Error("Texto vazio.");
  try {
    const result = await model.generateContent(input);
    const output = clean(result.response.text() || "");
    if (!output) throw new Error("O Gemini devolveu uma resposta vazia.");
    return output;
  } catch (error) {
    // Se este modelo não aceitar a configuração de "thinking", repete uma vez sem ela.
    if (!triedWithoutThinking && /thinking/i.test(error?.message || "")) {
      triedWithoutThinking = true;
      model = createModel(false);
      return normalizeText(text);
    }
    throw error;
  }
}
