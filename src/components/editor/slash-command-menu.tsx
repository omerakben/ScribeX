"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Maximize2,
  Minimize2,
  GraduationCap,
  BookOpen,
  ListTree,
  Swords,
  Search,
  ArrowRight,
  FileText,
  RefreshCw,
  Waves,
  GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SLASH_COMMANDS } from "@/lib/constants";
import type { SlashCommand } from "@/lib/types";
import type { Editor } from "@tiptap/react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  "maximize-2": Maximize2,
  "minimize-2": Minimize2,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  "list-tree": ListTree,
  swords: Swords,
  search: Search,
  "arrow-right": ArrowRight,
  "file-text": FileText,
  "refresh-cw": RefreshCw,
  waves: Waves,
  "git-branch": GitBranch,
};

// ─── Category Groups ──────────────────────────────────────────
type CategoryKey = "write" | "edit" | "research" | "mercury";

const CATEGORY_MAP: Record<string, CategoryKey> = {
  generate: "write",
  expand: "write",
  outline: "write",
  abstract: "write",
  transition: "write",
  simplify: "edit",
  academic: "edit",
  rewrite: "edit",
  cite: "research",
  evidence: "research",
  counter: "research",
  diffuse: "mercury",
  mermaid: "write",
};

const CATEGORY_CONFIG: Record<
  CategoryKey,
  { label: string; iconBg: string; iconColor: string; headerColor: string }
> = {
  write: {
    label: "Write",
    iconBg: "bg-brand-50",
    iconColor: "text-brand-600",
    headerColor: "text-brand-600",
  },
  edit: {
    label: "Transform",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    headerColor: "text-amber-600",
  },
  research: {
    label: "Research",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    headerColor: "text-emerald-600",
  },
  mercury: {
    label: "Mercury Special",
    iconBg: "bg-mercury-50",
    iconColor: "text-mercury-600",
    headerColor: "text-mercury-600",
  },
};

const CATEGORY_ORDER: CategoryKey[] = ["write", "edit", "research", "mercury"];

interface SlashCommandMenuProps {
  editor: Editor;
  onCommand: (command: SlashCommand) => void;
}

