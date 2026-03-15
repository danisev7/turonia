"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Check, X, Eye, EyeOff } from "lucide-react";

/* ── Types ── */
interface SimpleItem {
  id: string;
  name: string;
  sort_order: number;
  is_active: boolean;
}

interface ModelMesuraItem {
  id: string;
  model: string;
  tipus: string;
  mesura: string;
  sort_order: number;
  is_active: boolean;
}

/* ── API helpers ── */
async function fetchTable(table: string) {
  const res = await fetch(`/api/pi/config/${table}`);
  if (!res.ok) throw new Error("Error carregant dades");
  return res.json();
}

async function createItem(table: string, body: Record<string, any>) {
  const res = await fetch(`/api/pi/config/${table}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error creant element");
  }
  return res.json();
}

async function updateItem(
  table: string,
  id: string,
  body: Record<string, any>
) {
  const res = await fetch(`/api/pi/config/${table}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error actualitzant element");
  }
  return res.json();
}

async function deleteItem(table: string, id: string) {
  const res = await fetch(`/api/pi/config/${table}/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error eliminant element");
  }
}

/* ══════════════════════════════════════════════════
   SimpleListManager — CRUD for name+sort_order tables
   ══════════════════════════════════════════════════ */
function SimpleListManager({
  tableName,
  label,
}: {
  tableName: string;
  label: string;
}) {
  const [items, setItems] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTable(tableName);
      setItems(data);
    } catch {
      setError("Error carregant dades");
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = showInactive
    ? items
    : items.filter((i) => i.is_active);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setError(null);
    try {
      const maxOrder = items.reduce(
        (max, i) => Math.max(max, i.sort_order),
        0
      );
      await createItem(tableName, {
        name: newName.trim(),
        sort_order: maxOrder + 1,
      });
      setNewName("");
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    setError(null);
    try {
      await updateItem(tableName, editingId, { name: editName.trim() });
      setEditingId(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleToggleActive = async (item: SimpleItem) => {
    setError(null);
    try {
      await updateItem(tableName, item.id, { is_active: !item.is_active });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await deleteItem(tableName, id);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {filtered.length} elements
          {!showInactive &&
            items.filter((i) => !i.is_active).length > 0 &&
            ` (${items.filter((i) => !i.is_active).length} inactius)`}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? (
            <EyeOff className="h-4 w-4 mr-1" />
          ) : (
            <Eye className="h-4 w-4 mr-1" />
          )}
          {showInactive ? "Amagar inactius" : "Mostrar inactius"}
        </Button>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Add new */}
      <div className="flex gap-2">
        <Input
          placeholder={`Nou ${label.toLowerCase()}...`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="max-w-sm"
        />
        <Button size="sm" onClick={handleAdd} disabled={!newName.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Afegir
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead className="w-24">Estat</TableHead>
            <TableHead className="w-24">Accions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => (
            <TableRow
              key={item.id}
              className={!item.is_active ? "opacity-50" : ""}
            >
              <TableCell className="text-muted-foreground text-xs">
                {item.sort_order}
              </TableCell>
              <TableCell>
                {editingId === item.id ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8 max-w-xs"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleSaveEdit}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  item.name
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={item.is_active ? "default" : "secondary"}
                  className="cursor-pointer text-xs"
                  onClick={() => handleToggleActive(item)}
                >
                  {item.is_active ? "Actiu" : "Inactiu"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditName(item.name);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!item.is_active && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center text-muted-foreground py-8"
              >
                No hi ha elements.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ModelMesuresManager — CRUD for model+tipus+mesura
   ══════════════════════════════════════════════════ */
function ModelMesuresManager() {
  const [items, setItems] = useState<ModelMesuraItem[]>([]);
  const [models, setModels] = useState<SimpleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModel, setFilterModel] = useState<string>("__all__");
  const [filterTipus, setFilterTipus] = useState<string>("__all__");
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New item form
  const [newModel, setNewModel] = useState("");
  const [newTipus, setNewTipus] = useState("Universal");
  const [newMesura, setNewMesura] = useState("");

  // Edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editModel, setEditModel] = useState("");
  const [editTipus, setEditTipus] = useState("");
  const [editMesura, setEditMesura] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mesures, modelsList] = await Promise.all([
        fetchTable("model-mesures"),
        fetchTable("models"),
      ]);
      setItems(mesures);
      setModels(modelsList.filter((m: SimpleItem) => m.is_active));
    } catch {
      setError("Error carregant dades");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((i) => {
    if (!showInactive && !i.is_active) return false;
    if (filterModel !== "__all__" && i.model !== filterModel) return false;
    if (filterTipus !== "__all__" && i.tipus !== filterTipus) return false;
    return true;
  });

  const uniqueModels = [...new Set(items.map((i) => i.model))].sort();

  const handleAdd = async () => {
    if (!newModel || !newMesura.trim()) return;
    setError(null);
    try {
      const maxOrder = items.reduce(
        (max, i) => Math.max(max, i.sort_order),
        0
      );
      await createItem("model-mesures", {
        model: newModel,
        tipus: newTipus,
        mesura: newMesura.trim(),
        sort_order: maxOrder + 1,
      });
      setNewMesura("");
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editModel || !editMesura.trim()) return;
    setError(null);
    try {
      await updateItem("model-mesures", editingId, {
        model: editModel,
        tipus: editTipus,
        mesura: editMesura.trim(),
      });
      setEditingId(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleToggleActive = async (item: ModelMesuraItem) => {
    try {
      await updateItem("model-mesures", item.id, {
        is_active: !item.is_active,
      });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Model:</span>
          <Select value={filterModel} onValueChange={setFilterModel}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tots</SelectItem>
              {uniqueModels.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Tipus:</span>
          <Select value={filterTipus} onValueChange={setFilterTipus}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tots</SelectItem>
              <SelectItem value="Universal">Universal</SelectItem>
              <SelectItem value="Addicional">Addicional</SelectItem>
              <SelectItem value="Intensiu">Intensiu</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? (
            <EyeOff className="h-4 w-4 mr-1" />
          ) : (
            <Eye className="h-4 w-4 mr-1" />
          )}
          {showInactive ? "Amagar inactius" : "Mostrar inactius"}
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} elements
        </span>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Add new */}
      <div className="flex flex-wrap gap-2 items-end">
        <Select value={newModel} onValueChange={setNewModel}>
          <SelectTrigger className="w-40 h-8">
            <SelectValue placeholder="Model..." />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.id} value={m.name}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={newTipus} onValueChange={setNewTipus}>
          <SelectTrigger className="w-36 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Universal">Universal</SelectItem>
            <SelectItem value="Addicional">Addicional</SelectItem>
            <SelectItem value="Intensiu">Intensiu</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Text de la mesura..."
          value={newMesura}
          onChange={(e) => setNewMesura(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 min-w-[200px] h-8"
        />
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!newModel || !newMesura.trim()}
        >
          <Plus className="h-4 w-4 mr-1" />
          Afegir
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">Model</TableHead>
            <TableHead className="w-28">Tipus</TableHead>
            <TableHead>Mesura</TableHead>
            <TableHead className="w-20">Estat</TableHead>
            <TableHead className="w-20">Accions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((item) => (
            <TableRow
              key={item.id}
              className={!item.is_active ? "opacity-50" : ""}
            >
              <TableCell className="text-sm">
                {editingId === item.id ? (
                  <Select value={editModel} onValueChange={setEditModel}>
                    <SelectTrigger className="w-36 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  item.model
                )}
              </TableCell>
              <TableCell>
                {editingId === item.id ? (
                  <Select value={editTipus} onValueChange={setEditTipus}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Universal">Universal</SelectItem>
                      <SelectItem value="Addicional">Addicional</SelectItem>
                      <SelectItem value="Intensiu">Intensiu</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {item.tipus}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {editingId === item.id ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      value={editMesura}
                      onChange={(e) => setEditMesura(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit();
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleSaveEdit}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : (
                  item.mesura
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={item.is_active ? "default" : "secondary"}
                  className="cursor-pointer text-xs"
                  onClick={() => handleToggleActive(item)}
                >
                  {item.is_active ? "Actiu" : "Inactiu"}
                </Badge>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => {
                    setEditingId(item.id);
                    setEditModel(item.model);
                    setEditTipus(item.tipus);
                    setEditMesura(item.mesura);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-8"
              >
                No hi ha elements amb els filtres seleccionats.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   EditableDataManager — CRUD for curriculum/transversals/sabers
   ══════════════════════════════════════════════════ */
interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  editable?: boolean;
  editType?: "input" | "select";
  selectOptions?: string[];
  required?: boolean;
}

function EditableDataManager({
  tableName,
  columns,
}: {
  tableName: string;
  columns: ColumnDef[];
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStage, setFilterStage] = useState("__all__");
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const PAGE_SIZE = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchTable(tableName);
      setData(items);
    } catch {
      setError("Error carregant dades");
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    load();
  }, [load]);

  const editableColumns = columns.filter((c) => c.editable);

  const filtered = data.filter((row) => {
    if (!showInactive && row.is_active === false) return false;
    if (filterStage !== "__all__" && row.stage !== filterStage) return false;
    if (search) {
      const s = search.toLowerCase();
      return columns.some((col) =>
        String(row[col.key] || "")
          .toLowerCase()
          .includes(s)
      );
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageData = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [search, filterStage, showInactive]);

  const stages = [...new Set(data.map((r) => r.stage))].sort();

  const handleToggleActive = async (row: any) => {
    setError(null);
    try {
      await updateItem(tableName, row.id, { is_active: !row.is_active });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (row: any) => {
    const label = row.short_text || row.espec_short || row.code || row.id;
    if (!confirm(`Eliminar "${label}"? Aquesta acció és permanent.`)) return;
    setError(null);
    try {
      await deleteItem(tableName, row.id);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const startEdit = (row: any) => {
    setEditingId(row.id);
    const vals: Record<string, string> = {};
    for (const col of editableColumns) {
      vals[col.key] = String(row[col.key] ?? "");
    }
    setEditValues(vals);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setError(null);
    try {
      await updateItem(tableName, editingId, editValues);
      setEditingId(null);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleAdd = async () => {
    setError(null);
    const requiredCols = editableColumns.filter((c) => c.required);
    const missing = requiredCols.find((c) => !newValues[c.key]?.trim());
    if (missing) {
      setError(`El camp "${missing.label}" és obligatori`);
      return;
    }
    try {
      const maxOrder = data.reduce(
        (max, i) => Math.max(max, i.sort_order || 0),
        0
      );
      await createItem(tableName, { ...newValues, sort_order: maxOrder + 1 });
      setNewValues({});
      setShowAddForm(false);
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const renderEditCell = (col: ColumnDef, values: Record<string, string>, setValues: (v: Record<string, string>) => void) => {
    if (col.editType === "select" && col.selectOptions) {
      return (
        <Select
          value={values[col.key] || ""}
          onValueChange={(v) => setValues({ ...values, [col.key]: v })}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder={col.label} />
          </SelectTrigger>
          <SelectContent>
            {col.selectOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        value={values[col.key] || ""}
        onChange={(e) => setValues({ ...values, [col.key]: e.target.value })}
        className="h-7 text-xs"
        placeholder={col.label}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input
          placeholder="Cercar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs h-8"
        />
        {stages.length > 1 && (
          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tots</SelectItem>
              {stages.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowInactive(!showInactive)}
        >
          {showInactive ? (
            <EyeOff className="h-4 w-4 mr-1" />
          ) : (
            <Eye className="h-4 w-4 mr-1" />
          )}
          {showInactive ? "Amagar inactius" : "Mostrar inactius"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setShowAddForm(!showAddForm);
            if (!showAddForm) setNewValues({});
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Afegir
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} registres
          {!showInactive &&
            data.filter((i) => !i.is_active).length > 0 &&
            ` (${data.filter((i) => !i.is_active).length} inactius)`}
        </span>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <p className="text-sm font-medium">Nou registre</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {editableColumns.map((col) => (
              <div key={col.key}>
                <label className="text-xs text-muted-foreground">
                  {col.label}{col.required ? " *" : ""}
                </label>
                {renderEditCell(col, newValues, setNewValues)}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>
              <Check className="h-3.5 w-3.5 mr-1" />
              Crear
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAddForm(false);
                setNewValues({});
              }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel·lar
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} style={{ width: col.width }}>
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="w-20">Estat</TableHead>
              <TableHead className="w-24">Accions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.map((row) => (
              <TableRow
                key={row.id}
                className={row.is_active === false ? "opacity-50" : ""}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className="text-xs">
                    {editingId === row.id && col.editable ? (
                      renderEditCell(col, editValues, setEditValues)
                    ) : (
                      String(row[col.key] ?? "-")
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <Badge
                    variant={row.is_active !== false ? "default" : "secondary"}
                    className="cursor-pointer text-xs"
                    onClick={() => handleToggleActive(row)}
                  >
                    {row.is_active !== false ? "Actiu" : "Inactiu"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {editingId === row.id ? (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleSaveEdit}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => startEdit(row)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(row)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {pageData.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 2}
                  className="text-center text-muted-foreground py-8"
                >
                  No hi ha registres.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            {page + 1} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            Següent
          </Button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════ */
export default function ConfigPiPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuració PI</h1>
        <p className="text-sm text-muted-foreground">
          Gestió de les taules de configuració de la Plantilla PI.
        </p>
      </div>

      <Tabs defaultValue="materies">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="materies" className="text-xs">
            Matèries
          </TabsTrigger>
          <TabsTrigger value="professionals" className="text-xs">
            Professionals
          </TabsTrigger>
          <TabsTrigger value="models" className="text-xs">
            Models PI
          </TabsTrigger>
          <TabsTrigger value="instruments" className="text-xs">
            Instruments
          </TabsTrigger>
          <TabsTrigger value="model-mesures" className="text-xs">
            Model-Mesures
          </TabsTrigger>
          <TabsTrigger value="curriculum" className="text-xs">
            Currículum
          </TabsTrigger>
          <TabsTrigger value="transversals" className="text-xs">
            Transversals
          </TabsTrigger>
          <TabsTrigger value="sabers" className="text-xs">
            Sabers Dig.
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materies" className="mt-4">
          <SimpleListManager tableName="materies" label="Matèria" />
        </TabsContent>

        <TabsContent value="professionals" className="mt-4">
          <SimpleListManager
            tableName="professionals"
            label="Professional"
          />
        </TabsContent>

        <TabsContent value="models" className="mt-4">
          <SimpleListManager tableName="models" label="Model PI" />
        </TabsContent>

        <TabsContent value="instruments" className="mt-4">
          <SimpleListManager
            tableName="instruments"
            label="Instrument"
          />
        </TabsContent>

        <TabsContent value="model-mesures" className="mt-4">
          <ModelMesuresManager />
        </TabsContent>

        <TabsContent value="curriculum" className="mt-4">
          <EditableDataManager
            tableName="curriculum"
            columns={[
              { key: "stage", label: "Etapa", width: "60px", editable: true, editType: "select", selectOptions: ["ESO", "PRI"], required: true },
              { key: "subject", label: "Matèria", width: "140px", editable: true, editType: "input", required: true },
              { key: "level", label: "Nivell", width: "70px", editable: true, editType: "input", required: true },
              { key: "entry_type", label: "Tipus", width: "100px", editable: true, editType: "select", selectOptions: ["COMP_ESPEC", "CRIT", "SABER"], required: true },
              { key: "code", label: "Codi", width: "80px", editable: true, editType: "input", required: true },
              { key: "short_text", label: "Text curt", editable: true, editType: "input" },
              { key: "full_text", label: "Text complet", editable: true, editType: "input", required: true },
              { key: "parent_code", label: "Codi pare", width: "80px", editable: true, editType: "input" },
            ]}
          />
        </TabsContent>

        <TabsContent value="transversals" className="mt-4">
          <EditableDataManager
            tableName="transversals"
            columns={[
              { key: "stage", label: "Etapa", width: "60px", editable: true, editType: "select", selectOptions: ["ESO", "PRI"], required: true },
              { key: "area", label: "Àrea", width: "140px", editable: true, editType: "input", required: true },
              { key: "group_name", label: "Grup", width: "80px", editable: true, editType: "input", required: true },
              { key: "espec_short", label: "Específica (curt)", editable: true, editType: "input", required: true },
              { key: "espec_full", label: "Específica (complet)", editable: true, editType: "input", required: true },
              { key: "crit_short", label: "Criteri (curt)", editable: true, editType: "input" },
              { key: "crit_full", label: "Criteri (complet)", editable: true, editType: "input" },
            ]}
          />
        </TabsContent>

        <TabsContent value="sabers" className="mt-4">
          <EditableDataManager
            tableName="sabers-dig"
            columns={[
              { key: "stage", label: "Etapa", width: "60px", editable: true, editType: "select", selectOptions: ["ESO", "PRI"], required: true },
              { key: "group_name", label: "Grup", width: "80px", editable: true, editType: "input" },
              { key: "short_text", label: "Text curt", editable: true, editType: "input", required: true },
              { key: "full_text", label: "Text complet", editable: true, editType: "input", required: true },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
