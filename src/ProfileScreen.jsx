import { useState } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { Alert, Field } from "./ui.jsx";

export default function ProfileScreen({ email, name, onSave, onBack, onSignOut }) {
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!value.trim()) {
      setError("Escreve o teu nome.");
      return;
    }
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await onSave(value);
      setSaved(true);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page page-profile">
      <h1 className="page-title">O teu perfil</h1>
      <p className="muted page-subtitle">Consulta e atualiza os teus dados pessoais.</p>

      <form className="panel form" onSubmit={submit}>
        <h2 className="panel-subtitle">Informações pessoais</h2>
        <Field label="Nome">
          <input required maxLength={80} value={value}
            onChange={(event) => { setValue(event.target.value); setSaved(false); }} />
        </Field>
        <Field label="Email">
          <input value={email} readOnly className="readonly" />
        </Field>
        <Alert>{error}</Alert>
        {saved && <p className="notice" role="status">Alterações guardadas.</p>}
        <button className="btn btn-primary btn-block" disabled={busy || value.trim() === name}>
          {busy ? "A guardar…" : "Guardar alterações"}
        </button>
      </form>

      <button className="btn btn-outline btn-block" onClick={onBack}>
        <ArrowLeft size={20} /> Voltar à comunicação
      </button>

      <button className="btn btn-soft btn-block signout" onClick={onSignOut}>
        <LogOut size={20} /> Sair
      </button>
    </main>
  );
}
