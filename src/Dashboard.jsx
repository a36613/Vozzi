import { useEffect, useRef, useState } from "react";
import {
  Check, CirclePlus, Copy, LoaderCircle, Settings, Square, Trash2, Undo2, Volume2, X,
} from "lucide-react";
import { normalizeText } from "./ai.js";
import { cardBackground, errorMessage, isEmoji } from "./data.js";
import { Alert, Logo } from "./ui.jsx";

// Estado da mensagem. Fica na App para não se perder ao abrir outro ecrã.
export function useMessage() {
  const [chips, setChips] = useState([]);
  const [typed, setTyped] = useState("");
  const [normalized, setNormalized] = useState("");
  const counter = useRef(0);

  const original = [...chips.map((chip) => chip.text), typed.trim()].filter(Boolean).join(" ");

  function change(next) {
    setChips(next);
    setNormalized("");
  }

  function newChip(label, text, buttonId = null) {
    counter.current += 1;
    return { key: counter.current, buttonId, label, text };
  }

  return {
    chips, typed, normalized, original,
    setNormalized,
    setTyped(value) { setTyped(value); setNormalized(""); },
    // Clicar num botão já escolhido tira-o da mensagem.
    toggle(button) {
      if (chips.some((chip) => chip.buttonId === button.id)) {
        change(chips.filter((chip) => chip.buttonId !== button.id));
        return;
      }
      const pending = typed.trim() ? [newChip(typed.trim(), typed.trim())] : [];
      setTyped("");
      change([...chips, ...pending, newChip(button.name, button.text, button.id)]);
    },
    remove(key) { change(chips.filter((chip) => chip.key !== key)); },
    removeButton(buttonId) { change(chips.filter((chip) => chip.buttonId !== buttonId)); },
    undo() {
      if (typed.trim()) { setTyped(""); setNormalized(""); return; }
      change(chips.slice(0, -1));
    },
    clear() { setTyped(""); change([]); },
  };
}

// Escolhe uma voz portuguesa: primeiro pt-PT, depois qualquer pt-*.
function portugueseVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  return voices.find((voice) => voice.lang?.toLowerCase().replace("_", "-") === "pt-pt")
    || voices.find((voice) => voice.lang?.toLowerCase().startsWith("pt"))
    || null;
}

// Só se normaliza quando a frase foi montada com dois ou mais botões.
// Uma palavra sozinha ou texto escrito à mão é dito tal como está.
const MIN_CHIPS_TO_NORMALIZE = 2;

