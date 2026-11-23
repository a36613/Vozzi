import { useState } from "react";
import { Check, CircleAlert, Eye, EyeOff } from "lucide-react";

export function Logo({ size = "small" }) {
  return (
    <span className={`logo logo-${size}`}>
      <img src="/vozzi_icon.png" alt="" />
      <span>Vozzi</span>
    </span>
  );
}

export function Field({ label, required, error, children, hint, after }) {
  return (
    <div className="field">
      <label className="field-main">
        <span className="field-label">
          {label}
          {required && <span className="required" aria-hidden="true"> *</span>}
        </span>
        {children}
      </label>
      {hint}
      {error && <FieldError>{error}</FieldError>}
      {after}
    </div>
  );
}

export function FieldError({ children }) {
  return (
    <span className="field-error" role="alert">
      <CircleAlert size={16} aria-hidden="true" />
      {children}
    </span>
  );
}

export function PasswordInput({ value, onChange, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="input-with-action">
      <input type={visible ? "text" : "password"} value={value} onChange={onChange} {...props} />
      <button
        type="button"
        className="input-action"
        aria-label={visible ? "Esconder palavra-passe" : "Mostrar palavra-passe"}
        onClick={() => setVisible(!visible)}
      >
        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </span>
  );
}

export function Alert({ children }) {
  if (!children) return null;
  return (
    <p className="alert" role="alert">
      <CircleAlert size={18} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

export function SuccessScreen({ title, text, action, onAction }) {
  return (
    <main className="page page-center">
      <section className="panel success-panel">
        <span className="success-icon"><Check size={44} strokeWidth={2.2} /></span>
        <h1>{title}</h1>
        <p className="muted">{text}</p>
        <button className="btn btn-primary btn-block" onClick={onAction}>{action}</button>
      </section>
    </main>
  );
}
