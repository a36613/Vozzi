import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "./firebase.js";
import {
  DEFAULT_BUTTONS,
  deleteUserButton,
  ensureUserProfile,
  errorMessage,
  saveProfileName,
  saveUserButton,
  userButtonsRef,
  userRef,
} from "./data.js";
import { LoginScreen, RegisterScreen } from "./AuthScreens.jsx";
import Dashboard, { useMessage } from "./Dashboard.jsx";
import ButtonForm from "./ButtonForm.jsx";
import ProfileScreen from "./ProfileScreen.jsx";
import { SuccessScreen } from "./ui.jsx";

// Nome escrito no registo. Fica aqui até o onAuthStateChanged disparar,
// para que o perfil seja gravado só num sítio.
let pendingProfileName = null;

const byName = (a, b) => String(a.name).localeCompare(String(b.name), "pt");

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authView, setAuthView] = useState("login");     // login | register
  // dashboard | new | edit | profile | userCreated | buttonCreated
  const [view, setView] = useState("dashboard");
  const [editing, setEditing] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [buttons, setButtons] = useState([]);
  const [loadingButtons, setLoadingButtons] = useState(true);
  const [loadError, setLoadError] = useState("");
  const message = useMessage();

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (!currentUser) {
        setAuthView("login");
        setView("dashboard");
      }
    });
  }, []);

  // Perfil users/{uid}: conta nova grava o nome do registo; conta antiga sem
  // perfil fica com a parte do email antes do @.
  useEffect(() => {
    if (!db || !user) {
      setProfileName("");
      return undefined;
    }
    const nameFromSignup = pendingProfileName;
    pendingProfileName = null;
    if (nameFromSignup !== null) setView("userCreated");
    ensureUserProfile(user, nameFromSignup)
      .then((profile) => setProfileName(profile.name))
      .catch((error) => setLoadError(errorMessage(error, "Ler perfil")));
    return onSnapshot(userRef(user.uid), (snapshot) => setProfileName(snapshot.data()?.name || ""), () => {});
  }, [user]);

  // Botões pré-definidos (buttons) + botões do utilizador (users/{uid}/ubuttons),
  // juntos no formato { id, emoji, name, text, color, isDefault }.
  useEffect(() => {
    if (!db || !user) {
      setButtons([]);
      setLoadingButtons(false);
      return undefined;
    }
    setLoadingButtons(true);
    setLoadError("");
    const results = { own: null, defaults: null };

    function publish() {
      if (!results.own || !results.defaults) return;
      setButtons([...results.defaults.sort(byName), ...results.own.sort(byName)]);
      setLoadingButtons(false);
    }
    const fail = (key) => (error) => {
      setLoadError(errorMessage(error, `Ler botões (${key})`));
      results[key] = results[key] || [];
      publish();
    };
    const toButton = (isDefault) => (item) => {
      const data = item.data();
      return {
        id: item.id,
        emoji: (isDefault ? data.icon : data.emoji) || "",
        name: data.name || "",
        text: data.text || "",
        color: data.color || "",
        isDefault,
      };
    };

    const stopDefaults = onSnapshot(collection(db, DEFAULT_BUTTONS), (snapshot) => {
      results.defaults = snapshot.docs.map(toButton(true));
      publish();
    }, fail("defaults"));
    const stopOwn = onSnapshot(userButtonsRef(user.uid), (snapshot) => {
      results.own = snapshot.docs.map(toButton(false));
      publish();
    }, fail("own"));

    return () => {
      stopDefaults();
      stopOwn();
    };
  }, [user]);

  // Erros do Firestore chegam aos formulários já traduzidos.
  const friendly = (where) => (error) => { throw new Error(errorMessage(error, where)); };

  if (!isFirebaseConfigured) {
    return (
      <main className="page page-center">
        <section className="panel">
          <h1 className="panel-title">Vozzi</h1>
          <p>Configura os valores Firebase em <code>.env.local</code> e reinicia o Vite.</p>
        </section>
      </main>
    );
  }

  if (authLoading) return <main className="page page-center"><p className="muted">A verificar a sessão…</p></main>;

  if (!user) {
    return authView === "register"
      ? <RegisterScreen onCancel={() => setAuthView("login")} onRegistering={(name) => { pendingProfileName = name; }} />
      : <LoginScreen onRegister={() => setAuthView("register")} />;
  }

  const goHome = () => { setEditing(null); setView("dashboard"); };

  switch (view) {
    case "userCreated":
      return <SuccessScreen title="Utilizador criado!"
        text="O utilizador foi criado com sucesso. Agora pode avançar para a comunicação."
        action="Voltar à comunicação" onAction={goHome} />;
    case "buttonCreated":
      return <SuccessScreen title="Botão criado!"
        text="O botão foi criado com sucesso e já está disponível na comunicação."
        action="Voltar à comunicação" onAction={goHome} />;
    case "new":
      return <ButtonForm onCancel={goHome}
        onSave={(form) => saveUserButton(user.uid, null, form)
          .then(() => setView("buttonCreated"), friendly("Criar botão"))} />;
    case "edit":
      return <ButtonForm button={editing} onCancel={goHome}
        onSave={(form) => saveUserButton(user.uid, editing.id, form).then(goHome, friendly("Editar botão"))}
        onDelete={() => deleteUserButton(user.uid, editing.id).then(() => {
          message.removeButton(editing.id);
          goHome();
        }, friendly("Eliminar botão"))} />;
    case "profile":
      return <ProfileScreen email={user.email || ""} name={profileName} onBack={goHome}
        onSave={(name) => saveProfileName(user.uid, name).catch(friendly("Guardar perfil"))}
        onSignOut={() => { message.clear(); signOut(auth); }} />;
    default:
      return <Dashboard name={profileName} buttons={buttons} loading={loadingButtons} loadError={loadError}
        message={message}
        onNewButton={() => setView("new")}
        onEditButton={(button) => { setEditing(button); setView("edit"); }}
        onProfile={() => setView("profile")} />;
  }
}