export default function Dashboard({ name, buttons, loading, loadError, message, onNewButton, onEditButton, onProfile }) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const selected = new Set(message.chips.map((chip) => chip.buttonId));
  const output = message.normalized || message.original;
  const hasMessage = Boolean(message.original);
  // Frase atual, para saber se mudou enquanto o Gemini respondia.
  const latestOriginal = useRef(message.original);
  latestOriginal.current = message.original;

  useEffect(() => {
    // Algumas vozes só ficam disponíveis depois deste evento.
    const synth = window.speechSynthesis;
    if (!synth) return undefined;
    synth.getVoices();
    synth.addEventListener?.("voiceschanged", synth.getVoices);
    return () => {
      synth.removeEventListener?.("voiceschanged", synth.getVoices);
      synth.cancel();
    };
  }, []);
  useEffect(() => { setCopied(false); setError(""); setNotice(""); }, [message.original]);

  function say(text) {
    const speech = new SpeechSynthesisUtterance(text);
    const voice = portugueseVoice();
    if (voice) speech.voice = voice;
    speech.lang = voice?.lang || "pt-PT";
    speech.rate = 0.95;
    speech.onend = () => setSpeaking(false);
    speech.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(speech);
    setSpeaking(true);
  }

  async function speak() {
    if (!("speechSynthesis" in window)) {
      setError("Este navegador não suporta reprodução de voz.");
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    setError("");
    setNotice("");

    const needsNormalizing = message.chips.length >= MIN_CHIPS_TO_NORMALIZE && !message.normalized;
    if (!needsNormalizing) {
      say(output);
      return;
    }

    // iPhone/Safari só deixa falar dentro do clique. Uma fala vazia agora
    // "desbloqueia" a voz para a frase que chega depois do Gemini.
    const unlock = new SpeechSynthesisUtterance(" ");
    unlock.volume = 0;
    window.speechSynthesis.speak(unlock);

    const original = message.original;
    setPreparing(true);
    let spoken = original;
    try {
      spoken = await normalizeText(original);
      if (latestOriginal.current === original) message.setNormalized(spoken);
    } catch (normalizationError) {
      console.warn("[Vozzi] Normalizar", normalizationError);
      setNotice("Não foi possível normalizar. Foi dita a frase original.");
    } finally {
      setPreparing(false);
    }
    // Se a mensagem mudou enquanto esperávamos, não falar uma frase antiga.
    if (latestOriginal.current === original) say(spoken);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setError("");
    } catch {
      setError("Não foi possível copiar. Usa HTTPS e verifica as permissões do navegador.");
    }
  }

  const initial = (name || "U").trim().charAt(0).toUpperCase();

  return (
    <div className="dashboard">
      <header className="topbar">
        <Logo />
        <button className="avatar-button" onClick={onProfile} aria-label="Abrir perfil" title="O teu perfil">
          <span className="avatar">{initial}</span>
        </button>
      </header>

      <main className="page page-dashboard">
        <h1 className="page-title">{name ? `Olá, ${name.split(" ")[0]}!` : "Olá!"}</h1>
        <p className="muted page-subtitle">Escolhe os teus botões para comunicar.</p>

        <div className="section-heading">
          <h2>Os teus botões</h2>
          <button className="link-button" onClick={onNewButton}>
            <CirclePlus size={24} /> Novo botão
          </button>
        </div>

        <Alert>{loadError}</Alert>
        {loading ? <p className="muted">A carregar botões…</p> : (
          <div className="button-grid">
            {buttons.map((button) => {
              const isSelected = selected.has(button.id);
              return (
                <div className="card-wrap" key={`${button.isDefault ? "d" : "u"}-${button.id}`}>
                  <button
                    className={`aac-card${isSelected ? " selected" : ""}`}
                    style={{ background: cardBackground(button.color) }}
                    aria-pressed={isSelected}
                    onClick={() => message.toggle(button)}
                  >
                    {button.emoji && (
                      <span className={`aac-emoji${isEmoji(button.emoji) ? "" : " is-word"}`} aria-hidden="true">{button.emoji}</span>
                    )}
                    <span className="aac-label">{button.name}</span>
                  </button>
                  {isSelected && <span className="aac-check" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>}
                  {!button.isDefault && (
                    <button className="aac-edit" onClick={() => onEditButton(button)}
                      aria-label={`Editar ${button.name}`} title="Editar botão">
                      <Settings size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {!loading && buttons.length === 0 && !loadError && (
          <p className="muted">Ainda não tens botões. Carrega em “Novo botão” para criares o primeiro.</p>
        )}

        <section className="panel message-panel" aria-labelledby="message-title">
          <div className="message-heading">
            <h2 id="message-title">A tua mensagem</h2>
            {hasMessage && message.chips.length === 0 && (
              <button className="link-button muted-link" onClick={message.clear}>
                <Trash2 size={16} /> Limpar
              </button>
            )}
          </div>

          {message.chips.length > 0 && (
            <ul className="chips">
              {message.chips.map((chip) => (
                <li className="chip" key={chip.key}>
                  {chip.label}
                  <button onClick={() => message.remove(chip.key)} aria-label={`Remover ${chip.label}`}>
                    <X size={18} strokeWidth={2.4} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {message.chips.length === 0 ? (
            <div className="message-input-wrap">
              <textarea className="message-input" aria-label="Escrever mensagem" rows={3} maxLength={500}
                placeholder="Escreve a mensagem aqui…" value={message.typed}
                onChange={(event) => message.setTyped(event.target.value)} />
              <span className="counter">{message.typed.length}/500</span>
            </div>
          ) : (
            <div className="message-text">
              <span className="muted small">{message.normalized ? "Texto normalizado" : "Texto original"}</span>
              <p className="message-output">{output}</p>
            </div>
          )}

          <div className="message-actions">
            {message.chips.length > 0 && (
              <>
                <button className="btn btn-outline" onClick={message.undo}><Undo2 size={20} /> Desfazer</button>
                <button className="btn btn-outline" onClick={message.clear}><Trash2 size={20} /> Limpar</button>
              </>
            )}
            <button className={`btn ${message.chips.length ? "btn-dark" : "btn-soft"}`} onClick={speak}
              disabled={!hasMessage || preparing} aria-live="polite">
              {preparing && <><LoaderCircle size={20} className="spin" /> A preparar…</>}
              {!preparing && speaking && <><Square size={20} /> Parar</>}
              {!preparing && !speaking && <><Volume2 size={20} /> {message.chips.length ? "Falar" : "Ouvir"}</>}
            </button>
            <button className={`btn ${message.chips.length ? "btn-outline" : "btn-soft"}${copied ? " copied" : ""}`}
              onClick={copy} disabled={!hasMessage}>
              <Copy size={20} /> Copiar
              {copied && <span className="copied-check" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>}
            </button>
          </div>
          <Alert>{error}</Alert>
          {notice && <p className="message-notice" role="status">{notice}</p>}
        </section>
      </main>
    </div>
  );
}
