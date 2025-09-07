import { useEffect, useMemo, useState } from "react";

/** =========================
 *  CONFIG / CONSTANTES
 *  ========================= */
const APP_NAME = "Nove CRM";
const APP_SLOGAN = "Organize seus clientes, melhore seus resultados.";
const BRAND_COLOR = "#16A34A"; // verde

// storage keys
const USERS_KEY = "novecrm_users_v1";
const SESSION_KEY = "novecrm_session_v1";
const POSTS_KEY = (username) => `novecrm_posts_${username}_v1`;

// Status (mantido como estava)
const STATUSES = [
  { value: "em_negociacao", label: "Em negociação" },
  { value: "resposta_7d", label: "Resposta em até 7 dias" },
  { value: "prazo_10d_mais", label: "Prazo > 10 dias" },
  { value: "sinalizacao_positiva", label: "Positivo" },
  { value: "sinalizacao_negativa", label: "Negativo" },
];

// Canal (exatamente: visita, ligação, redes sociais, outros)
const CHANNELS = [
  { value: "visita", label: "Visita" },
  { value: "ligacao", label: "Ligação" },
  { value: "redes_sociais", label: "Redes sociais" },
  { value: "outros", label: "Outros" },
];

/** =========================
 *  HELPERS
 *  ========================= */
