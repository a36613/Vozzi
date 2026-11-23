import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Porta fixa. Se a 5173 estiver ocupada, o Vite para com erro em vez de
    // mudar para 5174: outra porta é outro "site" para o navegador e a sessão
    // guardada não aparece (parece que a pessoa saiu da conta).
    port: 5173,
    strictPort: true,
  },
});
