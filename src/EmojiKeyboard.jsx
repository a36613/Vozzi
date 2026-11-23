import { useState } from "react";

// Teclado de emojis próprio da app: não depende do teclado do telemóvel
// nem do computador. Lista pensada para comunicação do dia a dia.
const CATEGORIES = [
  { id: "feel", label: "Sentimentos", tab: "🙂", emojis: "😀 🙂 😊 😂 😍 🥰 😢 😭 😡 😠 😟 😨 😴 🤒 🤢 🥵 🥶 😐 🤔 👍 👎 👋 🙏 👏 🤝 ❤️ 💔" },
  { id: "people", label: "Pessoas e animais", tab: "👪", emojis: "👤 👶 👧 👦 👩 👨 👵 👴 👪 👫 👩‍⚕️ 👨‍⚕️ 👩‍🏫 👨‍🍳 👮 🐶 🐱 🐦 🐟" },
  { id: "food", label: "Comida e bebida", tab: "🍎", emojis: "💧 🥛 ☕ 🍵 🧃 🥤 🍞 🥐 🍎 🍌 🍓 🍊 🍉 🥗 🍲 🍝 🍕 🍔 🍟 🍚 🥚 🧀 🍪 🍰 🍫 🍦 🍴" },
  { id: "home", label: "Casa e objetos", tab: "🏠", emojis: "🏠 🛏️ 🚿 🛁 🚽 🪥 🧼 👕 👖 👟 🧸 📱 💻 📺 🎧 🔑 💊 🩹 🌂 🎒 📚 ✏️" },
  { id: "places", label: "Lugares e atividades", tab: "🚌", emojis: "🏫 🏥 🏪 🌳 🏖️ 🚗 🚌 🚲 ✈️ ⚽ 🎨 🎵 🎮 📖 🏊 🚶 🛒 🎂" },
  { id: "symbols", label: "Símbolos", tab: "⭐", emojis: "✅ ❌ ❓ ❗ ⭐ ☀️ 🌙 🌧️ ❄️ 🔥 ⏰ 🆘 🛑 ➕ ➖ 🔊 🔇 🎉" },
].map((category) => ({ ...category, emojis: category.emojis.split(" ") }));

export default function EmojiKeyboard({ value, onPick }) {
  const [active, setActive] = useState(CATEGORIES[0].id);
  const category = CATEGORIES.find((item) => item.id === active);

  return (
    <div className="emoji-keyboard" role="group" aria-label="Teclado de emojis">
      <div className="emoji-tabs" role="tablist" aria-label="Categorias de emojis">
        {CATEGORIES.map((item) => (
          <button type="button" key={item.id} role="tab" aria-selected={item.id === active}
            className="emoji-tab" title={item.label} aria-label={item.label}
            onClick={() => setActive(item.id)}>
            {item.tab}
          </button>
        ))}
      </div>
      <p className="emoji-category muted small">{category.label}</p>
      <div className="emoji-grid" role="tabpanel">
        {category.emojis.map((emoji) => (
          <button type="button" key={emoji} className="emoji-key" aria-pressed={emoji === value}
            onClick={() => onPick(emoji)}>
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