function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function nowISO() {
  return new Date().toISOString();
}
function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function labelStatus(v) {
  return STATUSES.find((s) => s.value === v)?.label || v;
}
function labelCanal(v) {
  return CHANNELS.find((c) => c.value === v)?.label || v;
}
function statusClasses(v) {
  switch (v) {
    case "sinalizacao_positiva":
      return "bg-green-100 text-green-800 border-green-200";
    case "sinalizacao_negativa":
      return "bg-red-100 text-red-800 border-red-200";
    case "resposta_7d":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "prazo_10d_mais":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "em_negociacao":
    default:
      return "bg-neutral-100 text-neutral-800 border-neutral-200";
  }
}
function buildWhatsAppLink(nome, produto) {
  const text = encodeURIComponent(
    `Olá, ${nome}! Sobre ${produto || "sua proposta"}, podemos falar?`
  );
  return `https://wa.me/?text=${text}`;
}
function formatBRL(v) {
  if (v === null || v === undefined || v === "") return "";
  const n = Number(String(v).replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(n)) return v;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function parseMoneyForStore(v) {
  // guarda o valor "como digitado" (string), apenas limpa espaços
  return (v ?? "").toString().trim();
}

/** storage */
function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function loadPosts(username) {
  try {
    const raw = localStorage.getItem(POSTS_KEY(username));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function savePosts(username, posts) {
  localStorage.setItem(POSTS_KEY(username), JSON.stringify(posts));
}

/** export CSV (inclui todos os campos do CRM + nomes dos anexos) */
function exportToCSV(username, items) {
  if (!items?.length) {
    alert("Não há registros para exportar.");
    return;
  }
  const headers = [
    "id",
    "cliente",
    "produto",
    "valor",
    "telefone",
    "dataPrimeiroContato",
    "canal",
    "status",
    "observacoes",
    "anexos", // nomes separados por "; "
    "createdAt",
    "updatedAt",
  ];
  const rows = items.map((p) => {
    const anexos = (p.attachments || []).map((a) => a.name).join("; ");
    return headers
      .map((h) => {
        const v = h === "anexos" ? anexos : p[h] ?? "";
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      })
      .join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `novecrm_${username}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** =========================
 *  HEADER
 *  ========================= */
function Header({ onNew, onLogout, onExport, user }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Nove CRM" className="h-7 w-7 rounded-xl" />
          <div className="flex flex-col leading-tight">
            <span className="font-semibold">{APP_NAME}</span>
            <span className="text-xs text-neutral-500">@{user?.username}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="px-3 py-1.5 rounded-xl border border-neutral-300 text-sm"
            title="Exportar CSV"
          >
            Exportar CSV
          </button>
          <button
            onClick={onNew}
            className="px-3 py-1.5 rounded-xl text-white text-sm"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            + Novo
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl border border-neutral-300 text-sm"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}

/** =========================
 *  AUTENTICAÇÃO (CADASTRO + LOGIN)
 *  ========================= */
function Auth({ onLogin }) {
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [keep, setKeep] = useState(true);

  // Login
  const [lUser, setLUser] = useState("");
  const [lPass, setLPass] = useState("");

  // Signup
  const [sName, setSName] = useState("");
  const [sWhats, setSWhats] = useState("");
  const [sUser, setSUser] = useState("");
  const [sPass, setSPass] = useState("");

  function handleSignup(e) {
    e.preventDefault();
    if (!sName.trim() || !sUser.trim() || !sPass.trim()) {
      alert("Preencha nome, username e senha.");
      return;
    }
    const users = loadUsers();
    if (users.some((u) => u.username === sUser)) {
      alert("Esse username já existe. Tente outro.");
      return;
    }
    const newUser = {
      id: uid(),
      name: sName.trim(),
      whatsapp: sWhats.trim(),
      username: sUser.trim(),
      password: sPass,
      createdAt: nowISO(),
    };
    saveUsers([newUser, ...users]);
    alert("Cadastro criado! Agora faça login.");
    setMode("login");
    setLUser(sUser);
  }

  function handleLogin(e) {
    e.preventDefault();
    const users = loadUsers();
    const u = users.find((x) => x.username === lUser && x.password === lPass);
    if (!u) {
      alert("Usuário ou senha inválidos.");
      return;
    }
    if (keep) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    onLogin(u);
  }

  return (
    <div className="min-h-screen grid place-items-center bg-neutral-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="text-center">
          <img src="/logo.png" alt="Nove CRM" className="h-14 mx-auto mb-3" />
          <h1 className="font-semibold text-xl">{APP_NAME}</h1>
          <p className="text-sm text-neutral-600 mb-4">{APP_SLOGAN}</p>
        </div>

        {mode === "login" ? (
          <form className="space-y-3" onSubmit={handleLogin}>
            <input
              value={lUser}
              onChange={(e) => setLUser(e.target.value)}
              placeholder="Username"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              type="password"
              value={lPass}
              onChange={(e) => setLPass(e.target.value)}
              placeholder="Senha"
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />

            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={keep}
                onChange={(e) => setKeep(e.target.checked)}
              />
              Manter conectado neste dispositivo
            </label>

            <button
              type="submit"
              className="w-full rounded-xl text-white py-2 text-sm"
              style={{ backgroundColor: BRAND_COLOR }}
            >
              Entrar
            </button>

            <div className="text-center text-sm text-neutral-600">
              Não tem conta?{" "}
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="underline"
              >
                Cadastre-se
              </button>
            </div>
          </form>
        ) : (
          <form className="space-y-3" onSubmit={handleSignup}>
            <div className="grid grid-cols-1 gap-3">
              <input
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                placeholder="Nome e sobrenome"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                value={sWhats}
                onChange={(e) => setSWhats(e.target.value)}
                placeholder="WhatsApp (opcional)"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                value={sUser}
                onChange={(e) => setSUser(e.target.value)}
                placeholder="Username (login)"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                type="password"
                value={sPass}
                onChange={(e) => setSPass(e.target.value)}
                placeholder="Senha"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-xl text-white py-2 text-sm"
              style={{ backgroundColor: BRAND_COLOR }}
            >
              Criar conta
            </button>

            <div className="text-center text-sm text-neutral-600">
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="underline"
              >
                Entrar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/** =========================
 *  FORM DE REGISTRO (CRM) — CAMPOS EXATOS
 *  ========================= */
// Modelo CRM:
// {id, cliente, produto, valor, telefone, dataPrimeiroContato, canal, status, observacoes, attachments[], createdAt, updatedAt}
function NewOrEditPost({ initial, onCancel, onSave }) {
  const isEdit = !!initial?.id;

  const [cliente, setCliente] = useState(initial?.cliente || "");
  const [produto, setProduto] = useState(initial?.produto || "");
  const [valor, setValor] = useState(initial?.valor || "");
  const [telefone, setTelefone] = useState(initial?.telefone || "");
  const [dataPrimeiroContato, setDataPrimeiroContato] = useState(
    (initial?.dataPrimeiroContato || todayISO()).slice(0, 10)
  );
  const [canal, setCanal] = useState(initial?.canal || CHANNELS[0].value);
  const [status, setStatus] = useState(initial?.status || STATUSES[0].value);
  const [observacoes, setObservacoes] = useState(initial?.observacoes || "");
  const [attachments, setAttachments] = useState(initial?.attachments || []);

  // Ao selecionar arquivos: guardamos apenas metadados + URL temporária para esta sessão
  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    const mapped = files.map((f) => ({
      id: uid(),
      name: f.name,
      type: f.type,
      size: f.size,
      // URL temporária (não persiste após fechar o navegador)
      url: URL.createObjectURL(f),
      _ephemeral: true,
    }));
    setAttachments((prev) => [...mapped, ...prev]);
  }
  // Remover anexo da lista
  function removeAttachment(id) {
    setAttachments((prev) => {
      prev.forEach((a) => {
        if (a.id === id && a.url && a._ephemeral) URL.revokeObjectURL(a.url);
      });
      return prev.filter((a) => a.id !== id);
    });
  }

  function submit(e) {
    e.preventDefault();
    if (!cliente.trim()) return alert("Informe o nome do(a) cliente.");
    if (observacoes.length > 500)
      return alert("Observações deve ter no máximo 500 caracteres.");

    const payload = {
      id: initial?.id || uid(),
      cliente: cliente.trim(),
      produto: produto.trim(),
      valor: parseMoneyForStore(valor),
      telefone: telefone.trim(),
      dataPrimeiroContato,
      canal,
      status,
      observacoes: observacoes.slice(0, 500),
      attachments, // guardamos metadados e URLs temporárias desta sessão
      createdAt: initial?.createdAt || nowISO(),
      updatedAt: nowISO(),
    };
    onSave(payload);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h2 className="text-lg font-semibold mb-3">
        {isEdit ? "Editar registro" : "Novo registro"}
      </h2>

      <form onSubmit={submit} className="grid gap-3">
        {/* Nome do(a) cliente */}
        <label className="grid gap-1">
          <span className="text-sm text-neutral-600">Nome do(a) cliente:</span>
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Ex.: Maria Souza"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        {/* Produto sugerido */}
        <label className="grid gap-1">
          <span className="text-sm text-neutral-600">Produto sugerido:</span>
          <input
            value={produto}
            onChange={(e) => setProduto(e.target.value)}
            placeholder="Ex.: Grama sintética"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        {/* Valor da proposta */}
        <label className="grid gap-1">
          <span className="text-sm text-neutral-600">Valor da proposta:</span>
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="Ex.: 1500 ou 1.500,00"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <span className="text-xs text-neutral-500">
            Mostrado como: {formatBRL(valor) || "—"}
          </span>
        </label>

        {/* Telefone/WhatsApp */}
        <label className="grid gap-1">
          <span className="text-sm text-neutral-600">Telefone/WhatsApp:</span>
          <input
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Ex.: (94) 9 9999-9999"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        {/* Data, Canal, Status */}
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="grid gap-1">
            <span className="text-sm text-neutral-600">
              Data do primeiro contato:
            </span>
            <input
              type="date"
              value={dataPrimeiroContato}
              onChange={(e) => setDataPrimeiroContato(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-neutral-600">Canal:</span>
            <select
              value={canal}
              onChange={(e) => setCanal(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              {CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-sm text-neutral-600">Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`w-full rounded-xl border px-3 py-2 text-sm ${statusClasses(
                status
              )}`}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Observações */}
        <label className="grid gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-600">
              Observações (até 500 caracteres)
            </span>
            <span className="text-xs text-neutral-500">
              {observacoes.length}/500
            </span>
          </div>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value.slice(0, 500))}
            rows={6}
            placeholder="Notas sobre visita/negociação…"
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>

        {/* Incluir arquivo (docs ou mídia) */}
        <div className="grid gap-2">
          <span className="text-sm text-neutral-600">Incluir arquivo:</span>
          <input
            type="file"
            multiple
            onChange={handleFiles}
            className="block w-full text-sm"
          />
          {attachments.length > 0 && (
            <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50">
              <p className="text-sm font-medium mb-2">
                {attachments.length} arquivo(s) selecionado(s)
              </p>
              <ul className="text-sm text-neutral-700 space-y-1">
                {attachments.map((a) => (
                  <li key={a.id} className="flex items-center justify-between">
                    <div className="truncate">
                      {a.name}{" "}
                      <span className="text-xs text-neutral-500">
                        ({Math.round(a.size / 1024)} KB)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {a.url && (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-600 underline text-xs"
                        >
                          abrir
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => removeAttachment(a.id)}
                        className="text-xs text-rose-600 underline"
                      >
                        remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-neutral-500 mt-2">
                Observação: sem backend, os arquivos vistos como “abrir” só
                ficam disponíveis nesta sessão. Após recarregar, os nomes
                permanecem, mas o arquivo precisa ser anexado novamente para
                abrir/baixar.
              </p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-white text-sm"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            {isEdit ? "Salvar alterações" : "Salvar registro"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-neutral-300 text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

/** =========================
 *  FEED (LISTA + BUSCA + FILTROS)
 *  ========================= */
function Feed({ items, onOpen, onNew, onFilter }) {
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fCanal, setFCanal] = useState("");

  useEffect(() => {
    onFilter({ q, status: fStatus, canal: fCanal });
  }, [q, fStatus, fCanal]); // eslint-disable-line

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Últimos registros</h2>
        <button
          onClick={onNew}
          className="px-3 py-1.5 rounded-xl text-white text-sm"
          style={{ backgroundColor: BRAND_COLOR }}
        >
          + Novo
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <input
          className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          placeholder="Buscar por nome, produto, telefone ou observações…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          value={fStatus}
          onChange={(e) => setFStatus(e.target.value)}
        >
          <option value="">Status (todos)</option>
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          value={fCanal}
          onChange={(e) => setFCanal(e.target.value)}
        >
          <option value="">Canal (todos)</option>
          {CHANNELS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-neutral-600">
          Nenhum registro ainda. Clique em “+ Novo”.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((p) => {
            const wa = buildWhatsAppLink(p.cliente, p.produto);
            return (
              <article
                key={p.id}
                className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{p.cliente}</h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${statusClasses(
                      p.status
                    )}`}
                  >
                    {labelStatus(p.status)}
                  </span>
                </div>

                <p className="text-sm text-neutral-700 mt-1">
                  {p.produto || "—"}
                </p>
                <p className="text-sm text-neutral-700">
                  {formatBRL(p.valor) || "—"}
                </p>
                <p className="text-xs text-neutral-500">
                  Criado em {new Date(p.createdAt).toLocaleString()}
                </p>
                {p.dataPrimeiroContato && (
                  <p className="text-xs text-neutral-500">
                    1º contato:{" "}
                    {new Date(p.dataPrimeiroContato).toLocaleDateString()}
                  </p>
                )}

                <div className="mt-3 flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded-xl border border-neutral-300 text-sm"
                    onClick={() => onOpen(p)}
                  >
                    Detalhes
                  </button>
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl text-white text-sm"
                    style={{ backgroundColor: BRAND_COLOR }}
                  >
                    WhatsApp
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** =========================
 *  DETALHE
 *  ========================= */
function Detail({ post, onBack, onEdit, onDelete }) {
  if (!post) return null;
  const wa = buildWhatsAppLink(post.cliente, post.produto);
  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-start justify-between mb-3">
        <button onClick={onBack} className="text-sm underline">
          ← Voltar
        </button>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-xl border border-neutral-300 text-sm"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 rounded-xl text-white text-sm"
            style={{ backgroundColor: "#ef4444" }}
          >
            Excluir
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{post.cliente}</h2>
          <span
            className={`text-xs px-2 py-1 rounded-full border ${statusClasses(
              post.status
            )}`}
          >
            {labelStatus(post.status)}
          </span>
        </div>

        <div className="mt-3 text-sm text-neutral-700 space-y-1">
          <p>
            <strong>Produto sugerido:</strong> {post.produto || "—"}
          </p>
          <p>
            <strong>Valor da proposta:</strong> {formatBRL(post.valor) || "—"}
          </p>
          <p>
            <strong>Telefone/WhatsApp:</strong> {post.telefone || "—"}
          </p>
          <p>
            <strong>Canal:</strong> {labelCanal(post.canal)}
          </p>
          {post.dataPrimeiroContato && (
            <p>
              <strong>Data do primeiro contato:</strong>{" "}
              {new Date(post.dataPrimeiroContato).toLocaleDateString()}
            </p>
          )}
          {post.observacoes && (
            <p className="whitespace-pre-wrap">
              <strong>Observações:</strong> {post.observacoes}
            </p>
          )}
          {post.attachments?.length > 0 && (
            <div className="mt-2">
              <strong>Anexos:</strong>
              <ul className="list-disc pl-5">
                {post.attachments.map((a) => (
                  <li key={a.id} className="break-words">
                    {a.url ? (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-emerald-700"
                      >
                        {a.name}
                      </a>
                    ) : (
                      <span>{a.name}</span>
                    )}{" "}
                    <span className="text-xs text-neutral-500">
                      ({Math.round(a.size / 1024)} KB)
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-neutral-500 mt-1">
                Observação: anexos com link só estão disponíveis nesta sessão.
                Após recarregar, os nomes são exibidos, mas é preciso anexar
                novamente para abrir/baixar.
              </p>
            </div>
          )}
          <p className="text-xs text-neutral-500">
            Criado em {new Date(post.createdAt).toLocaleString()}
            {post.updatedAt
              ? ` • Atualizado ${new Date(post.updatedAt).toLocaleString()}`
              : ""}
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl text-white text-sm"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            Abrir WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

/** =========================
 *  APP PRINCIPAL
 *  ========================= */
export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("auth"); // 'auth' | 'feed' | 'new' | 'detail' | 'edit'
  const [posts, setPosts] = useState([]);
  const [current, setCurrent] = useState(null);
  const [filters, setFilters] = useState({ q: "", status: "", canal: "" });

  // restaura sessão, se houver
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const u = JSON.parse(raw);
        setUser(u);
        setView("feed");
        setPosts(
          loadPosts(u.username).sort((a, b) =>
            a.createdAt < b.createdAt ? 1 : -1
          )
        );
      }
    } catch {}
  }, []);

  // quando logar
  function handleLogin(u) {
    setUser(u);
    setView("feed");
    setPosts(
      loadPosts(u.username).sort((a, b) =>
        a.createdAt < b.createdAt ? 1 : -1
      )
    );
  }

  function handleLogout() {
    setUser(null);
    setView("auth");
    setPosts([]);
    setCurrent(null);
    // para forçar sair sempre: localStorage.removeItem(SESSION_KEY);
  }

  // salvar/criar registro
  function upsertPost(p) {
    setPosts((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      // revoga URLs dos anexos que foram removidos na edição
      if (exists) {
        const before = prev.find((x) => x.id === p.id);
        (before.attachments || []).forEach((a) => {
          const still = (p.attachments || []).some((b) => b.id === a.id);
          if (!still && a.url && a._ephemeral) URL.revokeObjectURL(a.url);
        });
      }
      const next = exists ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev];
      savePosts(user.username, next);
      return next.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    });
    setCurrent(p);
    setView("detail");
  }

  // deletar registro
  function deletePost(id) {
    if (!confirm("Excluir este registro?")) return;
    setPosts((prev) => {
      const doomed = prev.find((x) => x.id === id);
      (doomed?.attachments || []).forEach((a) => {
        if (a.url && a._ephemeral) URL.revokeObjectURL(a.url);
      });
      const next = prev.filter((x) => x.id !== id);
      savePosts(user.username, next);
      return next;
    });
    setCurrent(null);
    setView("feed");
  }

  // busca/filtros
  const filtered = useMemo(() => {
    let list = [...posts];
    const k = filters.q.trim().toLowerCase();
    if (k) {
      list = list.filter(
        (p) =>
          p.cliente.toLowerCase().includes(k) ||
          (p.produto || "").toLowerCase().includes(k) ||
          (p.telefone || "").toLowerCase().includes(k) ||
          (p.observacoes || "").toLowerCase().includes(k)
      );
    }
    if (filters.status) list = list.filter((p) => p.status === filters.status);
    if (filters.canal) list = list.filter((p) => p.canal === filters.canal);
    return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [posts, filters]);

  // RENDER
  if (!user || view === "auth") return <Auth onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <Header
        onNew={() => setView("new")}
        onLogout={handleLogout}
        onExport={() => exportToCSV(user.username, filtered)}
        user={user}
      />

      {view === "feed" && (
        <Feed
          items={filtered}
          onOpen={(p) => {
            setCurrent(p);
            setView("detail");
          }}
          onNew={() => setView("new")}
          onFilter={(f) => setFilters(f)}
        />
      )}

      {view === "new" && (
        <NewOrEditPost
          onCancel={() => setView("feed")}
          onSave={(p) => upsertPost(p)}
        />
      )}

      {view === "edit" && (
        <NewOrEditPost
          initial={current}
          onCancel={() => setView("detail")}
          onSave={(p) => upsertPost(p)}
        />
      )}

      {view === "detail" && (
        <Detail
          post={current}
          onBack={() => setView("feed")}
          onEdit={() => setView("edit")}
          onDelete={() => deletePost(current.id)}
        />
      )}
    </div>
  );
}
