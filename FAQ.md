# FAQ — Vozzi

## A. Conceitos gerais

### O que é o Vozzi?
É um MVP académico de CAA. Permite construir mensagens com botões, guardar os botões no Firebase e, opcionalmente, normalizar uma mensagem com IA. A interface está em `src/App.jsx`.

### O que é um MVP?
É uma versão mínima que demonstra a ideia principal com poucas funcionalidades. O Vozzi não pretende substituir uma aplicação clínica completa.

### O que significa CRUD?
São as quatro operações sobre dados: criar (Create), consultar (Read), editar (Update) e eliminar (Delete). No Vozzi, são as operações dos botões.

### O que é React?
É uma biblioteca JavaScript para construir interfaces com componentes. O estado React guarda, por exemplo, a mensagem escrita em `src/App.jsx`.

### Para que serve o Vite?
É a ferramenta que executa o frontend durante o desenvolvimento e cria os ficheiros finais de publicação. Os comandos estão em `package.json`.

### O que é o Firebase?
É uma plataforma Google com serviços como autenticação, base de dados, funções de backend e alojamento. Este projeto usa Authentication, Firestore, AI Logic (Gemini) e Hosting.

### Qual é a diferença entre frontend e backend?
O frontend corre no navegador e mostra a interface. O backend corre num servidor. No Vozzi, todo o código está em `src/` e corre no navegador. O "backend" são os serviços do Firebase: o Firestore guarda os dados e o AI Logic faz de intermediário com o Gemini, guardando a chave do lado do Firebase.

### O que é uma API?
É uma forma definida de um programa pedir dados ou ações a outro. O Vozzi usa a Gemini Developer API, através do Firebase AI Logic, para normalizar uma mensagem.

### O que significa normalizar uma mensagem?
É melhorar a ordem e a gramática para criar uma frase natural, tentando preservar o sentido. A sugestão não é obrigatória nem substitui o texto original.

## B. React e código

### O que é um componente?
É uma parte da interface organizada como função React. O Vozzi mantém o formulário dentro de `src/App.jsx` para reduzir a estrutura; o resultado da mensagem usa o pequeno componente `Message` no mesmo ficheiro.

### Para que serve `useState`?
Guarda um valor que pode mudar e pede ao React para atualizar a interface. Por exemplo, `message` guarda o texto atual.

### Para que serve `useEffect`?
Executa efeitos associados à montagem ou mudança de dados. No Vozzi, subscreve o estado de autenticação e os botões Firestore e limpa as subscrições ao sair.

### O que é uma função assíncrona?
É uma função que pode esperar por operações demoradas, como uma resposta de rede ou uma gravação no Firestore.

### O que significa `async/await`?
É uma forma de escrever operações assíncronas em sequência legível. `await addDoc(...)` espera a gravação antes de fechar o formulário.

### Porque é que o React atualiza a interface?
Quando o estado muda com uma função `set...`, React volta a desenhar as partes que dependem desse valor. Não é preciso alterar o HTML manualmente.

### Porque é que o código está dividido em vários ficheiros?
Para separar interface, configuração Firebase, estilos, regras, backend e dependências. As responsabilidades estão resumidas na tabela do README.

### O que acontece quando elimino um componente?
Deixas de ter aquela parte da interface, mas podes deixar imports, chamadas ou estilos inválidos. Procura os usos do componente e executa `npm run build` depois.

### Como identifico a origem de um erro?
Lê a mensagem no navegador e no terminal. Distingue erro de compilação, rede, autenticação, permissões Firestore ou resposta da IA; consulta a secção E antes de alterar código.

## C. Firebase e autenticação

### Como funciona o login?
Com Firebase Authentication por email e palavra-passe. O ecrã `AuthScreen` em `src/App.jsx` chama `createUserWithEmailAndPassword` para criar conta, `signInWithEmailAndPassword` para entrar e `sendPasswordResetEmail` para recuperar a palavra-passe. O email e a palavra-passe ficam no Authentication; no Firestore só fica o nome, em `users/{uid}`.

### O que é o UID?
É o identificador único do utilizador Firebase. É o ID do documento `users/{uid}`, dentro do qual ficam os botões do utilizador (`ubuttons`).

### O que é um token de autenticação?
É uma credencial temporária emitida pelo Firebase para provar que o utilizador iniciou sessão. O SDK inclui-a automaticamente nos pedidos ao Firestore.