export function SlashCommandMenu({ editor, onCommand }: SlashCommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const slashPosRef = useRef<number | null>(null);

  const filtered = SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  // Group filtered commands by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    key: cat,
    config: CATEGORY_CONFIG[cat],
    commands: filtered.filter((cmd) => CATEGORY_MAP[cmd.id] === cat),
  })).filter((group) => group.commands.length > 0);

  // Build flat index for keyboard navigation
  const flatCommands = grouped.flatMap((g) => g.commands);

  const close = useCallback(() => {
    setIsOpen(false);
    setFilter("");
    setSelectedIndex(0);
    slashPosRef.current = null;
  }, []);

  const executeCommand = useCallback(
    (command: SlashCommand) => {
      if (slashPosRef.current !== null) {
        const from = slashPosRef.current;
        const to = editor.state.selection.head;
        editor.chain().focus().deleteRange({ from, to }).run();
      }
      close();
      onCommand(command);
    },
    [editor, close, onCommand]
  );

  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(
        Math.max(0, from - 50),
        from,
        "\n"
      );

      const lastSlashIndex = textBefore.lastIndexOf("/");
      if (lastSlashIndex === -1) {
        if (isOpen) close();
        return;
      }

      const charBefore = lastSlashIndex > 0 ? textBefore[lastSlashIndex - 1] : "\n";
      if (charBefore !== "\n" && charBefore !== " " && lastSlashIndex !== 0) {
        if (isOpen) close();
        return;
      }

      const query = textBefore.slice(lastSlashIndex + 1);
      if (query.includes(" ") || query.includes("\n")) {
        if (isOpen) close();
        return;
      }

      const coords = editor.view.coordsAtPos(from);
      const editorRect = editor.view.dom.closest(".editor-scroll-area")?.getBoundingClientRect();
      if (editorRect) {
        // Clamp left so the wide menu doesn't overflow the editor
        const menuWidth = 540;
        const maxLeft = editorRect.width - menuWidth - 16;
        const rawLeft = coords.left - editorRect.left;
        setPosition({
          top: coords.bottom - editorRect.top + 8,
          left: Math.max(16, Math.min(rawLeft, maxLeft)),
        });
      } else {
        setPosition({
          top: coords.bottom + 8,
          left: coords.left,
        });
      }

      const absoluteSlashPos = from - (textBefore.length - lastSlashIndex);
      slashPosRef.current = absoluteSlashPos;
      setFilter(query);
      setSelectedIndex(0);
      setIsOpen(true);
    };

    editor.on("update", handleUpdate);
    editor.on("selectionUpdate", handleUpdate);

    return () => {
      editor.off("update", handleUpdate);
      editor.off("selectionUpdate", handleUpdate);
    };
  }, [editor, isOpen, close]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % flatCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + flatCommands.length) % flatCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          executeCommand(flatCommands[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, flatCommands, selectedIndex, executeCommand, close]);

  // Scroll selected item into view
  useEffect(() => {
    if (!isOpen) return;
    const el = itemRefs.current.get(selectedIndex);
    el?.scrollIntoView({ block: "nearest" });
  }, [isOpen, selectedIndex]);

  if (!isOpen) return null;

  // Pre-compute the starting flat index for each group (no mutable variable in render)
  const groupStartIndices = new Map<string, number>();
  let offset = 0;
  for (const group of grouped) {
    groupStartIndices.set(group.key, offset);
    offset += group.commands.length;
  }

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-[540px] overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-xl animate-scale-in"
      style={{ top: position.top, left: position.left }}
      role="listbox"
      aria-label="Slash commands"
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-ink-900">ScribeX Commands</span>
        {filter && (
          <span className="ml-auto rounded-md bg-ink-50 px-2 py-0.5 text-xs text-ink-500">
            /{filter}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="px-4 py-8 text-sm text-ink-400 text-center">
          No commands match &ldquo;{filter}&rdquo;
        </p>
      ) : (
        <div className="max-h-[520px] overflow-y-auto p-3 space-y-4">
          {grouped.map((group) => {
            const startIndex = groupStartIndices.get(group.key) ?? 0;
            return (
              <div key={group.key}>
                {/* Category header */}
                <div className="flex items-center gap-2 px-1 pb-2">
                  <span
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wider",
                      group.config.headerColor
                    )}
                  >
                    {group.config.label}
                  </span>
                  <div className="h-px flex-1 bg-ink-100" />
                </div>

                {/* Commands grid — 2 columns */}
                <div className="grid grid-cols-2 gap-1.5">
                  {group.commands.map((cmd, cmdIndex) => {
                    const Icon = ICON_MAP[cmd.icon] ?? Sparkles;
                    const flatIndex = startIndex + cmdIndex;
                    const isSelected = flatIndex === selectedIndex;

                    return (
                      <button
                        key={cmd.id}
                        ref={(el) => {
                          if (el) itemRefs.current.set(flatIndex, el);
                        }}
                        role="option"
                        aria-selected={isSelected}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all text-left",
                          isSelected
                            ? "bg-ink-50 ring-1 ring-ink-200"
                            : "hover:bg-ink-50"
                        )}
                        onClick={() => executeCommand(cmd)}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                            isSelected ? group.config.iconBg : "bg-ink-50",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-[18px] w-[18px] transition-colors",
                              isSelected ? group.config.iconColor : "text-ink-400",
                            )}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-ink-900 leading-tight">
                            {cmd.label}
                          </span>
                          <span className="text-[11px] text-ink-400 leading-tight line-clamp-1">
                            {cmd.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer hint */}
      <div className="flex items-center justify-between border-t border-ink-100 px-4 py-2">
        <span className="text-[11px] text-ink-400">
          <kbd className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10px]">&uarr;&darr;</kbd>
          {" "}navigate
          <span className="mx-2 text-ink-200">|</span>
          <kbd className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10px]">&crarr;</kbd>
          {" "}select
          <span className="mx-2 text-ink-200">|</span>
          <kbd className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[10px]">esc</kbd>
          {" "}close
        </span>
      </div>
    </div>
  );
}
