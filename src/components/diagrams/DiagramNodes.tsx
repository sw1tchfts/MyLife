"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

/* ── Shared inline-edit logic ──────────────────────────── */

function useInlineEdit(initial: string, onCommit: (v: string) => void) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initial);

  const startEdit = useCallback(() => {
    setDraft(initial);
    setEditing(true);
  }, [initial]);

  const commit = useCallback(() => {
    setEditing(false);
    onCommit(draft);
  }, [draft, onCommit]);

  const cancel = useCallback(() => {
    setEditing(false);
    setDraft(initial);
  }, [initial]);

  return { editing, draft, setDraft, startEdit, commit, cancel };
}

interface EditableTextProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  inputClassName?: string;
  placeholder?: string;
}

function EditableText({
  value,
  onChange,
  className = "",
  inputClassName = "",
  placeholder = "Label",
}: EditableTextProps) {
  const { editing, draft, setDraft, startEdit, commit, cancel } = useInlineEdit(
    value,
    onChange,
  );

  if (editing) {
    return (
      <input
        autoFocus
        className={`border-none bg-transparent text-center outline-none focus:ring-0 ${inputClassName}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
      />
    );
  }

  return (
    <span className={`cursor-text ${className}`} onDoubleClick={startEdit}>
      {value || placeholder}
    </span>
  );
}

/* ── Handle wrapper ────────────────────────────────────── */

function AllHandles() {
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-2 !border-white !bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-2 !border-white !bg-blue-500"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!h-2 !w-2 !border-2 !border-white !bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!h-2 !w-2 !border-2 !border-white !bg-blue-500"
      />
    </>
  );
}

/* ── Process / Rectangle node ──────────────────────────── */

export const ProcessNode = memo(function ProcessNode({ data }: NodeProps) {
  const d = data as { label?: string; onLabelChange?: (v: string) => void };
  return (
    <div className="min-w-[120px] rounded-md border-2 border-blue-500 bg-white px-4 py-3 text-center text-sm shadow-sm dark:border-blue-400 dark:bg-gray-800 dark:text-gray-100">
      <AllHandles />
      <EditableText
        value={(d.label as string) ?? ""}
        onChange={(v) => d.onLabelChange?.(v)}
        placeholder="Process"
      />
    </div>
  );
});

/* ── Decision / Diamond node ───────────────────────────── */

export const DecisionNode = memo(function DecisionNode({ data }: NodeProps) {
  const d = data as { label?: string; onLabelChange?: (v: string) => void };
  return (
    <div className="flex h-[80px] w-[120px] rotate-45 items-center justify-center border-2 border-amber-500 bg-white shadow-sm dark:border-amber-400 dark:bg-gray-800">
      <AllHandles />
      <div className="-rotate-45 px-1 text-center text-xs dark:text-gray-100">
        <EditableText
          value={(d.label as string) ?? ""}
          onChange={(v) => d.onLabelChange?.(v)}
          placeholder="Decision"
        />
      </div>
    </div>
  );
});

/* ── Start / End (rounded pill) ────────────────────────── */

export const TerminalNode = memo(function TerminalNode({ data }: NodeProps) {
  const d = data as { label?: string; onLabelChange?: (v: string) => void };
  return (
    <div className="min-w-[100px] rounded-full border-2 border-green-500 bg-white px-5 py-2 text-center text-sm shadow-sm dark:border-green-400 dark:bg-gray-800 dark:text-gray-100">
      <AllHandles />
      <EditableText
        value={(d.label as string) ?? ""}
        onChange={(v) => d.onLabelChange?.(v)}
        placeholder="Start/End"
      />
    </div>
  );
});

/* ── Data / Parallelogram node ─────────────────────────── */

export const DataNode = memo(function DataNode({ data }: NodeProps) {
  const d = data as { label?: string; onLabelChange?: (v: string) => void };
  return (
    <div className="min-w-[120px] skew-x-[-10deg] border-2 border-purple-500 bg-white px-5 py-3 text-center text-sm shadow-sm dark:border-purple-400 dark:bg-gray-800 dark:text-gray-100">
      <AllHandles />
      <div className="skew-x-[10deg]">
        <EditableText
          value={(d.label as string) ?? ""}
          onChange={(v) => d.onLabelChange?.(v)}
          placeholder="Data"
        />
      </div>
    </div>
  );
});

/* ── Sticky Note ───────────────────────────────────────── */

export const StickyNoteNode = memo(function StickyNoteNode({
  data,
}: NodeProps) {
  const d = data as { label?: string; onLabelChange?: (v: string) => void };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState((d.label as string) ?? "");

  return (
    <div className="min-h-[80px] w-[180px] rounded-sm border border-yellow-300 bg-yellow-100 p-3 text-xs shadow-md dark:border-yellow-600 dark:bg-yellow-900/60 dark:text-yellow-100">
      {editing ? (
        <textarea
          autoFocus
          className="h-full w-full resize-none border-none bg-transparent text-xs outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            d.onLabelChange?.(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setEditing(false);
              setDraft((d.label as string) ?? "");
            }
          }}
          rows={4}
        />
      ) : (
        <div
          className="min-h-[60px] cursor-text whitespace-pre-wrap"
          onDoubleClick={() => {
            setDraft((d.label as string) ?? "");
            setEditing(true);
          }}
        >
          {(d.label as string) || "Double-click to add a note..."}
        </div>
      )}
    </div>
  );
});

/* ── Entity (ER diagram) ──────────────────────────────── */

export const EntityNode = memo(function EntityNode({ data }: NodeProps) {
  const d = data as {
    label?: string;
    onLabelChange?: (v: string) => void;
    attributes?: string;
  };
  return (
    <div className="min-w-[150px] overflow-hidden rounded-md border-2 border-indigo-500 bg-white shadow-sm dark:border-indigo-400 dark:bg-gray-800">
      <AllHandles />
      <div className="border-b border-indigo-300 bg-indigo-50 px-3 py-2 text-center text-sm font-semibold dark:border-indigo-600 dark:bg-indigo-900/40 dark:text-gray-100">
        <EditableText
          value={(d.label as string) ?? ""}
          onChange={(v) => d.onLabelChange?.(v)}
          placeholder="Entity"
        />
      </div>
      <div className="px-3 py-2 text-xs text-gray-600 dark:text-gray-300">
        {(d.attributes as string) || "id, name, ..."}
      </div>
    </div>
  );
});

/* ── Swim Lane Header ─────────────────────────────────── */

export const SwimLaneNode = memo(function SwimLaneNode({ data }: NodeProps) {
  const d = data as {
    label?: string;
    onLabelChange?: (v: string) => void;
    color?: string;
  };
  const color = (d.color as string) || "#3B82F6";
  return (
    <div
      className="min-h-[300px] min-w-[250px] rounded-lg border-2 border-dashed p-3 opacity-60"
      style={{ borderColor: color }}
    >
      <div
        className="mb-2 rounded px-3 py-1 text-center text-sm font-semibold text-white"
        style={{ backgroundColor: color }}
      >
        <EditableText
          value={(d.label as string) ?? ""}
          onChange={(v) => d.onLabelChange?.(v)}
          placeholder="Lane"
          className="text-white"
          inputClassName="text-white"
        />
      </div>
    </div>
  );
});

/* ── Export map ─────────────────────────────────────────── */

export const nodeTypes = {
  process: ProcessNode,
  decision: DecisionNode,
  terminal: TerminalNode,
  data: DataNode,
  stickyNote: StickyNoteNode,
  entity: EntityNode,
  swimLane: SwimLaneNode,
};