### O UID é igual a uma palavra-passe?
Não. O UID identifica a conta; não permite iniciar sessão como palavra-passe.

### Porque é que os dados estão associados ao UID?
Para cada conta ver os seus próprios botões. As regras `firestore.rules` comparam o UID autenticado com o `{uid}` do caminho `users/{uid}/ubuttons`.

### Onde ficam guardados os botões?
Na Cloud Firestore. Os botões de cada utilizador ficam em `users/{uid}/ubuttons/{id}` com `color`, `emoji`, `name` e `text` (ID automático). Os pré-definidos ficam em `buttons/{id}` com `color`, `icon`, `isDefault`, `name` e `text`.

### Onde fica a palavra-passe?
Só no Firebase Authentication, guardada de forma segura. Nunca deve ir para o Firestore.

### Os dados continuam disponíveis depois de atualizar a página?
Sim. A sessão mantém-se no navegador e, mesmo que saias, voltas a ver os botões ao entrar com o mesmo email. A aplicação volta a consultar os documentos.

### O que acontece se limpar os dados do navegador?
Terminas a sessão nesse navegador. Basta entrar de novo com o mesmo email e palavra-passe para recuperar os botões.

### Como testo o isolamento entre utilizadores?
Entra com outra conta numa janela privada, cria um botão e confirma que a primeira conta não o vê. Confirma também caminhos e regras na consola Firebase.

### Para que servem as regras de segurança do Firestore?
São verificações executadas pelo Firestore para autorizar ou recusar leituras e escritas, independentemente do que a interface permite. Estão em `firestore.rules`.

### Porque não basta esconder os botões de outro utilizador na interface?
Porque alguém pode chamar diretamente a API Firestore. A regra no servidor verifica a identidade e o caminho; esconder elementos HTML não protege dados.

## D. Gemini e Inteligência Artificial

### Que IA usa o Vozzi?
O Gemini, da Google, através do Firebase AI Logic e da Gemini Developer API. Só é usado para normalizar a frase quando se carrega em **Falar** com dois ou mais botões.

### Qual é a diferença entre um modelo de IA e uma API?
O modelo é o sistema que gera texto. A API é o serviço e o formato de pedido usado para comunicar com esse modelo.

### Onde está a chave da IA?
Do lado do Firebase. Foi criada ao ativar o AI Logic na consola e nunca entra no código. O browser só envia a configuração pública do Firebase.

### Porque não posso colocar uma chave de IA no React?
O código e os pedidos do browser podem ser vistos pelos utilizadores. A chave ficaria copiável e poderia ser usada por terceiros, gerando consumo na tua conta.

### Preciso do plano Blaze?
Não. O Firebase AI Logic é gratuito e o nível gratuito da Gemini Developer API exige que o projeto esteja no plano Spark, sem faturação ligada.

### O que acontece quando a IA falha?
É dita a frase original e aparece um aviso discreto ("Não foi possível normalizar"). O app continua a funcionar.

### Porque é que a IA pode alterar o significado de uma mensagem?
Um modelo prevê texto provável e pode interpretar mal palavras curtas ou ambíguas. Por isso o texto normalizado aparece no ecrã antes de ser copiado.

### Como posso reduzir alterações indesejadas?
A instrução de sistema em `src/ai.js` (`SYSTEM_INSTRUCTION`) pede para preservar a intenção, não inventar informação e alterar o mínimo necessário. Testa os teus exemplos; nenhuma instrução garante resposta perfeita.

