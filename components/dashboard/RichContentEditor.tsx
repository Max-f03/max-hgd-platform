"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import ImageUploader, { type UploadImageItem } from "@/components/dashboard/ImageUploader";
import Button from "@/components/ui/Button";

export type ContentBlockType = "text" | "image" | "gallery" | "video" | "quote" | "comparison" | "code" | "embed";

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  data: {
    title?: string;
    paragraph?: string;
    image?: UploadImageItem | null;
    caption?: string;
    gallery?: UploadImageItem[];
    columns?: 2 | 3 | 4;
    videoUrl?: string;
    quoteText?: string;
    quoteAuthor?: string;
    beforeImage?: UploadImageItem | null;
    afterImage?: UploadImageItem | null;
    code?: string;
    language?: string;
    embedUrl?: string;
  };
}

interface RichContentEditorProps {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

interface BlockHistory {
  timestamp: number;
  data: ContentBlock["data"];
  description: string;
}

interface BlockHistoryState {
  [blockId: string]: {
    history: BlockHistory[];
    currentIndex: number;
  };
}

const TYPE_LABEL: Record<ContentBlockType, string> = {
  text: "Bloc Texte",
  image: "Bloc Image",
  gallery: "Bloc Galerie",
  video: "Bloc Video",
  quote: "Bloc Citation",
  comparison: "Bloc Avant/Apres",
  code: "Bloc Code",
  embed: "Bloc Embed",
};

const TYPE_ITEMS: ContentBlockType[] = ["text", "image", "gallery", "video", "quote", "comparison", "code", "embed"];
const TEXT_COLOR_PRESETS = ["#1E293B", "#1D4ED8", "#DC2626", "#059669", "#7C3AED", "#D97706"];

const TYPE_ICON: Record<ContentBlockType, React.ReactNode> = {
  text: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="14" y2="17" />
    </svg>
  ),
  image: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  gallery: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  ),
  video: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="15" height="14" rx="2" />
      <path d="M17 10l5-3v10l-5-3z" />
    </svg>
  ),
  quote: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21c3 0 7-2 7-8V5H3v8h4" />
      <path d="M14 21c3 0 7-2 7-8V5h-7v8h4" />
    </svg>
  ),
  comparison: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="10 9 7 12 10 15" />
      <polyline points="14 9 17 12 14 15" />
    </svg>
  ),
  code: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  embed: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L10 5" />
      <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L14 19" />
    </svg>
  ),
};

function createBlock(type: ContentBlockType): ContentBlock {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    data: {
      columns: 2,
      image: null,
      beforeImage: null,
      afterImage: null,
      gallery: [],
    },
  };
}

function sanitizeRichTextHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");
}

function stripBidiDirectionArtifacts(value: string): string {
  return value
    .replace(/\sdir=("[^"]*"|'[^']*')/gi, "")
    .replace(/\sstyle=("[^"]*"|'[^']*')/gi, (full, quotedStyle) => {
      const raw = String(quotedStyle).slice(1, -1);
      const cleaned = raw
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part) => !/^direction\s*:/i.test(part) && !/^unicode-bidi\s*:/i.test(part))
        .join("; ");

      if (!cleaned) return "";
      const quote = String(quotedStyle)[0] === "'" ? "'" : '"';
      return ` style=${quote}${cleaned}${quote}`;
    });
}

function updateBlock(blocks: ContentBlock[], id: string, nextData: Partial<ContentBlock["data"]>): ContentBlock[] {
  return blocks.map((block) => {
    if (block.id !== id) return block;
    return {
      ...block,
      data: { ...block.data, ...nextData },
    };
  });
}

