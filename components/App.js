import { useEffect, useMemo, useState } from "react";

/** ——— UTIL ——— */
const hojeISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 9);

/** ——— TIPOS ——— */
const STATUS = ["Novo", "Em contato", "Proposta", "Fechado", "Perdido"];
const CANAIS = ["WhatsApp", "Instagram", "Telefone", "Indicação", "Visita"];

/** ——— ARMAZENAMENTO ——— */
const STORAGE_KEY = "novecrm_leads_v1";

function loadLeads() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLeads(leads) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

/** ——— APP ——— */
export default function App() {
  const [leads, setLeads] = useState([]);
  const [q, setQ] = useState("");

  // formulário
  const [form, setForm] = useState({
    id: null,
    nome: "",
    telefone: "",
    canal: "WhatsApp",
    status: "Novo",
    dataPrimeiroContato: hojeISO(), // <- preenche com a data de hoje
    observacoes: "", // <- até 500 caracteres
  });

  // carregar do localStorage
  useEffect(() => {
    setLeads(loadLeads());
  }, []);

  // salvar sempre que mudar
  useEffect(() => {
    saveLeads(leads);
  }, [leads]);

  const filtrados = useMemo(() => {
    if (!q.trim()) return leads;
    const k = q.toLowerCase();
    return leads.filter(
      (l) =>
        l.nome.toLowerCase().includes(k) ||
        (l.telefone || "").toLowerCase().includes(k) ||
        (l.observacoes || "").toLowerCase().includes(k)
    );
  }, [q, leads]);

  function resetForm() {
    setForm({
      id: null,
      nome: "",
      telefone: "",
      canal: "WhatsApp",
      status: "Novo",
      dataPrimeiroContato: hojeISO(),
      observacoes: "",
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = { ...form, id: form.id || uid() };
    // validações simples
    if (!payload.nome.trim()) {
      alert("Informe o nome.");
      return;
    }
    if (payload.observacoes.length > 500) {
      alert("Observações deve ter no máximo 500 caracteres.");
      return;
    }

    setLeads((prev) => {
      const exists = prev.some((l) => l.id === payload.id);
      return exists
        ? prev.map((l) => (l.id === payload.id ? payload : l))
        : [{ ...payload }, ...prev];
    });
    resetForm();
  }

  function editar(lead) {
    setForm({ ...lead });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remover(id) {
    if (confirm("Remover este registro?")) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Nove CRM</h1>
        <p className="text-slate-300 mb-6">Primeiro protótipo funcional.</p>

        {/* FORMULÁRIO */}
        <form
          onSubmit={handleSubmit}
          className="grid gap-3 bg-slate-900/70 rounded-xl p-4 sm:p-6"
        >
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1">
              <span className="text-sm text-slate-300">Nome*</span>
              <input
                className="bg-slate-800 rounded-lg px-3 py-2 outline-none"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex.: Maria Silva"
                required
              />
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-300">Telefone</span>
              <input
                className="bg-slate-800 rounded-lg px-3 py-2 outline-none"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="Ex.: (94) 9 9999-9999"
              />
            </label>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <label className="grid gap-1">
              <span className="text-sm text-slate-300">Canal</span>
              <select
                className="bg-slate-800 rounded-lg px-3 py-2 outline-none"
                value={form.canal}
                onChange={(e) => setForm({ ...form, canal: e.target.value })}
              >
                {CANAIS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-300">Status</span>
              <select
                className="bg-slate-800 rounded-lg px-3 py-2 outline-none"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1">
              <span className="text-sm text-slate-300">
                Data do primeiro contato
              </span>
              <input
                type="date"
                className="bg-slate-800 rounded-lg px-3 py-2 outline-none"
                value={form.dataPrimeiroContato}
                onChange={(e) =>
                  setForm({ ...form, dataPrimeiroContato: e.target.value })
                }
              />
            </label>
          </div>

          <label className="grid gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Observações</span>
              <span className="text-xs text-slate-400">
                {form.observacoes.length}/500
              </span>
            </div>
            <textarea
              className="bg-slate-800 rounded-lg px-3 py-2 outline-none min-h-[100px]"
              value={form.observacoes}
              onChange={(e) =>
                setForm({
                  ...form,
                  observacoes: e.target.value.slice(0, 500), // limita a 500
                })
              }
              placeholder="Notas rápidas sobre a visita/negociação (até 500 caracteres)"
            />
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 transition rounded-lg px-4 py-2 font-medium"
            >
              {form.id ? "Salvar alterações" : "Adicionar lead"}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-700 hover:bg-slate-600 transition rounded-lg px-4 py-2"
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>

        {/* BUSCA */}
        <div className="mt-6 flex items-center gap-3">
          <input
            className="flex-1 bg-slate-800 rounded-lg px-3 py-2 outline-none"
            placeholder="Buscar por nome, telefone ou observações…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <span className="text-slate-400 text-sm">
            {filtrados.length} resultado(s)
          </span>
        </div>

        {/* LISTA */}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-300">
                <th className="py-2 pr-3">Nome</th>
                <th className="py-2 pr-3">Telefone</th>
                <th className="py-2 pr-3">Canal</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">1º Contato</th>
                <th className="py-2 pr-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((l) => (
                <tr key={l.id} className="border-t border-slate-800">
                  <td className="py-2 pr-3">{l.nome}</td>
                  <td className="py-2 pr-3">{l.telefone || "—"}</td>
                  <td className="py-2 pr-3">{l.canal}</td>
                  <td className="py-2 pr-3">{l.status}</td>
                  <td className="py-2 pr-3">{l.dataPrimeiroContato}</td>
                  <td className="py-2 pr-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => editar(l)}
                        className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => remover(l.id)}
                        className="px-2 py-1 rounded bg-rose-600 hover:bg-rose-500"
                      >
                        Remover
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-6 text-slate-400">
                    Nenhum lead ainda. Adicione acima para começar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
