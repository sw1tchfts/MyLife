"use client";

import { Suspense } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  type Viewport,
  MarkerType,
  Panel,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { nodeTypes } from "@/components/diagrams/DiagramNodes";

/* ── Types ─────────────────────────────────────────────── */

type DiagramType = "FLOWCHART" | "PROCESS" | "SWIMLANE" | "ER_DIAGRAM";

interface DiagramRecord {
  id: string;
  title: string;
  type: DiagramType;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  createdAt: string;
  updatedAt: string;
}

const DIAGRAM_LABELS: Record<DiagramType, string> = {
  FLOWCHART: "Flowchart",
  PROCESS: "Process Diagram",
  SWIMLANE: "Swim Lane",
  ER_DIAGRAM: "ER Diagram",
};

/* Palette: what nodes each diagram type offers */
interface PaletteItem {
  nodeType: string;
  label: string;
  desc: string;
}
const PALETTES: Record<DiagramType, PaletteItem[]> = {
  FLOWCHART: [
    { nodeType: "terminal", label: "Start / End", desc: "Rounded terminal" },
    { nodeType: "process", label: "Process", desc: "Action step" },
    { nodeType: "decision", label: "Decision", desc: "Yes/No branch" },
    { nodeType: "data", label: "Data", desc: "Input / Output" },
    { nodeType: "stickyNote", label: "Note", desc: "Sticky note" },
  ],
  PROCESS: [
    { nodeType: "terminal", label: "Start / End", desc: "Rounded terminal" },
    { nodeType: "process", label: "Step", desc: "Process step" },
    { nodeType: "decision", label: "Gateway", desc: "Decision gateway" },
    { nodeType: "data", label: "Document", desc: "Data / document" },
    { nodeType: "stickyNote", label: "Note", desc: "Sticky note" },
  ],
  SWIMLANE: [
    { nodeType: "swimLane", label: "Lane", desc: "Swim lane container" },
    { nodeType: "process", label: "Task", desc: "Process step" },
    { nodeType: "decision", label: "Gateway", desc: "Decision point" },
    { nodeType: "terminal", label: "Start / End", desc: "Terminal" },
    { nodeType: "stickyNote", label: "Note", desc: "Sticky note" },
  ],
  ER_DIAGRAM: [
    { nodeType: "entity", label: "Entity", desc: "Database entity" },
    { nodeType: "process", label: "Relationship", desc: "Relationship box" },
    { nodeType: "stickyNote", label: "Note", desc: "Sticky note" },
  ],
};

/* ── Inner component (needs useSearchParams) ───────────── */

function DiagramsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

  /* List state */
  const [diagrams, setDiagrams] = useState<DiagramRecord[]>([]);
  const [loading, setLoading] = useState(true);

  /* Editor state */
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [diagramTitle, setDiagramTitle] = useState("Untitled Diagram");
  const [diagramType, setDiagramType] = useState<DiagramType>("FLOWCHART");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const reactFlowRef = useRef<HTMLDivElement>(null);

  /* ── Fetch list ──────────────────────────────────────── */
  const fetchDiagrams = useCallback(() => {
    setLoading(true);
    fetch("/api/diagrams")
      .then((r) => r.json())
      .then((data) => setDiagrams(data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDiagrams();
  }, [fetchDiagrams]);

  /* ── Load diagram for editing ────────────────────────── */
  useEffect(() => {
    if (!editId) return;
    fetch(`/api/diagrams/${editId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d: DiagramRecord) => {
        setDiagramTitle(d.title);
        setDiagramType(d.type);
        setViewport(d.viewport ?? { x: 0, y: 0, zoom: 1 });
        /* Restore onLabelChange callbacks */
        setNodes(
          (d.nodes ?? []).map((n: Node) => ({
            ...n,
            data: {
              ...n.data,
              onLabelChange: (v: string) => handleLabelChange(n.id, v),
            },
          })),
        );
        setEdges(d.edges ?? []);
      })
      .catch(() => router.push("/diagrams"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  /* ── Node label change ───────────────────────────────── */
  const handleLabelChange = useCallback(
    (nodeId: string, label: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, label } } : n,
        ),
      );
    },
    [setNodes],
  );

  /* ── Connect edges ───────────────────────────────────── */
  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "smoothstep",
            animated: false,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2 },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  /* ── Add node from palette ───────────────────────────── */
  const addNode = useCallback(
    (nodeType: string, label: string) => {
      const id = `node_${Date.now()}`;
      const newNode: Node = {
        id,
        type: nodeType,
        position: {
          x: 250 + Math.random() * 200,
          y: 150 + Math.random() * 200,
        },
        data: { label, onLabelChange: (v: string) => handleLabelChange(id, v) },
      };
      if (nodeType === "swimLane") {
        newNode.style = { zIndex: -1 };
        newNode.draggable = true;
      }
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, handleLabelChange],
  );

  /* ── Delete selected ─────────────────────────────────── */
  const deleteSelected = useCallback(() => {
    setNodes((nds) => nds.filter((n) => !n.selected));
    setEdges((eds) => eds.filter((e) => !e.selected));
  }, [setNodes, setEdges]);

  /* ── Save diagram ────────────────────────────────────── */
  const saveDiagram = useCallback(async () => {
    setSaving(true);
    setSaveMsg("");

    /* Strip callbacks from data before saving */
    const cleanNodes = nodes.map((n) => {
      const { onLabelChange, ...rest } = n.data as Record<string, unknown>;
      void onLabelChange;
      return { ...n, data: rest };
    });

    const payload = {
      title: diagramTitle,
      type: diagramType,
      nodes: cleanNodes,
      edges,
      viewport,
    };

    try {
      if (editId) {
        const res = await fetch(`/api/diagrams/${editId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Save failed");
        setSaveMsg("Saved!");
      } else {
        const res = await fetch("/api/diagrams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Save failed");
        const created: DiagramRecord = await res.json();
        setSaveMsg("Created!");
        router.push(`/diagrams?edit=${created.id}`);
      }
      fetchDiagrams();
    } catch {
      setSaveMsg("Error saving");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2000);
    }
  }, [
    nodes,
    edges,
    viewport,
    diagramTitle,
    diagramType,
    editId,
    router,
    fetchDiagrams,
  ]);

  /* ── New diagram ─────────────────────────────────────── */
  const newDiagram = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setDiagramTitle("Untitled Diagram");
    setDiagramType("FLOWCHART");
    setViewport({ x: 0, y: 0, zoom: 1 });
    router.push("/diagrams");
  }, [setNodes, setEdges, router]);

  /* ── Delete diagram ──────────────────────────────────── */
  const deleteDiagram = useCallback(
    async (id: string) => {
      if (!confirm("Delete this diagram?")) return;
      await fetch(`/api/diagrams/${id}`, { method: "DELETE" });
      if (editId === id) newDiagram();
      fetchDiagrams();
    },
    [editId, newDiagram, fetchDiagrams],
  );

  /* ── Current palette ─────────────────────────────────── */
  const palette = useMemo(() => PALETTES[diagramType], [diagramType]);

  /* ── Keyboard shortcut for delete ────────────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)
      ) {
        deleteSelected();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteSelected]);

  /* ── Render ──────────────────────────────────────────── */
  return (
    <div className="flex h-full flex-col">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900">
        <button
          onClick={() => router.push("/diagrams")}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          &larr; All Diagrams
        </button>
        <div className="h-5 w-px bg-gray-300 dark:bg-gray-600" />
        <input
          value={diagramTitle}
          onChange={(e) => setDiagramTitle(e.target.value)}
          className="flex-1 border-none bg-transparent text-base font-semibold outline-none dark:text-gray-100"
          placeholder="Diagram title..."
        />
        <select
          value={diagramType}
          onChange={(e) => setDiagramType(e.target.value as DiagramType)}
          className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          {(Object.keys(DIAGRAM_LABELS) as DiagramType[]).map((t) => (
            <option key={t} value={t}>
              {DIAGRAM_LABELS[t]}
            </option>
          ))}
        </select>
        <button
          onClick={saveDiagram}
          disabled={saving}
          className="rounded bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saveMsg && (
          <span className="text-sm text-green-600 dark:text-green-400">
            {saveMsg}
          </span>
        )}
        <button
          onClick={newDiagram}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          + New
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar — diagram list + palette */}
        <div className="flex w-56 shrink-0 flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
          {/* Node palette */}
          <div className="border-b border-gray-200 p-3 dark:border-gray-700">
            <p className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Add Shapes
            </p>
            <div className="flex flex-col gap-1">
              {palette.map((item) => (
                <button
                  key={item.nodeType}
                  onClick={() => addNode(item.nodeType, item.label)}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ShapeIcon type={item.nodeType} />
                  <div>
                    <div className="text-xs font-medium">{item.label}</div>
                    <div className="text-[10px] text-gray-400">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Saved diagrams list */}
          <div className="flex-1 overflow-y-auto p-3">
            <p className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">
              Saved Diagrams
            </p>
            {loading ? (
              <p className="text-xs text-gray-400">Loading...</p>
            ) : diagrams.length === 0 ? (
              <p className="text-xs text-gray-400">No diagrams yet</p>
            ) : (
              <div className="flex flex-col gap-1">
                {diagrams.map((d) => (
                  <div
                    key={d.id}
                    className={`group flex items-center justify-between rounded px-2 py-1.5 text-sm transition-colors ${
                      editId === d.id
                        ? "bg-blue-50 font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    <button
                      className="flex-1 truncate text-left"
                      onClick={() => router.push(`/diagrams?edit=${d.id}`)}
                    >
                      <div className="truncate text-xs font-medium">
                        {d.title}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {DIAGRAM_LABELS[d.type]}
                      </div>
                    </button>
                    <button
                      onClick={() => deleteDiagram(d.id)}
                      className="ml-1 hidden rounded p-0.5 text-gray-400 hover:text-red-500 group-hover:block"
                      title="Delete"
                    >
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1" ref={reactFlowRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onViewportChange={setViewport}
            defaultViewport={viewport}
            nodeTypes={nodeTypes}
            fitView
            snapToGrid
            snapGrid={[15, 15]}
            deleteKeyCode={null}
            className="bg-gray-100 dark:bg-gray-950"
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={15}
              size={1}
              className="dark:!bg-gray-950"
            />
            <Controls className="!rounded !border !border-gray-300 !bg-white !shadow-sm dark:!border-gray-600 dark:!bg-gray-800 [&>button]:!border-gray-300 [&>button]:!bg-white dark:[&>button]:!border-gray-600 dark:[&>button]:!bg-gray-800 [&>button>svg]:dark:!fill-gray-200" />
            <MiniMap
              className="!rounded !border !border-gray-300 !bg-white !shadow-sm dark:!border-gray-600 dark:!bg-gray-800"
              maskColor="rgba(0,0,0,0.1)"
              nodeColor="#93C5FD"
            />
            <Panel position="top-right">
              <button
                onClick={deleteSelected}
                className="rounded border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 shadow-sm hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400"
              >
                Delete Selected
              </button>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

/* ── Page wrapper with Suspense ────────────────────────── */

export default function DiagramsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center text-gray-400">
          Loading diagrams...
        </div>
      }
    >
      <DiagramsInner />
    </Suspense>
  );
}

/* ── Small shape icons for palette ─────────────────────── */

function ShapeIcon({ type }: { type: string }) {
  const cls = "h-5 w-5 text-gray-400";
  switch (type) {
    case "process":
      return (
        <svg
          className={cls}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect x="2" y="4" width="16" height="12" rx="2" />
        </svg>
      );
    case "decision":
      return (
        <svg
          className={cls}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M10 2 L18 10 L10 18 L2 10 Z" />
        </svg>
      );
    case "terminal":
      return (
        <svg
          className={cls}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect x="2" y="5" width="16" height="10" rx="5" />
        </svg>
      );
    case "data":
      return (
        <svg
          className={cls}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path d="M5 4 L18 4 L15 16 L2 16 Z" />
        </svg>
      );
    case "stickyNote":
      return (
        <svg
          className={cls}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect
            x="3"
            y="3"
            width="14"
            height="14"
            rx="1"
            fill="#FEF3C7"
            stroke="#F59E0B"
          />
          <path d="M6 8h8M6 11h5" stroke="#F59E0B" />
        </svg>
      );
    case "entity":
      return (
        <svg
          className={cls}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect x="2" y="3" width="16" height="14" rx="2" />
          <line x1="2" y1="8" x2="18" y2="8" />
        </svg>
      );
    case "swimLane":
      return (
        <svg
          className={cls}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <rect
            x="2"
            y="2"
            width="16"
            height="16"
            rx="2"
            strokeDasharray="3 2"
          />
          <line x1="2" y1="6" x2="18" y2="6" />
        </svg>
      );
    default:
      return <div className="h-5 w-5" />;
  }
}