### Como verifico o modelo utilizado?
Vê a constante `GEMINI_MODEL` em `src/ai.js` e confirma que continua disponível na [lista de modelos do Firebase AI Logic](https://firebase.google.com/docs/ai-logic/models).

### Existem limites de utilização?
Sim. O nível gratuito tem limites por minuto e por dia, por projeto, que aparecem no Google AI Studio. Quando se esgotam, a IA falha até o limite repor e é dita a frase original. Para proteger a quota, ativa o App Check.

### Como altero o modelo sem modificar toda a aplicação?
Troca só a constante `GEMINI_MODEL` em `src/ai.js`, faz `npm run build` e publica o Hosting.

## E. Erros e resolução de problemas

### O projeto não inicia.
1. Confirma que o terminal está em `Downloads\Vozzi`.
2. Executa `node --version` e `npm --version`.
3. Se as dependências não estiverem instaladas, executa `npm install`.
4. Lê a primeira mensagem de erro e corrige a causa indicada; não apagues ficheiros de configuração para tentar resolver.

### O npm apresenta um erro.
Confirma a ligação, a pasta atual e se existe `package.json`. Se o erro mencionar dependências, consulta o pacote e a versão indicada antes de voltares a instalar.

### O Firebase não autentica o utilizador.
Confirma que `.env.local` existe e tem valores corretos, que reiniciaste o Vite e que Authentication > Método de início de sessão > Email/palavra-passe está ativo. Lê o erro do navegador para distinguir configuração inválida de falha de rede.

### Os botões não aparecem.
Verifica se a sessão terminou de carregar, se existem documentos em `users/<UID>/ubuttons` dessa conta e se a consola do browser indica erro Firestore. Outra conta terá outro UID e só verá os botões pré-definidos.

### Os dados não ficam guardados.
Confirma Internet, sessão válida, permissões Firestore e que `firestore.rules` foi publicada. Procura erros `permission-denied` na consola do navegador.

### O Firestore devolve um erro de permissões.
Confirma o UID da sessão e o caminho do documento. Publica as regras do projeto certo com `firebase deploy --only firestore:rules`. Não substituas as regras por acesso público.

### A normalização não funciona ("Não foi possível normalizar").
Abre a consola do navegador (F12) e procura `[Vozzi] Normalizar`:
- **API não ativada ou 403:** ativa o AI Logic na consola Firebase (Fase 4 do manual) e espera alguns minutos.
- **429 ou quota esgotada:** atingiste o limite gratuito; espera pelo dia seguinte.
- **Modelo não encontrado:** troca `GEMINI_MODEL` em `src/ai.js` por um modelo ativo.
- **App Check:** se ativaste a aplicação obrigatória, o frontend tem de ter o App Check configurado.

### O navegador não copia o texto.
A API Clipboard pode exigir HTTPS/localhost e permissão do utilizador. Testa numa página publicada ou `localhost`, verifica as permissões do browser e copia manualmente se necessário.

### A reprodução de voz não funciona.
Confirma o volume e suporte a `speechSynthesis` no navegador. As vozes instaladas dependem do sistema. Testa outro navegador recente; não existe voz externa integrada.

### A aplicação funciona localmente, mas não depois de publicada.
Confirma que fizeste novo `npm run build` e publicação de Hosting, que `.env.local` continha a configuração correta durante o build, que o projeto Firebase é o esperado e que as regras foram publicadas e o AI Logic está ativado. Verifica consola e rede do navegador.

## F. Manutenção e evolução

### Como acrescento um botão?
Usa o botão **Adicionar botão** na interface. Para valores iniciais de demonstração, cria-os pela própria interface; não existe uma lista global de botões predefinidos.

### Como altero o texto de um botão?
Usa **Editar** no cartão. O documento Firestore será atualizado sem mudar o seu ID.

### Como modifico as instruções da IA?
Edita `SYSTEM_INSTRUCTION` em `src/ai.js`. Mantém as regras de preservação do sentido e testa casos ambíguos.

### Como altero o modelo de IA?
Altera `GEMINI_MODEL` em `src/ai.js` para um modelo ativo, faz `npm run build` e publica com `firebase deploy --only hosting`.

### Como adiciono uma funcionalidade sem complicar o projeto?
Define primeiro o comportamento mínimo, procura o componente e o ficheiro responsável e evita adicionar bibliotecas se React e Firebase já resolvem a necessidade. Atualiza este FAQ e o README se os passos mudarem.

### Como evito perder dados durante alterações?
Não apagues coleções nem mudes o UID/caminho sem plano de migração. Testa numa conta de demonstração, mantém as regras ativas e confirma que os documentos existem na consola antes de qualquer alteração estrutural.

### Como atualizo dependências com segurança?
Revê primeiro `package.json` e as notas de versão. Atualiza uma dependência de cada vez, executa `npm install`, `npm run build` e testa autenticação e CRUD. Instala as dependências na raiz do projeto.

### Que ficheiros devo verificar antes de fazer uma alteração?
Para interface e CRUD, `src/App.jsx`; Firebase Web, `src/firebase.js`; visual, `src/styles.css`; autorização, `firestore.rules`; IA, `src/ai.js`; configuração de publicação, `firebase.json` e `package.json`.
