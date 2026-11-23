import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { CirclePlus } from "lucide-react";
import { auth } from "./firebase.js";
import { errorMessage } from "./data.js";
import { Alert, Field, Logo, PasswordInput } from "./ui.jsx";

export function LoginScreen({ onRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (authError) {
      setError(errorMessage(authError, "Login"));
      setBusy(false);
    }
  }

  async function resetPassword() {
    if (!email.trim()) {
      setError("Escreve o teu email para receber o link.");
      return;
    }
    setError("");
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setNotice("Se existir uma conta com este email, vais receber um link para mudar a palavra-passe.");
    } catch (authError) {
      setError(errorMessage(authError, "Recuperar palavra-passe"));
    }
  }

  return (
    <main className="page page-login">
      <div className="login-logo"><Logo size="large" /></div>
      <h1 className="page-title">Efetuar login</h1>
      <p className="muted page-subtitle">Entra na tua conta para comunicar.</p>

      <form className="panel form" onSubmit={submit}>
        <Field label="Email">
          <input type="email" autoComplete="email" required placeholder="Ex: user123@gmail.com"
            value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Palavra-passe">
          <PasswordInput required minLength={6} autoComplete="current-password"
            placeholder="Introduz a tua palavra-passe"
            value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <button type="button" className="link-button forgot" onClick={resetPassword}>
          Esqueci-me da palavra-passe
        </button>
        <Alert>{error}</Alert>
        {notice && <p className="notice" role="status">{notice}</p>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? "A entrar…" : "Efetuar login"}
        </button>
      </form>

      <p className="muted center login-question">Ainda não tens conta?</p>
      <button className="btn btn-outline btn-block" onClick={onRegister}>Criar novo utilizador</button>
    </main>
  );
}

export function RegisterScreen({ onCancel, onRegistering }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const mismatch = repeat.length > 0 && repeat !== password;

  async function submit(event) {
    event.preventDefault();
    if (password !== repeat) {
      setError("As palavras-passe não coincidem.");
      return;
    }
    setBusy(true);
    setError("");
    // Avisa a App antes de criar a conta: o Firebase inicia sessão logo a seguir
    // e a App tem de mostrar o ecrã "Utilizador criado!" em vez do painel.
    onRegistering(name.trim());
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (authError) {
      onRegistering(null);
      setError(errorMessage(authError, "Criar conta"));
      setBusy(false);
    }
  }

  return (
    <main className="page page-center">
      <form className="panel form" onSubmit={submit}>
        <h1 className="panel-title"><CirclePlus className="icon-blue" size={28} /> Criar utilizador</h1>
        <div>
          <h2 className="form-section">Dados de acesso</h2>
          <p className="muted small">Preenche os campos obrigatórios para criar a conta do utilizador.</p>
        </div>
        <Field label="Nome" required>
          <input autoComplete="name" required maxLength={80} placeholder="Ex: Derek Stingley Jr"
            value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Email" required>
          <input type="email" autoComplete="email" required placeholder="Ex: user123@gmail.com"
            value={email} onChange={(event) => setEmail(event.target.value)} />
        </Field>
        <Field label="Palavra-passe" required>
          <PasswordInput required minLength={6} autoComplete="new-password" placeholder="Mínimo 6 caracteres"
            value={password} onChange={(event) => setPassword(event.target.value)} />
        </Field>
        <Field label="Repetir palavra-passe" required error={mismatch ? "As palavras-passe não coincidem." : ""}>
          <PasswordInput required minLength={6} autoComplete="new-password" placeholder="Repete a palavra-passe"
            aria-invalid={mismatch} className={mismatch ? "invalid" : ""}
            value={repeat} onChange={(event) => setRepeat(event.target.value)} />
        </Field>
        <Alert>{error}</Alert>
        <div className="form-actions">
          <button type="button" className="btn btn-outline-dark btn-block" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-primary btn-block" disabled={busy || mismatch}>
            {busy ? "A criar…" : "Criar utilizador"}
          </button>
        </div>
      </form>
    </main>
  );
}
