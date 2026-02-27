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
};

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
  const slashPosRef = useRef<number | null>(null);

  const filtered = SLASH_COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setFilter("");
    setSelectedIndex(0);
    slashPosRef.current = null;
  }, []);

  const executeCommand = useCallback(
    (command: SlashCommand) => {
      // Delete the slash and filter text
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

      // Find the last "/" that starts a slash command context
      const lastSlashIndex = textBefore.lastIndexOf("/");
      if (lastSlashIndex === -1) {
        if (isOpen) close();
        return;
      }

      // Check if "/" is at the start of a line or after a space
      const charBefore = lastSlashIndex > 0 ? textBefore[lastSlashIndex - 1] : "\n";
      if (charBefore !== "\n" && charBefore !== " " && lastSlashIndex !== 0) {
        if (isOpen) close();
        return;
      }

      const query = textBefore.slice(lastSlashIndex + 1);
      // If query has a space, it's not a slash command anymore
      if (query.includes(" ") || query.includes("\n")) {
        if (isOpen) close();
        return;
      }

      // Calculate position from the cursor coordinates
      const coords = editor.view.coordsAtPos(from);
      const editorRect = editor.view.dom.closest(".editor-scroll-area")?.getBoundingClientRect();
      if (editorRect) {
        setPosition({
          top: coords.bottom - editorRect.top + 4,
          left: coords.left - editorRect.left,
        });
      } else {
        setPosition({
          top: coords.bottom + 4,
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
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          executeCommand(filtered[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, filtered, selectedIndex, executeCommand, close]);

  if (!isOpen || filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-72 rounded-lg border border-ink-200 bg-surface-elevated shadow-lg overflow-hidden animate-scale-in dark:border-ink-700"
      style={{ top: position.top, left: position.left }}
      role="listbox"
      aria-label="Slash commands"
    >
      <div className="p-1.5 max-h-80 overflow-y-auto">
        {filtered.map((cmd, index) => {
          const Icon = ICON_MAP[cmd.icon] ?? Sparkles;
          return (
            <button
              key={cmd.id}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                index === selectedIndex
                  ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                  : "text-ink-700 hover:bg-ink-50 dark:text-ink-300 dark:hover:bg-ink-800"
              )}
              onClick={() => executeCommand(cmd)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-ink-100 dark:bg-ink-800">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{cmd.label}</div>
                <div className="text-xs text-ink-500 truncate">
                  {cmd.description}
                </div>
              </div>
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded bg-mercury-100 text-mercury-700 dark:bg-mercury-900/30 dark:text-mercury-400">
                {cmd.model === "mercury-2" ? "M2" : "ME"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
