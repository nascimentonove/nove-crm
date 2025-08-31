import { useState } from "react";

const APP_NAME = "Nove CRM";
const APP_SLOGAN = "Organize seus clientes, organize seus resultados.";
const BRAND_COLOR = "#16A34A";

const STATUSES = [
  { value: "em_negociacao", label: "Em negociação" },
  { value: "resposta_7d", label: "Resposta em até 7 dias" },
  { value: "prazo_10d_mais", label: "Prazo > 10 dias" },
  { value: "sinalizacao_positiva", label: "Positivo" },
  { value: "sinalizacao_negativa", label: "Negativo" },
];

const CHANNELS = [
  { value: "visita", label: "Visita" },
  { value: "ligacao", label: "Ligação" },
];

function statusClasses(v){
  switch(v){
    case "sinalizacao_positiva": return "bg-green-100 text-green-800 border-green-200";
    case "sinalizacao_negativa": return "bg-red-100 text-red-800 border-red-200";
    case "resposta_7d": return "bg-amber-100 text-amber-800 border-amber-200";
    case "prazo_10d_mais": return "bg-blue-100 text-blue-800 border-blue-200";
    case "em_negociacao":
    default: return "bg-neutral-100 text-neutral-800 border-neutral-200";
  }
}

function Header({ onNew, onLogout }) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-neutral-200">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Nove CRM" className="h-7 w-7 rounded-xl" />
          <span className="font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onNew} className="px-3 py-1.5 rounded-xl text-white text-sm" style={{backgroundColor: BRAND_COLOR}}>+ Nova</button>
          <button onClick={onLogout} className="px-3 py-1.5 rounded-xl border border-neutral-300 text-sm">Sair</button>
        </div>
      </div>
    </header>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Preencha e-mail e senha.");
    onLogin({ email });
  };
  return (
    <div className="min-h-screen grid place-items-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm text-center">
        <img src="/logo.png" alt="Nove CRM" className="h-16 mx-auto mb-4" />
        <h1 className="font-semibold text-xl mb-1">{APP_NAME}</h1>
        <p className="text-sm text-neutral-600 mb-4">{APP_SLOGAN}</p>
        <form className="mt-2 space-y-3 text-left" onSubmit={handleSubmit}>
          <input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" placeholder="E-mail" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" placeholder="Senha" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <button type="submit" className="w-full rounded-xl text-white py-2 text-sm" style={{backgroundColor: BRAND_COLOR}}>Entrar</button>
        </form>
      </div>
    </div>
  );
}

