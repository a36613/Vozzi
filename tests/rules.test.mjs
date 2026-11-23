import { initializeTestEnvironment, assertSucceeds, assertFails } from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, collection } from "firebase/firestore";

const env = await initializeTestEnvironment({ projectId: "demo-vozzi",
  firestore: { rules: readFileSync("firestore.rules","utf8"), host: "127.0.0.1", port: 8085 } });
const ana = env.authenticatedContext("ana").firestore();
const rui = env.authenticatedContext("rui").firestore();
const anon = env.unauthenticatedContext().firestore();
const f = { color:"#4F46E5", emoji:"💧", name:"Água", text:"Quero água" };
const ub = (db, uid) => collection(db, "users", uid, "ubuttons");

let ok=0, bad=0;
async function check(name, p){ try{ await p; console.log("✓",name); ok++; } catch(e){ console.log("✗",name,e.message); bad++; } }

// users/{uid}
await check("ana cria o seu perfil", assertSucceeds(setDoc(doc(ana,"users","ana"),{name:"Ana"})));
await check("ana lê o seu perfil", assertSucceeds(getDoc(doc(ana,"users","ana"))));
await check("rui não lê o perfil da ana", assertFails(getDoc(doc(rui,"users","ana"))));
await check("rui não escreve no perfil da ana", assertFails(setDoc(doc(rui,"users","ana"),{name:"x"})));
await check("perfil com campo extra recusado", assertFails(setDoc(doc(ana,"users","ana"),{name:"Ana",password:"x"})));
await check("perfil sem nome recusado", assertFails(setDoc(doc(ana,"users","ana"),{name:""})));

// users/{uid}/ubuttons
let id;
await check("ana cria botão", assertSucceeds(addDoc(ub(ana,"ana"),f)).then(r=>{ id=r.id; }));
await check("sem login não cria", assertFails(addDoc(ub(anon,"ana"),f)));
await check("rui não cria botões da ana", assertFails(addDoc(ub(rui,"ana"),f)));
await check("cor inválida recusada", assertFails(addDoc(ub(ana,"ana"),{...f,color:"azul"})));
await check("sem cor recusado", assertFails(addDoc(ub(ana,"ana"),{emoji:f.emoji,name:f.name,text:f.text})));
await check("campo extra recusado", assertFails(addDoc(ub(ana,"ana"),{...f,isDefault:true})));
await check("nome com 4 palavras recusado", assertFails(addDoc(ub(ana,"ana"),{...f,name:"um dois três quatro"})));
await check("texto com 4 palavras recusado", assertFails(addDoc(ub(ana,"ana"),{...f,text:"eu quero beber água"})));
await check("símbolo com duas palavras recusado", assertFails(addDoc(ub(ana,"ana"),{...f,emoji:"duas palavras"})));
await check("símbolo com uma palavra aceite", assertSucceeds(addDoc(ub(ana,"ana"),{...f,emoji:"água"})));
await check("ana lista os seus botões", assertSucceeds(getDocs(ub(ana,"ana"))));
await check("rui não lista botões da ana", assertFails(getDocs(ub(rui,"ana"))));
await check("ana edita botão", assertSucceeds(updateDoc(doc(ana,"users","ana","ubuttons",id),{text:"Quero muita água",color:"#00AA00"})));
await check("rui não edita botão da ana", assertFails(updateDoc(doc(rui,"users","ana","ubuttons",id),{text:"x"})));
await check("rui não apaga botão da ana", assertFails(deleteDoc(doc(rui,"users","ana","ubuttons",id))));
await check("ana apaga botão", assertSucceeds(deleteDoc(doc(ana,"users","ana","ubuttons",id))));

// buttons (pré-definidos)
await env.withSecurityRulesDisabled(async c => setDoc(doc(c.firestore(),"buttons","sim"),{color:"#00AA00",icon:"👍",isDefault:true,name:"Sim",text:"Sim"}));
await check("rui lê pré-definidos", assertSucceeds(getDocs(collection(rui,"buttons"))));
await check("sem login não lê pré-definidos", assertFails(getDocs(collection(anon,"buttons"))));
await check("ninguém cria pré-definido", assertFails(setDoc(doc(ana,"buttons","x"),{color:"#000000",icon:"x",isDefault:true,name:"x",text:"x"})));
await check("ninguém edita pré-definido", assertFails(updateDoc(doc(rui,"buttons","sim"),{text:"x"})));
await check("ninguém apaga pré-definido", assertFails(deleteDoc(doc(ana,"buttons","sim"))));

console.log(`\n${ok} ok, ${bad} falharam`); await env.cleanup(); process.exit(bad?1:0);
