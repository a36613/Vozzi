import { useState } from "react";
import { Check, CirclePlus, Settings, Smile, Trash2 } from "lucide-react";
import {
  BUTTON_COLORS, DEFAULT_COLOR, MAX_SYMBOL_WORD_LENGTH, MAX_TEXT_LENGTH, MAX_WORDS, MAX_WORD_LENGTH,
  cardBackground, graphemes, isEmoji, isHexColor, shortTextError, symbolError, textError, words,
} from "./data.js";
import EmojiKeyboard from "./EmojiKeyboard.jsx";
import { Alert, Field } from "./ui.jsx";

const EMOJI_PART = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

// Criar e editar usam o mesmo formulário. `button` vazio = criar.
export default function ButtonForm({ button, onSave, onDelete, onCancel }) {
  const editing = Boolean(button);
  const [form, setForm] = useState({
    emoji: button?.emoji || "",
    name: button?.name || "",
    text: button?.text || "",
    color: isHexColor(button?.color) ? button.color.toUpperCase() : DEFAULT_COLOR,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [keyboardOpen, setKeyboardOpen] = useState(!editing);
  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
  };
  const flash = (key, message) => setFieldErrors((current) => ({ ...current, [key]: message }));

  // Símbolo: um emoji (fica só o último escolhido) ou uma palavra sem espaços.
  function changeSymbol(event) {
    const value = event.target.value;
    const emojis = graphemes(value).filter((part) => EMOJI_PART.test(part));
    if (emojis.length > 0) {
      update("emoji", emojis[emojis.length - 1]);
      return;
    }
    if (/\s/.test(value)) {
      flash("emoji", "Só uma palavra, sem espaços.");
      return;
    }
    if (graphemes(value).length > MAX_SYMBOL_WORD_LENGTH) {
      flash("emoji", `A palavra pode ter até ${MAX_SYMBOL_WORD_LENGTH} letras.`);
      return;
    }
    update("emoji", value);
  }

  // Nome e texto: não deixa escrever uma 4.ª palavra nem palavras compridas.
  const changeShort = (key) => (event) => {
    const value = event.target.value.replace(/^\s+/, "").replace(/\s{2,}/g, " ");
    const list = words(value);
    if (list.length > MAX_WORDS) {
      flash(key, `Máximo de ${MAX_WORDS} palavras curtas.`);
      return;
    }
    if (list.some((word) => graphemes(word).length > MAX_WORD_LENGTH)) {
      flash(key, `Cada palavra pode ter até ${MAX_WORD_LENGTH} letras.`);
      return;
    }
    update(key, value);
  };

  // Texto que o botão insere: até 200 carateres.
  function changeText(event) {
    const value = event.target.value.replace(/^\s+/, "").replace(/\s{2,}/g, " ");
    if (value.length > MAX_TEXT_LENGTH) {
      flash("text", `Máximo de ${MAX_TEXT_LENGTH} carateres.`);
      return;
    }
    update("text", value);
  }
  const colors = BUTTON_COLORS.includes(form.color) ? BUTTON_COLORS : [...BUTTON_COLORS, form.color];

  async function submit(event) {
    event.preventDefault();
    const errors = {
      emoji: symbolError(form.emoji),
      name: shortTextError(form.name, "o nome do botão"),
      text: textError(form.text),
    };
    if (Object.values(errors).some(Boolean)) {
      setFieldErrors(errors);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(form);
    } catch (saveError) {
      setError(saveError.message);
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Eliminar o botão "${button.name}"?`)) return;
    setBusy(true);
    try {
      await onDelete();
    } catch (deleteError) {
      setError(deleteError.message);
      setBusy(false);
    }
  }

  const wordCount = (key) => (
    <span className="field-hint">{words(form[key]).length}/{MAX_WORDS} palavras</span>
  );

  const emojiField = (
    <Field label={editing ? "Símbolo" : "Emoji"} required error={fieldErrors.emoji}
      hint={<span className="field-hint">Um emoji ou uma palavra.</span>}
      after={keyboardOpen && <EmojiKeyboard value={form.emoji} onPick={(emoji) => update("emoji", emoji)} />}>
      <span className="input-with-action">
        <input className={`emoji-input${isEmoji(form.emoji) ? "" : " is-word"}`} maxLength={20}
          placeholder="Ex: 💧 ou água" aria-invalid={Boolean(fieldErrors.emoji)}
          value={form.emoji} onChange={changeSymbol} />
        <button type="button" className="input-action" aria-expanded={keyboardOpen}
          aria-label={keyboardOpen ? "Fechar teclado de emojis" : "Abrir teclado de emojis"}
          onClick={() => setKeyboardOpen(!keyboardOpen)}>
          <Smile size={22} />
        </button>
      </span>
    </Field>
  );

  return (
    <main className="page page-center">
      <form className="panel form" onSubmit={submit}>
        <h1 className="panel-title">
          {editing ? <Settings className="icon-blue" size={28} /> : <CirclePlus className="icon-blue" size={28} />}
          {editing ? "Editar botão" : "Criar botão"}
        </h1>

        {editing && <Preview form={form} label="Pré-visualização" />}
        {!editing && emojiField}
        <Field label="Nome do botão" required error={fieldErrors.name} hint={wordCount("name")}>
          <input maxLength={44} placeholder="Ex: Ajuda" aria-invalid={Boolean(fieldErrors.name)}
            value={form.name} onChange={changeShort("name")} />
        </Field>
        {editing && emojiField}
        <Field label="Texto que o botão insere" required error={fieldErrors.text}
          hint={<span className="field-hint">{form.text.length}/{MAX_TEXT_LENGTH} carateres</span>}>
          <input maxLength={MAX_TEXT_LENGTH} placeholder="Ex: Preciso de ajuda" aria-invalid={Boolean(fieldErrors.text)}
            value={form.text} onChange={changeText} />
        </Field>

        <fieldset className="field">
          <legend className="field-label">Cor</legend>
          <div className="swatches">
            {colors.map((color) => (
              <button type="button" key={color} className="swatch" style={{ background: color }}
                aria-label={`Cor ${color}`} aria-pressed={form.color === color}
                onClick={() => setForm({ ...form, color })}>
                {form.color === color && <Check size={16} strokeWidth={3} />}
              </button>
            ))}
            <label className="swatch swatch-custom" title="Outra cor">
              <input type="color" value={form.color} aria-label="Escolher outra cor"
                onChange={(event) => setForm({ ...form, color: event.target.value.toUpperCase() })} />
              +
            </label>
          </div>
        </fieldset>

        {!editing && <Preview form={form} label="Prévia do botão" />}
        <Alert>{error}</Alert>

        <div className="form-actions">
          <button type="button" className="btn btn-outline-dark btn-block" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary btn-block" disabled={busy}>
            {busy ? "A guardar…" : editing ? "Guardar alterações" : "Guardar"}
          </button>
        </div>
        {editing && (
          <button type="button" className="link-button danger center-self" onClick={remove} disabled={busy}>
            <Trash2 size={16} /> Eliminar botão
          </button>
        )}
      </form>
    </main>
  );
}

function Preview({ form, label }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="preview">
        <span className={`preview-tile${form.emoji.trim() && !isEmoji(form.emoji) ? " is-word" : ""}`}
          style={{ background: cardBackground(form.color) }}>
          {form.emoji.trim() || <CirclePlus className="icon-blue" size={26} />}
        </span>
        <span>
          <strong>{form.name.trim() || "Nome do botão"}</strong>
          <span className="muted small block">Insere: {form.text.trim() || "…"}</span>
        </span>
      </div>
    </div>
  );
}