function Feed({ posts, onOpenDetail }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold">Clientes</h2>
      <div className="mt-4 grid md:grid-cols-2 gap-4">
        {posts.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-600">
            Nenhum cliente ainda. Clique em “+ Nova”.
          </div>
        )}
        {posts.map((p) => (
          <article key={p.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition cursor-pointer" onClick={()=>onOpenDetail(p)}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{p.nome}</h3>
              <span className={`text-xs px-2 py-1 rounded-full border ${statusClasses(p.status)}`}>{labelForStatus(p.status)}</span>
            </div>
            <p className="text-sm text-neutral-700">{p.produto || "—"}</p>
            <p className="text-sm text-neutral-500">{formatDate(p.created_at)}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function NewPost({ onCancel, onSave }) {
  const steps = ["nome","produto","valor","telefone","canal","status","midia"];
  const [step, setStep] = useState(0);
  const [data, setData] = useState({nome:"",produto:"",valor:"",telefone:"",canal:CHANNELS[0].value,status:STATUSES[0].value,midia:[]});

  const next = () => { if (step < steps.length-1) setStep(step+1); else handleSave(); };
  const back = () => { if (step>0) setStep(step-1); else onCancel(); };

  const handleSave = () => {
    if (!data.nome) return alert("Informe o nome do cliente");
    const post = { ...data, id: cryptoRandom(), valor: data.valor ? toBRL(data.valor) : "", created_at: new Date().toISOString() };
    onSave(post);
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-6">
      <p className="text-sm text-neutral-600 mb-2">Passo {step+1} de {steps.length}</p>

      {steps[step]==="nome" && (
        <div>
          <h2 className="text-lg font-semibold mb-2">👤 Nome do Cliente</h2>
          <input value={data.nome} onChange={e=>setData({...data,nome:e.target.value})} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" placeholder="Ex.: Maria Souza" />
        </div>
      )}
      {steps[step]==="produto" && (
        <div>
          <h2 className="text-lg font-semibold mb-2">📦 Produto sugerido</h2>
          <input value={data.produto} onChange={e=>setData({...data,produto:e.target.value})} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" placeholder="Ex.: Grama sintética" />
        </div>
      )}
      {steps[step]==="valor" && (
        <div>
          <h2 className="text-lg font-semibold mb-2">💰 Valor da proposta</h2>
          <input value={data.valor} onChange={e=>setData({...data,valor:e.target.value})} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" placeholder="Ex.: 1500" />
        </div>
      )}
      {steps[step]==="telefone" && (
        <div>
          <h2 className="text-lg font-semibold mb-2">📱 Telefone/WhatsApp</h2>
          <input value={data.telefone} onChange={e=>setData({...data,telefone:e.target.value})} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" placeholder="Ex.: (94) 9 9999-9999" />
        </div>
      )}
      {steps[step]==="canal" && (
        <div>
          <h2 className="text-lg font-semibold mb-2">🔊 Canal</h2>
          <select value={data.canal} onChange={e=>setData({...data,canal:e.target.value})} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm">
            {CHANNELS.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
      )}
      {steps[step]==="status" && (
        <div>
          <h2 className="text-lg font-semibold mb-2">🔄 Status</h2>
          <select value={data.status} onChange={e=>setData({...data,status:e.target.value})} className={`w-full rounded-xl border px-3 py-2 text-sm ${statusClasses(data.status)}`}>
            {STATUSES.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      )}
      {steps[step]==="midia" && (
        <div>
          <h2 className="text-lg font-semibold mb-2">📷 Adicionar mídia</h2>
          <input type="file" multiple onChange={(e)=>setData({...data,midia:Array.from(e.target.files)})} className="block w-full text-sm" />
          {data.midia.length>0 && <p className="mt-1 text-xs text-neutral-600">{data.midia.length} arquivo(s) selecionado(s)</p>}
        </div>
      )}

      <div className="flex justify-between mt-6">
        <button onClick={back} className="px-4 py-2 rounded-xl border border-neutral-300 text-sm">Voltar</button>
        <button onClick={next} className="px-4 py-2 rounded-xl text-white text-sm" style={{backgroundColor: BRAND_COLOR}}>{step===steps.length-1?"Postar":"Avançar"}</button>
      </div>
    </div>
  );
}

function Detail({ post, onBack }) {
  if (!post) return null;
  const wa = buildWhatsAppLink(post.nome, post.produto);
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={onBack} className="mb-4 text-sm underline">← Voltar</button>
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{post.nome}</h2>
          <span className={`text-xs px-2 py-1 rounded-full border ${statusClasses(post.status)}`}>{labelForStatus(post.status)}</span>
        </div>
        <div className="mt-3 text-sm text-neutral-700 space-y-1">
          <p><strong>Produto:</strong> {post.produto || "—"}</p>
          <p><strong>Valor:</strong> {post.valor || "—"}</p>
          <p><strong>Telefone:</strong> {post.telefone || "—"}</p>
          <p><strong>Canal:</strong> {labelForChannel(post.canal)}</p>
          <p className="text-xs text-neutral-500">Criado em {formatDate(post.created_at)}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <a href={wa} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl text-white text-sm" style={{backgroundColor: BRAND_COLOR}}>Abrir WhatsApp</a>
        </div>
      </div>
    </div>
  );
}

function App(){
  const [user,setUser]=useState(null);
  const [view,setView]=useState("login");
  const [posts,setPosts]=useState([]);
  const [current,setCurrent]=useState(null);

  const handleLogin=u=>{setUser(u);setView("feed")};
  const handleLogout=()=>{setUser(null);setView("login")};
  const handleNew=()=>setView("new");
  const handleSave=(post)=>{setPosts([post,...posts]);setView("feed");setCurrent(post)};
  const openDetail=(p)=>{setCurrent(p);setView("detail")};

  if(view==="login") return <Login onLogin={handleLogin}/>;
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Header onNew={handleNew} onLogout={handleLogout} />
      {view==="feed" && <Feed posts={posts} onOpenDetail={openDetail} />}
      {view==="new" && <NewPost onCancel={()=>setView("feed")} onSave={handleSave} />}
      {view==="detail" && <Detail post={current} onBack={()=>setView("feed")} />}
    </div>
  );
}

// Utils
function labelForStatus(v){ return STATUSES.find(s=>s.value===v)?.label || v }
function labelForChannel(v){ return CHANNELS.find(c=>c.value===v)?.label || v }
function formatDate(iso){ return new Date(iso).toLocaleString(); }
function cryptoRandom(){ return Math.random().toString(36).slice(2) }
function toBRL(v){ const n=Number(String(v).replace(/\\./g,\"\").replace(\",\",\".\")); if(isNaN(n)) return v; return n.toLocaleString(\"pt-BR\",{style:\"currency\",currency:\"BRL\"}); }
function buildWhatsAppLink(nome, produto){
  const text=encodeURIComponent(`Olá, ${nome}! Sobre ${produto||'sua negociação'}, podemos falar?`);
  return `https://wa.me/?text=${text}`;
}

export default App;
