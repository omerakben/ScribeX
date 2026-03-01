"use client";

import { useState } from "react";
import { ChevronDown, Pencil } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ChangeBlock } from "@/lib/utils/change-block-parser";
import type { Editor } from "@tiptap/react";

// --- Types -----------------------------------------------------------------

interface ChangeDiffCardProps {
  change: ChangeBlock;
  editor: Editor | null;
  /** Called after the change is applied or declined */
  onStatusChange?: (status: "applied" | "declined") => void;
}

type Status = "pending" | "applied" | "declined";

// --- Status badge -----------------------------------------------------------

const STATUS_BADGE: Record<
  Status,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className:
      "bg-amber-50 text-amber-600 border border-amber-200",
  },
  applied: {
    label: "Applied",
    className:
      "bg-emerald-50 text-emerald-600 border border-emerald-200",
  },
  declined: {
    label: "Declined",
    className:
      "bg-ink-50 text-ink-400 border border-ink-200",
  },
};

// --- Component -------------------------------------------------------------

export function ChangeDiffCard({
  change,
  editor,
  onStatusChange,
}: ChangeDiffCardProps) {
  const [status, setStatus] = useState<Status>("pending");

  // ── Apply handler ──────────────────────────────────────────────────────
  const handleApply = () => {
    if (!editor) return;

    const doc = editor.state.doc;
    let found = false;

    doc.descendants((node, pos) => {
      // Stop traversal once we have found and applied the change
      if (found || !node.isTextblock) return false;

      const text = node.textContent;
      const idx = text.indexOf(change.find);

      if (idx >= 0) {
        // pos is the ProseMirror position of the node itself;
        // +1 accounts for the opening token of the textblock node.
        const from = pos + 1 + idx;
        const to = from + change.find.length;

        if (change.replace) {
          editor
            .chain()
            .focus()
            .deleteRange({ from, to })
            .insertContentAt(from, change.replace)
            .run();
        } else {
          // Empty replace means "delete the matched text"
          editor.chain().focus().deleteRange({ from, to }).run();
        }

        found = true;
        return false;
      }
    });

    if (found) {
      setStatus("applied");
      onStatusChange?.("applied");
    }
    // When not found we leave status as "pending" so the user can see nothing happened
  };

  // ── Decline handler ────────────────────────────────────────────────────
  const handleDecline = () => {
    setStatus("declined");
    onStatusChange?.("declined");
  };

  const badge = STATUS_BADGE[status];
  const isPending = status === "pending";

  return (
    <div
      className={cn(
        "rounded-xl border border-ink-200 overflow-hidden bg-white transition-opacity duration-200",
        status === "applied" && "opacity-75 border-l-2 border-l-emerald-500",
        status === "declined" && "opacity-50"
      )}
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-ink-100 bg-ink-50 flex justify-between items-center">
        <span className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
          <Pencil className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Suggested Change
        </span>

        <span
          className={cn(
            "text-xs font-medium rounded-full px-2 py-0.5",
            badge.className
          )}
        >
          {badge.label}
        </span>
      </div>

      {/* Diff area */}
      <div className="p-3 space-y-2">
        {/* Old text — red + strikethrough */}
        <div className="bg-red-50/60 text-red-700 rounded-lg px-3 py-2 text-sm line-through break-words">
          {change.find}
        </div>

        {/* Directional arrow */}
        <div className="flex justify-center" aria-hidden="true">
          <ChevronDown className="h-4 w-4 text-ink-300" />
        </div>

        {/* New text — green */}
        <div className="bg-emerald-50/60 text-emerald-700 rounded-lg px-3 py-2 text-sm break-words">
          {change.replace ? (
            change.replace
          ) : (
            <span className="italic text-ink-400">(text will be removed)</span>
          )}
        </div>
      </div>

      {/* Action buttons — only shown while pending */}
      {isPending && (
        <div className="px-3 py-2 border-t border-ink-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="bg-ink-100 text-ink-600 hover:bg-ink-200 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="bg-brand-600 text-white hover:bg-brand-700 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
