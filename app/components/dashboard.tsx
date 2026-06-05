"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useToast } from "../lib/toast-context";
import { getSupabase } from "../lib/supabase-client";
import { apiGetAll, apiInsert, apiUpdate, apiRemove, apiSeed } from "../lib/api-helper";
import { appConfig, isLowStock, getTableById, getPrimaryTable, type TableConfig } from "../lib/config";
import type { Row } from "../types";
import { hasWorkflow, countByState, formatStateLabel } from "../lib/workflow";
import { StatusBadge, StatusDropdown } from "./workflow";
import Navbar from "./navbar";
import Chat from "./chat";
import EditModal from "./edit-modal";
import Spin from "./spin";
import { BarChartView, type BarDatum } from "./charts/bar-chart";
import { PieChartView, type PieDatum } from "./charts/pie-chart";
import { FileUpload, ImagePreview } from "./upload";
import { Can } from "./role";
import { useUserRole } from "../lib/role-context";

export default function DashboardView() {
  const { showToast } = useToast();
  const [activeTableId, setActiveTableId] = useState<string>(getPrimaryTable().id);
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Row | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const currentTable: TableConfig = getTableById(activeTableId) ?? getPrimaryTable();
  const useWorkflow = hasWorkflow(currentTable);
  const { role: currentRole } = useUserRole();

  const [, startTableTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    startTableTransition(() => {
      setLoading(true);
      setItems([]);
    });
    apiGetAll(activeTableId)
      .then((data) => {
        if (cancelled) return;
        setItems(data);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [activeTableId]);

  useEffect(() => {
    const tableName = currentTable.tableName ?? currentTable.id;
    const channel = getSupabase()
      .channel(`changes-${activeTableId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: tableName },
        () => {
          apiGetAll(activeTableId)
            .then((data) => setItems(data))
            .catch(() => {});
        }
      )
      .subscribe();

    return () => {
      getSupabase().removeChannel(channel);
    };
  }, [activeTableId, currentTable]);

  function switchTable(id: string) {
    if (id === activeTableId) return;
    setSearch("");
    setFilter("all");
    setForm({});
    setShowForm(false);
    setEditItem(null);
    setActiveTableId(id);
  }

  const filterPills: { key: string; label: string }[] = useWorkflow
    ? (currentTable.workflow ?? []).map((s) => ({ key: s, label: s }))
    : [
        { key: "all", label: "All" },
        { key: "low", label: "Low stock" },
        { key: "ok", label: "In stock" },
      ];

  async function add() {
    const required = currentTable.fields.filter((f) => f.required).map((f) => f.key);
    if (required.some((k) => !form[k])) {
      showToast("Fill all required fields", "error");
      return;
    }
    setAdding(true);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of currentTable.fields) {
        const v = form[f.key];
        if (v === undefined || v === "") continue;
        payload[f.key] = f.type === "number" ? Number(v) : v;
      }
      const row = await apiInsert(currentTable.id, payload);
      setItems((prev) => [...prev, row]);
      setForm({});
      setShowForm(false);
      showToast(`Created ${currentTable.entity.name} "${row.name}"`, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast(`Could not create: ${message}`, "error");
    } finally { setAdding(false); }
  }

  async function save(id: number, data: Row) {
    try {
      const updated = await apiUpdate(currentTable.id, id, data);
      setItems((prev) => prev.map((item) => (Number(item.id) === id ? updated : item)));
      setEditItem(null);
      showToast("Updated", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast(`Update failed: ${message}`, "error");
      throw error;
    }
  }

  async function del(id: number) {
    setDeleting(id);
    try {
      await apiRemove(currentTable.id, id);
      setItems((prev) => prev.filter((item) => Number(item.id) !== id));
      showToast("Deleted", "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast(`Delete failed: ${message}`, "error");
    } finally { setDeleting(null); }
  }

  async function seedSamples() {
    setSeeding(true);
    try {
      const rows = await apiSeed(currentTable.id);
      setItems((prev) => [...prev, ...rows]);
      showToast(`Loaded ${rows.length} sample ${currentTable.entity.plural}`, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      showToast(`Could not load samples: ${message}`, "error");
    } finally { setSeeding(false); }
  }

  const lowCount = items.filter((it) => isLowStock(it, currentTable)).length;
  const okCount = items.length - lowCount;
  const stateCounts = useMemo(
    () => (useWorkflow ? countByState(items, currentTable) : {}),
    [items, currentTable, useWorkflow],
  );

  const filtered = useMemo(() => items.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || currentTable.searchFields.some((f) => String(p[f] ?? "").toLowerCase().includes(q));
    let matchFilter: boolean;
    if (useWorkflow) {
      const state = String(p.status ?? "");
      matchFilter = filter === "all" || filter === state;
    } else {
      matchFilter = filter === "all"
        || (filter === "low" && isLowStock(p, currentTable))
        || (filter === "ok" && !isLowStock(p, currentTable));
    }
    return matchSearch && matchFilter;
  }), [items, search, filter, currentTable, useWorkflow]);

  const stats: { label: string; value: string }[] = [
    { label: `Total ${currentTable.entity.title}`, value: String(items.length) },
  ];
  if (useWorkflow) {
    for (const state of currentTable.workflow!) {
      stats.push({ label: formatStateLabel(state), value: String(stateCounts[state] ?? 0) });
    }
  } else {
    stats.push({ label: "Low Stock", value: String(lowCount) });
    stats.push({ label: "In Stock", value: String(okCount) });
  }
  stats.push({ label: "Filtered", value: String(filtered.length) });

  const categoricalField = currentTable.fields.find((f) => f.key !== "name" && f.type !== "number");
  const categoryChart: BarDatum[] = useMemo(() => {
    if (!categoricalField) return [];
    const counts = new Map<string, number>();
    for (const it of items) {
      const key = String(it[categoricalField.key] ?? "—");
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [items, categoricalField]);

  const statusPie: PieDatum[] = useMemo(() => {
    if (useWorkflow) {
      return (currentTable.workflow ?? []).map((state) => ({
        label: state,
        value: stateCounts[state] ?? 0,
      }));
    }
    return [
      { label: "In stock", value: okCount },
      { label: "Low stock", value: lowCount },
    ];
  }, [useWorkflow, currentTable, stateCounts, okCount, lowCount]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex">
        <aside className="hidden lg:flex w-56 flex-col border-r border-border bg-surface/40">
          {appConfig.tables.length > 1 && (
            <>
              <div className="px-4 py-3 border-b border-border">
                <p className="text-muted text-[10px] uppercase tracking-wider font-semibold mb-2">Tables</p>
                <div className="flex flex-col gap-0.5">
                  {appConfig.tables.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => switchTable(t.id)}
                      className={`text-left text-sm rounded-md px-2.5 py-1.5 transition-colors flex items-center justify-between ${
                        t.id === activeTableId ? "bg-accent/10 text-accent" : "text-muted hover:text-fg hover:bg-border/40"
                      }`}
                    >
                      <span className="truncate">{t.entity.title}</span>
                      <span className="text-[10px] font-mono opacity-70">{t.id}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-t border-border" />
            </>
          )}

          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-2 text-fg text-sm font-semibold">
              <span className="text-accent">&#9632;</span>
              <span>{currentTable.entity.title}</span>
            </div>
            <p className="text-muted text-[10px] font-mono mt-1">{items.length} {currentTable.entity.plural}</p>
          </div>
          <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
            {filterPills.map((pill) => (
              <button
                key={pill.key}
                onClick={() => setFilter(pill.key)}
                className={`text-left text-sm rounded-md px-3 py-2 transition-colors ${filter === pill.key ? "bg-accent/10 text-accent" : "text-muted hover:text-fg hover:bg-border/40"}`}
              >
                {pill.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className="bg-surface border border-border rounded-lg px-4 py-3.5 animate-fadeInUp"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <p className="text-muted text-[10px] sm:text-xs uppercase tracking-wider mb-1.5 font-medium">{s.label}</p>
                  <p className="text-lg sm:text-xl font-semibold text-fg">{s.value}</p>
                </div>
              ))}
            </div>

            {!loading && items.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {categoricalField && categoryChart.length > 0 && (
                  <div className="bg-surface border border-border rounded-lg p-4 animate-fadeInUp" style={{ animationDelay: "0.16s" }}>
                    <p className="text-muted text-[10px] uppercase tracking-wider font-medium mb-2">
                      By {categoricalField.label}
                    </p>
                    <BarChartView data={categoryChart} height={200} />
                  </div>
                )}
                <div className="bg-surface border border-border rounded-lg p-4 animate-fadeInUp" style={{ animationDelay: "0.2s" }}>
                  <p className="text-muted text-[10px] uppercase tracking-wider font-medium mb-2">Stock Status</p>
                  <PieChartView data={statusPie} height={200} />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 mb-4 items-stretch sm:items-center">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xs pointer-events-none">&#x1F50D;</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${currentTable.entity.plural}...`}
                  className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-fg text-sm outline-none focus:border-muted transition-colors"
                />
              </div>
              <div className="flex gap-1 flex-wrap">
                {filterPills.map((pill) => (
                  <button
                    key={pill.key}
                    onClick={() => setFilter(pill.key)}
                    className={`text-xs rounded-md px-3 py-2 border transition-colors ${filter === pill.key ? "bg-accent text-bg border-accent" : "bg-transparent text-muted border-border hover:border-muted hover:text-fg"}`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
              <Can action="edit">
                <button
                  onClick={() => setShowForm((prev) => !prev)}
                  className={`text-sm font-medium rounded-lg px-3.5 py-2 transition-colors whitespace-nowrap ${showForm ? "border border-border text-muted bg-surface hover:text-fg" : "bg-accent hover:bg-accent-hover text-bg"}`}
                >
                  {showForm ? "Cancel" : `+ Add ${currentTable.entity.name}`}
                </button>
              </Can>
            </div>

            {showForm && (
              <div className="bg-surface border border-border rounded-lg p-4 mb-4 animate-fadeIn">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                  {currentTable.fields.map((f) => (
                    <div key={f.key} className={f.type === "file" ? "col-span-2" : undefined}>
                      <label className="text-muted text-[10px] uppercase block mb-1.5 font-medium">
                        {f.label}{f.required && <span className="text-danger ml-0.5">*</span>}
                      </label>
                      {f.type === "file" ? (
                        <FileUpload
                          value={form[f.key]}
                          onChange={(url) => setForm((prev) => ({ ...prev, [f.key]: url ?? "" }))}
                          tableId={currentTable.id}
                        />
                      ) : (
                        <input
                          type={f.type === "number" ? "number" : "text"}
                          value={form[f.key] ?? ""}
                          placeholder={f.placeholder}
                          onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                          className="w-full bg-bg border border-border rounded-md px-2.5 py-1.5 text-fg text-sm outline-none focus:border-muted transition-colors"
                        />
                      )}
                    </div>
                  ))}
                  {useWorkflow && (
                    <div>
                      <label className="text-muted text-[10px] uppercase block mb-1.5 font-medium">
                        Status
                      </label>
                      <select
                        value={form.status ?? currentTable.workflow![0]}
                        onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                        className="w-full bg-bg border border-border rounded-md px-2.5 py-1.5 text-fg text-sm outline-none focus:border-muted transition-colors"
                      >
                        {(currentTable.workflow ?? []).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <button onClick={add} disabled={adding} className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg text-sm font-medium rounded-md px-3.5 py-1.5 transition-colors flex items-center gap-2">
                  {adding ? <><Spin s={10} /><span>Saving...</span></> : "Save"}
                </button>
              </div>
            )}

            {(search || filter !== "all") && (
              <p className="text-muted text-xs mb-3">
                Showing {filtered.length} of {items.length} {currentTable.entity.plural}
              </p>
            )}

            {loading ? (
              <div className="text-center py-16 text-muted">
                <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-mono">GET /api/{currentTable.id}</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-lg">
                <p className="text-fg text-sm mb-1">
                  {items.length === 0 ? `No ${currentTable.entity.plural} yet` : `No matches`}
                </p>
                <p className="text-muted text-xs mb-4">
                  {items.length === 0 ? `Add your first ${currentTable.entity.name} or load the sample set.` : `Try a different search or filter.`}
                </p>
                {items.length === 0 && (
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Can action="manage">
                      <button onClick={seedSamples} disabled={seeding} className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-bg text-sm font-medium rounded-md px-3.5 py-2 transition-colors">
                        {seeding ? "Loading..." : `Load sample ${currentTable.entity.plural}`}
                      </button>
                    </Can>
                    <Can action="edit">
                      <button onClick={() => setShowForm(true)} className="border border-border text-muted hover:text-fg hover:border-muted text-sm rounded-md px-3.5 py-2 transition-colors">
                        Add manually
                      </button>
                    </Can>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {filtered.map((item, i) => {
                  const id = Number(item.id);
                  const name = String(item.name ?? `#${id}`);
                  const state = String(item.status ?? "");
                  const firstFile = currentTable.fields.find((f) => f.type === "file");
                  const fileUrl = firstFile ? String(item[firstFile.key] ?? "") : "";
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-3 sm:gap-4 bg-surface border border-border rounded-lg px-4 py-3 hover:border-muted transition-colors animate-fadeIn"
                      style={{ animationDelay: `${Math.min(i * 0.02, 0.2)}s` }}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isLowStock(item, currentTable) ? "bg-danger" : "bg-accent"}`} />
                      {firstFile && <ImagePreview url={fileUrl} size="sm" />}
                      <span className="text-muted text-[10px] font-mono w-8 flex-shrink-0">#{id}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-fg text-sm truncate">{name}</span>
                          {useWorkflow && state ? (
                            <span className="flex-shrink-0">
                              <StatusBadge state={state} table={currentTable} />
                            </span>
                          ) : isLowStock(item, currentTable) ? (
                            <span className="text-[9px] font-semibold text-danger bg-low-bg border border-low-border rounded px-1.5 py-0.5 flex-shrink-0">LOW</span>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted mt-0.5 flex-wrap">
                          {currentTable.fields.filter((f) => f.key !== "name").slice(0, 3).map((f) => (
                            <span key={f.key} className="truncate">
                              {item[f.key] !== undefined ? `${f.label}: ${item[f.key]}` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1.5 flex-shrink-0 items-center">
                        {useWorkflow && (
                          <Can action="edit">
                            <StatusDropdown
                              item={item}
                              table={currentTable}
                              onUpdated={(next) => {
                                setItems((prev) =>
                                  prev.map((it) => (Number(it.id) === id ? next : it)),
                                );
                              }}
                            />
                          </Can>
                        )}
                        <Can action="edit">
                          <button onClick={() => setEditItem(item)} className="border border-border text-muted hover:text-fg hover:border-muted rounded-md px-2.5 py-1 text-xs transition-colors">
                            Edit
                          </button>
                        </Can>
                        <Can action="delete">
                          <button onClick={() => del(id)} disabled={deleting === id} className="border border-border text-muted hover:text-danger hover:border-danger rounded-md px-2.5 py-1 text-xs transition-colors flex items-center gap-1">
                            {deleting === id ? <><Spin s={9} /></> : "Delete"}
                          </button>
                        </Can>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {editItem && (
        <EditModal
          item={editItem}
          table={currentTable}
          onSave={save}
          onClose={() => setEditItem(null)}
        />
      )}

      <button
        onClick={() => setShowChat((prev) => !prev)}
        className={`fixed bottom-5 right-5 w-11 h-11 rounded-full border text-xs font-semibold transition-all z-50 flex items-center justify-center shadow-lg hover:scale-105 ${showChat ? "bg-surface border-border text-muted" : "bg-accent hover:bg-accent-hover border-accent text-bg"}`}
      >
        {showChat ? "\u00D7" : "AI"}
      </button>

      {showChat && (
        <Chat
          items={items}
          table={currentTable}
          onItemsChange={setItems}
          onClose={() => setShowChat(false)}
          role={currentRole}
        />
      )}
    </div>
  );
}