export default function RichContentEditor({ blocks, onChange }: RichContentEditorProps) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [comparePosition, setComparePosition] = useState<Record<string, number>>({});
  const [linkEditor, setLinkEditor] = useState<Record<string, { open: boolean; url: string; label: string }>>({});
  const [colorEditor, setColorEditor] = useState<Record<string, { open: boolean; value: string }>>({});
  const [blockHistory, setBlockHistory] = useState<BlockHistoryState>({});
  const [selectedBlockForHistory, setSelectedBlockForHistory] = useState<string | null>(null);
  const savedSelectionRange = useRef<Record<string, Range | null>>({});

  const previewBlocks = useMemo(() => blocks, [blocks]);

  useEffect(() => {
    blocks.forEach((block) => {
      if (!blockHistory[block.id]) {
        setBlockHistory((prev) => ({
          ...prev,
          [block.id]: {
            history: [
              {
                timestamp: Date.now(),
                data: JSON.parse(JSON.stringify(block.data)),
                description: "État initial",
              },
            ],
            currentIndex: 0,
          },
        }));
      }
    });
  }, []);

  function addBlock(type: ContentBlockType) {
    const newBlock = createBlock(type);
    onChange([...blocks, newBlock]);
    // Initialize history for new block
    setBlockHistory((prev) => ({
      ...prev,
      [newBlock.id]: {
        history: [
          {
            timestamp: Date.now(),
            data: newBlock.data,
            description: "Nouveau bloc créé",
          },
        ],
        currentIndex: 0,
      },
    }));
  }

  function removeBlock(id: string) {
    onChange(blocks.filter((block) => block.id !== id));
  }

  function addToHistory(blockId: string, newData: ContentBlock["data"], description: string) {
    setBlockHistory((prev) => {
      const current = prev[blockId] ?? { history: [], currentIndex: -1 };
      const newHistory = current.history.slice(0, current.currentIndex + 1);
      newHistory.push({
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(newData)),
        description,
      });
      return {
        ...prev,
        [blockId]: {
          history: newHistory,
          currentIndex: newHistory.length - 1,
        },
      };
    });
  }

  function undo(blockId: string) {
    const current = blockHistory[blockId];
    if (!current || current.currentIndex <= 0) return;

    const prevIndex = current.currentIndex - 1;
    const prevData = current.history[prevIndex];
    if (!prevData) return;

    setBlockHistory((prev) => ({
      ...prev,
      [blockId]: { ...prev[blockId]!, currentIndex: prevIndex },
    }));

    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex >= 0) {
      const newBlocks = [...blocks];
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], data: JSON.parse(JSON.stringify(prevData.data)) };
      onChange(newBlocks);
    }
  }

  function redo(blockId: string) {
    const current = blockHistory[blockId];
    if (!current || current.currentIndex >= current.history.length - 1) return;

    const nextIndex = current.currentIndex + 1;
    const nextData = current.history[nextIndex];
    if (!nextData) return;

    setBlockHistory((prev) => ({
      ...prev,
      [blockId]: { ...prev[blockId]!, currentIndex: nextIndex },
    }));

    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex >= 0) {
      const newBlocks = [...blocks];
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], data: JSON.parse(JSON.stringify(nextData.data)) };
      onChange(newBlocks);
    }
  }

  function restoreFromHistory(blockId: string, historyIndex: number) {
    const current = blockHistory[blockId];
    if (!current || !current.history[historyIndex]) return;

    const targetData = current.history[historyIndex];

    setBlockHistory((prev) => ({
      ...prev,
      [blockId]: { ...prev[blockId]!, currentIndex: historyIndex },
    }));

    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex >= 0) {
      const newBlocks = [...blocks];
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], data: JSON.parse(JSON.stringify(targetData.data)) };
      onChange(newBlocks);
    }
  }

  function moveBlock(targetId: string) {
    if (!dragId || dragId === targetId) return;
    const dragIndex = blocks.findIndex((block) => block.id === dragId);
    const targetIndex = blocks.findIndex((block) => block.id === targetId);
    if (dragIndex < 0 || targetIndex < 0) return;

    const next = [...blocks];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
  }

  function updateBlockWithHistory(blockId: string, nextData: Partial<ContentBlock["data"]>, description: string) {
    const blockIndex = blocks.findIndex((b) => b.id === blockId);
    if (blockIndex >= 0) {
      const fullData = { ...blocks[blockIndex].data, ...nextData };
      addToHistory(blockId, fullData, description);
      const newBlocks = [...blocks];
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], data: fullData };
      onChange(newBlocks);
    }
  }

  function syncTextBlock(id: string) {
    const editor = document.getElementById(`text-editor-${id}`) as HTMLDivElement | null;
    if (!editor) return;
    const nextHtml = stripBidiDirectionArtifacts(sanitizeRichTextHtml(editor.innerHTML));
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
    
    const blockIndex = blocks.findIndex((b) => b.id === id);
    if (blockIndex >= 0) {
      const nextData = { ...blocks[blockIndex].data, paragraph: nextHtml };
      addToHistory(id, nextData, "Édition texte");
      const newBlocks = [...blocks];
      newBlocks[blockIndex] = { ...newBlocks[blockIndex], data: nextData };
      onChange(newBlocks);
    }
  }

  function cacheSelectionForBlock(id: string) {
    const editor = document.getElementById(`text-editor-${id}`) as HTMLDivElement | null;
    const selection = window.getSelection();
    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    savedSelectionRange.current[id] = range.cloneRange();
  }

  function restoreSelectionForBlock(id: string) {
    const range = savedSelectionRange.current[id];
    const selection = window.getSelection();
    if (!range || !selection) return;
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function handleToolbarMouseDown(event: React.MouseEvent, id: string) {
    event.preventDefault();
    cacheSelectionForBlock(id);
  }

  function runTextCommand(id: string, command: string, value?: string) {
    const editor = document.getElementById(`text-editor-${id}`) as HTMLDivElement | null;
    if (!editor) return;
    editor.focus();
    restoreSelectionForBlock(id);
    document.execCommand(command, false, value);
    cacheSelectionForBlock(id);
    syncTextBlock(id);
  }

  function applyTextColor(id: string, color: string) {
    const editor = document.getElementById(`text-editor-${id}`) as HTMLDivElement | null;
    if (!editor) return;

    editor.focus();
    restoreSelectionForBlock(id);
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    document.execCommand("styleWithCSS", false, "true");
    document.execCommand("foreColor", false, color);
    setColorEditor((prev) => ({
      ...prev,
      [id]: { open: prev[id]?.open ?? false, value: color },
    }));
    cacheSelectionForBlock(id);
    syncTextBlock(id);
  }

  function toggleColorEditor(id: string) {
    cacheSelectionForBlock(id);
    setColorEditor((prev) => ({
      ...prev,
      [id]: {
        open: !(prev[id]?.open ?? false),
        value: prev[id]?.value ?? "#1E293B",
      },
    }));
  }

  function closeColorEditor(id: string) {
    setColorEditor((prev) => ({
      ...prev,
      [id]: {
        open: false,
        value: prev[id]?.value ?? "#1E293B",
      },
    }));
  }

  function openTextLinkEditor(id: string) {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelectionRange.current[id] = selection.getRangeAt(0).cloneRange();
    }

    setLinkEditor((prev) => ({
      ...prev,
      [id]: { open: true, url: prev[id]?.url ?? "", label: prev[id]?.label ?? "" },
    }));
  }

  function closeTextLinkEditor(id: string) {
    setLinkEditor((prev) => ({
      ...prev,
      [id]: { open: false, url: "", label: "" },
    }));
    savedSelectionRange.current[id] = null;
  }

  function getLinkDisplayLabel(href: string): string {
    try {
      const parsed = new URL(href);
      return parsed.hostname.replace(/^www\./i, "");
    } catch {
      return "Lien";
    }
  }

  function escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function applyTextLink(id: string) {
    const rawUrl = linkEditor[id]?.url?.trim() ?? "";
    if (!rawUrl) return;

    const href = /^(https?:\/\/|mailto:|tel:)/i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
    const customLabel = linkEditor[id]?.label?.trim() ?? "";
    const editor = document.getElementById(`text-editor-${id}`) as HTMLDivElement | null;
    if (!editor) return;

    editor.focus();
    const range = savedSelectionRange.current[id];
    const selection = window.getSelection();
    if (selection && range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const hasSelectedText = Boolean(selection && selection.rangeCount > 0 && !selection.getRangeAt(0).collapsed);

    if (hasSelectedText) {
      document.execCommand("createLink", false, href);
    } else {
      const linkLabel = customLabel || getLinkDisplayLabel(href);
      const html = `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkLabel)}</a>`;
      document.execCommand("insertHTML", false, html);
    }

    syncTextBlock(id);
    closeTextLinkEditor(id);
  }

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-3 flex-1">
        <div className="rounded-xl border border-neutral-200 bg-white p-2.5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#64748B" }}>
          Ajouter un bloc
        </p>
        <div className="flex flex-wrap gap-2">
          {TYPE_ITEMS.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => addBlock(type)}
              className="group relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-white text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
              aria-label={TYPE_LABEL[type]}
              title={TYPE_LABEL[type]}
            >
              {TYPE_ICON[type]}
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100">
                {TYPE_LABEL[type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-neutral-200 py-10 text-center text-sm" style={{ color: "#94A3B8" }}>
          Aucun bloc. Utilisez &quot;Ajouter un bloc&quot;.
        </div>
      ) : null}

      {blocks.map((block) => (
        <div
          key={block.id}
          className="rounded-xl border border-neutral-200 bg-white"
          draggable
          onDragStart={() => setDragId(block.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            moveBlock(block.id);
            setDragId(null);
          }}
          onDragEnd={() => setDragId(null)}
        >
          <div className="px-3 py-2 border-b border-neutral-100 flex items-center gap-2">
            <span className="text-xs" style={{ color: "#94A3B8" }}>::</span>
            <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "#64748B" }}>{TYPE_LABEL[block.type]}</p>
            <div className="flex-1" />
            <button type="button" onClick={() => removeBlock(block.id)} className="text-xs font-semibold" style={{ color: "#DC2626" }}>
              Supprimer
            </button>
          </div>

          <div className="p-3 flex flex-col gap-3">
            {block.type === "text" ? (
              <>
                <input
                  type="text"
                  value={block.data.title ?? ""}
                  onChange={(event) => updateBlockWithHistory(block.id, { title: event.target.value }, "Titre modifié")}
                  placeholder="Titre"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <div className="rounded-lg border border-neutral-300 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-1 border-b border-neutral-200 bg-slate-50 px-2 py-1.5">
                    <button type="button" onMouseDown={(event) => handleToolbarMouseDown(event, block.id)} onClick={() => undo(block.id)} disabled={!blockHistory[block.id] || blockHistory[block.id].currentIndex <= 0} className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs disabled:opacity-50" title="Annuler">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 7v6h6" />
                        <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
                      </svg>
                    </button>
                    <button type="button" onMouseDown={(event) => handleToolbarMouseDown(event, block.id)} onClick={() => redo(block.id)} disabled={!blockHistory[block.id] || blockHistory[block.id].currentIndex >= blockHistory[block.id].history.length - 1} className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs disabled:opacity-50" title="Rétablir">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 7v6h-6" />
                        <path d="M3 17a9 9 0 019-9 9 9 0 016 2.3l3 2.7" />
                      </svg>
                    </button>
                    <button type="button" onMouseDown={(event) => handleToolbarMouseDown(event, block.id)} onClick={() => setSelectedBlockForHistory(selectedBlockForHistory === block.id ? null : block.id)} className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs" title="Historique">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </button>

                    <div className="mx-1 h-5 w-px bg-neutral-200" />
                    <button type="button" onMouseDown={(event) => handleToolbarMouseDown(event, block.id)} onClick={() => runTextCommand(block.id, "bold")} className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs font-bold" title="Gras">B</button>
                    <button type="button" onMouseDown={(event) => handleToolbarMouseDown(event, block.id)} onClick={() => runTextCommand(block.id, "italic")} className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs italic" title="Italique">I</button>
                    <button type="button" onMouseDown={(event) => handleToolbarMouseDown(event, block.id)} onClick={() => runTextCommand(block.id, "underline")} className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs underline" title="Souligne">U</button>
                    <button type="button" onMouseDown={(event) => handleToolbarMouseDown(event, block.id)} onClick={() => runTextCommand(block.id, "strikeThrough")} className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs line-through" title="Barre">S</button>

                    <div className="mx-1 h-5 w-px bg-neutral-200" />

                    <button
                      type="button"
                      onMouseDown={(event) => handleToolbarMouseDown(event, block.id)}
                      onClick={() => runTextCommand(block.id, "insertUnorderedList")}
                      className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs"
                      title="Liste puces"
                      aria-label="Liste puces"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="9" y1="6" x2="20" y2="6" />
                        <line x1="9" y1="12" x2="20" y2="12" />
                        <line x1="9" y1="18" x2="20" y2="18" />
                        <circle cx="4" cy="6" r="1" />
                        <circle cx="4" cy="12" r="1" />
                        <circle cx="4" cy="18" r="1" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => handleToolbarMouseDown(event, block.id)}
                      onClick={() => runTextCommand(block.id, "insertOrderedList")}
                      className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs"
                      title="Liste numerotee"
                      aria-label="Liste numerotee"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="10" y1="6" x2="20" y2="6" />
                        <line x1="10" y1="12" x2="20" y2="12" />
                        <line x1="10" y1="18" x2="20" y2="18" />
                        <path d="M4 5h1v2" />
                        <path d="M3 12h2l-2 2h2" />
                        <path d="M3 17h2a1 1 0 0 1 0 2H3" />
                      </svg>
                    </button>

                    <div className="mx-1 h-5 w-px bg-neutral-200" />

                    <button
                      type="button"
                      onMouseDown={(event) => handleToolbarMouseDown(event, block.id)}
                      onClick={() => openTextLinkEditor(block.id)}
                      className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs"
                      title="Ajouter un lien"
                      aria-label="Ajouter un lien"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L10 5" />
                        <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L14 19" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => handleToolbarMouseDown(event, block.id)}
                      onClick={() => runTextCommand(block.id, "unlink")}
                      className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs"
                      title="Retirer le lien"
                      aria-label="Retirer le lien"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10 13a5 5 0 0 0 7.07 0l2.83-2.83a5 5 0 0 0-7.07-7.07L10 5" />
                        <path d="M14 11a5 5 0 0 0-7.07 0L4.1 13.83a5 5 0 1 0 7.07 7.07L14 19" />
                        <line x1="3" y1="3" x2="21" y2="21" />
                      </svg>
                    </button>

                    <div className="mx-1 h-5 w-px bg-neutral-200" />

                    <div className="relative">
                      <button
                        type="button"
                        onMouseDown={(event) => handleToolbarMouseDown(event, block.id)}
                        onClick={() => toggleColorEditor(block.id)}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 text-xs"
                        title="Couleur du texte"
                        aria-label="Couleur du texte"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 4l7 16" />
                          <path d="M5 20h14" />
                          <path d="M8 13h8" />
                        </svg>
                        <span
                          className="h-1.5 w-4 rounded-full"
                          style={{ background: colorEditor[block.id]?.value ?? "#1E293B" }}
                        />
                      </button>

                      {colorEditor[block.id]?.open ? (
                        <div className="absolute left-0 top-9 z-20 min-w-[190px] rounded-lg border border-neutral-200 bg-white p-2 shadow-lg">
                          <div className="mb-2 flex items-center gap-1">
                            {TEXT_COLOR_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onMouseDown={(event) => handleToolbarMouseDown(event, block.id)}
                                onClick={() => applyTextColor(block.id, preset)}
                                className="h-5 w-5 rounded-full border border-neutral-200"
                                style={{ background: preset }}
                                title={`Couleur ${preset}`}
                                aria-label={`Appliquer la couleur ${preset}`}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="inline-flex h-7 w-10 items-center justify-center rounded border border-neutral-300 cursor-pointer hover:bg-neutral-50">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 2c5.5 0 10 4.5 10 10s-4.5 10-10 10S2 17.5 2 12 6.5 2 12 2z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                              <input
                                type="color"
                                value={colorEditor[block.id]?.value ?? "#1E293B"}
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  restoreSelectionForBlock(block.id);
                                }}
                                onInput={(event) => applyTextColor(block.id, event.currentTarget.value)}
                                onChange={(event) => applyTextColor(block.id, event.currentTarget.value)}
                                className="absolute h-0 w-0 cursor-pointer opacity-0"
                              />
                            </label>
                            <button
                              type="button"
                              onMouseDown={(event) => handleToolbarMouseDown(event, block.id)}
                              onClick={() => applyTextColor(block.id, "#1E293B")}
                              className="inline-flex h-7 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2"
                              style={{ color: "#475569" }}
                              title="Réinitialiser la couleur"
                              aria-label="Réinitialiser la couleur"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <polyline points="23 4 23 10 17 10" />
                                <path d="M20.49 15a9 9 0 1 1-2-8.83" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onMouseDown={(event) => handleToolbarMouseDown(event, block.id)}
                              onClick={() => closeColorEditor(block.id)}
                              className="inline-flex h-7 items-center gap-1 rounded-md border border-neutral-200 bg-white px-2"
                              style={{ color: "#475569" }}
                              title="Fermer"
                              aria-label="Fermer la palette"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <select
                      defaultValue="3"
                      onMouseDown={() => cacheSelectionForBlock(block.id)}
                      onChange={(event) => runTextCommand(block.id, "fontSize", event.target.value)}
                      className="h-7 rounded-md border border-neutral-200 bg-white px-2 text-xs outline-none"
                      title="Taille du texte"
                    >
                      <option value="2">Petit</option>
                      <option value="3">Normal</option>
                      <option value="4">Moyen +</option>
                      <option value="5">Grand</option>
                      <option value="6">Tres grand</option>
                    </select>

                    <button
                      type="button"
                      onMouseDown={(event) => handleToolbarMouseDown(event, block.id)}
                      onClick={() => runTextCommand(block.id, "justifyLeft")}
                      className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs"
                      title="Aligner gauche"
                      aria-label="Aligner gauche"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="4" y1="10" x2="14" y2="10" />
                        <line x1="4" y1="14" x2="20" y2="14" />
                        <line x1="4" y1="18" x2="14" y2="18" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => handleToolbarMouseDown(event, block.id)}
                      onClick={() => runTextCommand(block.id, "justifyCenter")}
                      className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs"
                      title="Centrer"
                      aria-label="Centrer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="7" y1="10" x2="17" y2="10" />
                        <line x1="4" y1="14" x2="20" y2="14" />
                        <line x1="7" y1="18" x2="17" y2="18" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => handleToolbarMouseDown(event, block.id)}
                      onClick={() => runTextCommand(block.id, "justifyRight")}
                      className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs"
                      title="Aligner droite"
                      aria-label="Aligner droite"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="10" y1="10" x2="20" y2="10" />
                        <line x1="4" y1="14" x2="20" y2="14" />
                        <line x1="10" y1="18" x2="20" y2="18" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onMouseDown={(event) => handleToolbarMouseDown(event, block.id)}
                      onClick={() => runTextCommand(block.id, "removeFormat")}
                      className="h-7 min-w-7 rounded-md border border-neutral-200 bg-white px-2 text-xs"
                      title="Nettoyer format"
                      aria-label="Nettoyer format"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 6h11" />
                        <path d="M12 6l-6 10" />
                        <path d="M14 18h7" />
                        <path d="M17 14l4 4-4 4" />
                      </svg>
                    </button>
                  </div>

                  {linkEditor[block.id]?.open ? (
                    <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-2 py-2">
                      <input
                        type="url"
                        value={linkEditor[block.id]?.url ?? ""}
                        onChange={(event) =>
                          setLinkEditor((prev) => ({
                            ...prev,
                            [block.id]: { open: true, url: event.target.value, label: prev[block.id]?.label ?? "" },
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            applyTextLink(block.id);
                          }
                          if (event.key === "Escape") {
                            event.preventDefault();
                            closeTextLinkEditor(block.id);
                          }
                        }}
                        placeholder="https://..."
                        className="h-8 min-w-[210px] flex-1 rounded-md border border-neutral-300 px-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <input
                        type="text"
                        value={linkEditor[block.id]?.label ?? ""}
                        onChange={(event) =>
                          setLinkEditor((prev) => ({
                            ...prev,
                            [block.id]: { open: true, url: prev[block.id]?.url ?? "", label: event.target.value },
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            applyTextLink(block.id);
                          }
                        }}
                        placeholder="Texte du lien (optionnel)"
                        className="h-8 min-w-[180px] flex-1 rounded-md border border-neutral-300 px-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      />
                      <button
                        type="button"
                        onClick={() => applyTextLink(block.id)}
                        className="h-8 rounded-md bg-blue-600 px-3 text-xs font-semibold text-white"
                      >
                        Valider
                      </button>
                      <button
                        type="button"
                        onClick={() => closeTextLinkEditor(block.id)}
                        className="h-8 rounded-md border border-neutral-300 bg-white px-3 text-xs font-semibold"
                        style={{ color: "#475569" }}
                      >
                        Annuler
                      </button>
                    </div>
                  ) : null}

                  <div
                    id={`text-editor-${block.id}`}
                    contentEditable
                    dir="ltr"
                    suppressContentEditableWarning
                    onMouseUp={() => cacheSelectionForBlock(block.id)}
                    onKeyUp={() => cacheSelectionForBlock(block.id)}
                    onBlur={() => syncTextBlock(block.id)}
                    className="min-h-[130px] w-full bg-white px-3 py-2 text-sm leading-relaxed outline-none"
                    style={{ color: "#1E293B", direction: "ltr", unicodeBidi: "normal", textAlign: "left" }}
                    dangerouslySetInnerHTML={{ __html: block.data.paragraph ?? "" }}
                  />
                </div>
                <p className="text-[11px]" style={{ color: "#94A3B8" }}>
                  Selectionne un mot ou une phrase, puis applique: lien, couleur, taille, listes, alignement, etc.
                </p>
              </>
            ) : null}

            {block.type === "image" ? (
              <>
                <ImageUploader
                  value={block.data.image ?? null}
                  onChange={(image) => onChange(updateBlock(blocks, block.id, { image }))}
                  aspectRatio="16/9"
                />
                <input
                  type="text"
                  value={block.data.caption ?? ""}
                  onChange={(event) => onChange(updateBlock(blocks, block.id, { caption: event.target.value }))}
                  placeholder="Legende"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </>
            ) : null}

            {block.type === "gallery" ? (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-xs" style={{ color: "#64748B" }}>Colonnes</p>
                  {[2, 3, 4].map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => onChange(updateBlock(blocks, block.id, { columns: col as 2 | 3 | 4 }))}
                      className="px-2 py-1 rounded-md text-xs font-semibold"
                      style={block.data.columns === col ? { background: "#DBEAFE", color: "#1D4ED8" } : { background: "#F1F5F9", color: "#64748B" }}
                    >
                      {col}
                    </button>
                  ))}
                </div>
                <ImageUploader
                  multiple
                  items={block.data.gallery ?? []}
                  onItemsChange={(gallery) => onChange(updateBlock(blocks, block.id, { gallery }))}
                  aspectRatio="4/3"
                />
              </>
            ) : null}

            {block.type === "video" ? (
              <input
                type="url"
                value={block.data.videoUrl ?? ""}
                onChange={(event) => onChange(updateBlock(blocks, block.id, { videoUrl: event.target.value }))}
                placeholder="https://youtube.com/..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            ) : null}

            {block.type === "quote" ? (
              <>
                <textarea
                  value={block.data.quoteText ?? ""}
                  onChange={(event) => onChange(updateBlock(blocks, block.id, { quoteText: event.target.value }))}
                  placeholder="Citation"
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
                <input
                  type="text"
                  value={block.data.quoteAuthor ?? ""}
                  onChange={(event) => onChange(updateBlock(blocks, block.id, { quoteAuthor: event.target.value }))}
                  placeholder="Auteur"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </>
            ) : null}

            {block.type === "comparison" ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <ImageUploader
                    label="Avant"
                    value={block.data.beforeImage ?? null}
                    onChange={(beforeImage) => onChange(updateBlock(blocks, block.id, { beforeImage }))}
                    aspectRatio="4/3"
                  />
                  <ImageUploader
                    label="Apres"
                    value={block.data.afterImage ?? null}
                    onChange={(afterImage) => onChange(updateBlock(blocks, block.id, { afterImage }))}
                    aspectRatio="4/3"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={comparePosition[block.id] ?? 50}
                  onChange={(event) => setComparePosition((prev) => ({ ...prev, [block.id]: Number(event.target.value) }))}
                />
              </>
            ) : null}

            {block.type === "code" ? (
              <>
                <input
                  type="text"
                  value={block.data.language ?? ""}
                  onChange={(event) => onChange(updateBlock(blocks, block.id, { language: event.target.value }))}
                  placeholder="Langage (tsx, js, css...)"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <textarea
                  value={block.data.code ?? ""}
                  onChange={(event) => onChange(updateBlock(blocks, block.id, { code: event.target.value }))}
                  placeholder="Code"
                  rows={6}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y"
                />
              </>
            ) : null}

            {block.type === "embed" ? (
              <input
                type="url"
                value={block.data.embedUrl ?? ""}
                onChange={(event) => onChange(updateBlock(blocks, block.id, { embedUrl: event.target.value }))}
                placeholder="https://www.figma.com/embed?..."
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            ) : null}
          </div>
        </div>
      ))}

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: "#64748B" }}>Preview en temps reel</p>
        <div className="flex flex-col gap-4">
          {previewBlocks.length === 0 ? (
            <p className="text-sm" style={{ color: "#94A3B8" }}>Aucun contenu pour le moment.</p>
          ) : null}

          {previewBlocks.map((block) => (
            <div key={`preview-${block.id}`} className="rounded-lg border border-neutral-100 bg-slate-50/50 p-3">
              {block.type === "text" ? (
                <>
                  {block.data.title ? <h4 className="text-sm font-semibold" style={{ color: "#0F172A" }}>{block.data.title}</h4> : null}
                  {block.data.paragraph ? (
                    <div
                      className="text-sm mt-1"
                      style={{ color: "#334155" }}
                      dangerouslySetInnerHTML={{ __html: sanitizeRichTextHtml(block.data.paragraph) }}
                    />
                  ) : null}
                </>
              ) : null}

              {block.type === "image" && block.data.image ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={block.data.image.url} alt={block.data.image.name} className="w-full rounded-md" />
                  {block.data.caption ? <p className="text-xs mt-1" style={{ color: "#64748B" }}>{block.data.caption}</p> : null}
                </>
              ) : null}

              {block.type === "gallery" && (block.data.gallery?.length ?? 0) > 0 ? (
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${block.data.columns ?? 2}, minmax(0,1fr))` }}>
                  {(block.data.gallery ?? []).map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={img.id} src={img.url} alt={img.name} className="w-full rounded-md" />
                  ))}
                </div>
              ) : null}

              {block.type === "video" && block.data.videoUrl ? <p className="text-sm" style={{ color: "#1D4ED8" }}>{block.data.videoUrl}</p> : null}

              {block.type === "quote" && block.data.quoteText ? (
                <blockquote className="border-l-4 pl-3" style={{ borderColor: "#93C5FD", color: "#334155" }}>
                  <p className="text-sm">{block.data.quoteText}</p>
                  {block.data.quoteAuthor ? <footer className="text-xs mt-1" style={{ color: "#64748B" }}>{block.data.quoteAuthor}</footer> : null}
                </blockquote>
              ) : null}

              {block.type === "comparison" && block.data.beforeImage && block.data.afterImage ? (
                <div className="relative overflow-hidden rounded-md" style={{ aspectRatio: "4/3" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={block.data.beforeImage.url} alt="Avant" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${comparePosition[block.id] ?? 50}%` }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={block.data.afterImage.url} alt="Apres" className="h-full w-full object-cover" />
                  </div>
                </div>
              ) : null}

              {block.type === "code" && block.data.code ? (
                <pre className="rounded-md p-3 text-xs overflow-x-auto" style={{ background: "#0F172A", color: "#E2E8F0" }}>
                  <code>{block.data.code}</code>
                </pre>
              ) : null}

              {block.type === "embed" && block.data.embedUrl ? (
                <p className="text-sm" style={{ color: "#1D4ED8" }}>{block.data.embedUrl}</p>
              ) : null}
            </div>
          ))}
        </div>
        </div>
      </div>

      {selectedBlockForHistory ? (
        <div className="w-80 rounded-xl border border-neutral-200 bg-white p-4 max-h-[600px] flex flex-col sticky top-0">
          <div className="mb-3 border-b border-neutral-200 pb-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: "#64748B" }}>
              Historique
            </p>
          </div>
          <div className="overflow-y-auto flex-1 flex flex-col gap-2">
            {blockHistory[selectedBlockForHistory]?.history.map((entry, idx) => {
              const isCurrent = blockHistory[selectedBlockForHistory].currentIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => restoreFromHistory(selectedBlockForHistory, idx)}
                  className={`rounded-lg border px-2 py-2 text-xs text-left transition-all ${
                    isCurrent
                      ? "border-blue-300 bg-blue-50"
                      : "border-neutral-200 bg-white hover:bg-neutral-50"
                  }`}
                >
                  <p className="font-semibold" style={{ color: isCurrent ? "#1D4ED8" : "#475569" }}>
                    {entry.description}
                  </p>
                  <p style={{ color: "#94A3B8" }} className="text-[10px] mt-1">
                    {new Date(entry.timestamp).toLocaleTimeString("fr-FR")}
                  </p>
                </button>
              );
            })}
            {(!blockHistory[selectedBlockForHistory] || blockHistory[selectedBlockForHistory].history.length === 0) && (
              <p className="text-xs" style={{ color: "#94A3B8" }}>
                Aucune modification
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
