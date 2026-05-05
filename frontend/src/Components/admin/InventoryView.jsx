// ── ADD THIS COMPONENT inside AdminDashboard.jsx ────────────────────────────
// Place it before the PlaceholderView component and wire it in renderView()

// In renderView(), replace:
//   case "Inventory": return <PlaceholderView title="Inventory" />;
// With:
//   case "Inventory": return <InventoryView />;

import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders } from "../../utils/api";

const API = "http://localhost:3000";

const apiFetch = async (url, opts = {}) => {
  const res = await fetch(`${API}${url}`, {
    headers: { "Content-Type": "application/json", ...getAuthHeaders(), ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

const CATEGORIES = ["All", "Plumbing", "Electrical", "Carpentry", "Cleaning", "Security", "General"];

export function InventoryView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [modal, setModal] = useState(null); // "add" | "edit" | "restock"
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category !== "All") params.append("category", category);
      const data = await apiFetch(`/inventory?${params}`);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      if (modal === "add") {
        await apiFetch("/inventory", { method: "POST", body: JSON.stringify(form) });
      } else if (modal === "edit") {
        await apiFetch(`/inventory/${form._id}`, { method: "PUT", body: JSON.stringify(form) });
      } else if (modal === "restock") {
        await apiFetch("/inventory/restock", { method: "POST", body: JSON.stringify({ itemId: form._id, addQty: form.addQty }) });
      }
      setModal(null);
      fetchItems();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      await apiFetch(`/inventory/${id}`, { method: "DELETE" });
      fetchItems();
    } catch (err) {
      alert(err.message);
    }
  };

  const f = (key) => ({ value: form[key] ?? "", onChange: (e) => setForm((p) => ({ ...p, [key]: e.target.value })) });

  const isLow = (item) => item.quantity < item.minimum;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 flex-wrap">
        {/* Search bar */}
        <div className="flex items-center bg-slate-100 rounded-xl px-3 py-2 gap-2 flex-1 min-w-[200px]">
          <span className="text-gray-400 text-sm"></span>
          <input
            className="bg-transparent text-sm text-gray-600 outline-none w-full placeholder-gray-400"
            placeholder="Search materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Category filter */}
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${category === c ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {c}
            </button>
          ))}
        </div>
        {/* Add button */}
        <button
          onClick={() => { setModal("add"); setForm({ category: "General", unit: "pcs", quantity: 0, minimum: 5 }); setMsg(""); }}
          className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap"
        >
          + Add Item
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-lg"></div>
          <div>
            <p className="text-xs text-gray-400">Total Items</p>
            <p className="text-xl font-black text-gray-800">{items.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-lg"></div>
          <div>
            <p className="text-xs text-gray-400">Low Stock</p>
            <p className="text-xl font-black text-red-600">{items.filter(isLow).length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg"></div>
          <div>
            <p className="text-xs text-gray-400">Well Stocked</p>
            <p className="text-xl font-black text-green-600">{items.filter((i) => !isLow(i)).length}</p>
          </div>
        </div>
      </div>

      {/* Inventory table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Item", "Category", "Unit", "Available", "Minimum", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className={`border-b border-gray-50 transition-colors ${isLow(item) ? "bg-red-50 hover:bg-red-100" : "hover:bg-gray-50"}`}>
                  <td className="px-4 py-3 font-semibold text-gray-700">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">{item.category}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                  <td className="px-4 py-3">
                    <span className={`font-black text-base ${isLow(item) ? "text-red-600" : "text-gray-800"}`}>{item.quantity}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.minimum}</td>
                  <td className="px-4 py-3">
                    {isLow(item) ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500 text-white font-semibold">Low Stock</span>
                    ) : (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">OK</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setModal("restock"); setForm({ ...item, addQty: "" }); setMsg(""); }}
                        className="bg-teal-50 text-teal-600 border border-teal-200 px-2 py-1 rounded-lg text-[11px] font-semibold hover:bg-teal-100 transition-colors"
                      >
                        Restock
                      </button>
                      <button
                        onClick={() => { setModal("edit"); setForm({ ...item }); setMsg(""); }}
                        className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-[11px] font-semibold hover:bg-gray-200 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="bg-red-50 text-red-500 border border-red-200 px-2 py-1 rounded-lg text-[11px] font-semibold hover:bg-red-100 transition-colors"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">
                    No items found. Run <code className="bg-gray-100 px-1 rounded">seedInventory()</code> or add items manually.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-base font-bold text-gray-800">{modal === "add" ? "Add New Item" : "Edit Item"}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">X</button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {msg && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{msg}</p>}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Item Name</label>
                <input className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="e.g. LED Bulb 9W" {...f("name")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Category</label>
                  <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" {...f("category")}>
                    {CATEGORIES.filter((c) => c !== "All").map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Unit</label>
                  <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" {...f("unit")}>
                    {["pcs", "kg", "m", "L", "rolls"].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Quantity</label>
                  <input type="number" className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="0" {...f("quantity")} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-600">Min Threshold</label>
                  <input type="number" className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="5" {...f("minimum")} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-sm bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-40">
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {modal === "restock" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-base font-bold text-gray-800">Restock: {form.name}</h3>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">X</button>
            </div>
            <div className="px-6 py-5 space-y-3">
              {msg && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{msg}</p>}
              <p className="text-sm text-gray-500">Current stock: <strong>{form.quantity} {form.unit}</strong></p>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-600">Add Quantity</label>
                <input
                  type="number"
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  placeholder="e.g. 10"
                  value={form.addQty || ""}
                  onChange={(e) => setForm((p) => ({ ...p, addQty: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setModal(null)} className="px-4 py-2 rounded-xl text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold">Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.addQty} className="px-4 py-2 rounded-xl text-sm bg-teal-500 text-white hover:bg-teal-600 font-semibold disabled:opacity-40">
                  {saving ? "Saving..." : `+ Add ${form.addQty || ""} ${form.unit}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}