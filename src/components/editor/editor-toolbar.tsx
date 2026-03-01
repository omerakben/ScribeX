"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronLeft,
  Code,
  Download,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Wand2,
  Waves,
  Quote,
  Sigma,
  Strikethrough,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  Underline as UnderlineIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useEditorStore } from "@/lib/store/editor-store";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { ExportDialog } from "@/components/export/export-dialog";
import { DarkModeToggle } from "@/components/editor/dark-mode-toggle";
import type { ReasoningEffort } from "@/lib/types";
import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
  onSave?: () => void;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-ink-100 text-ink-600",
  },
  "in-review": {
    label: "In Review",
    className: "bg-brand-50 text-brand-700",
  },
  revision: {
    label: "Revision",
    className: "bg-amber-50 text-amber-700",
  },
  final: {
    label: "Final",
    className: "bg-emerald-50 text-emerald-700",
  },
  published: {
    label: "Published",
    className: "bg-ink-900 text-ink-50",
  },
};

function ToolbarDivider() {
  return <div className="mx-1.5 h-6 w-px bg-ink-200" aria-hidden="true" />;
}

function ToolbarButton({
  title,
  isActive,
  onClick,
  disabled,
  children,
}: {
  title: string;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      aria-pressed={isActive}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-md transition-colors [&>svg]:h-[18px] [&>svg]:w-[18px]",
        isActive
          ? "bg-ink-100 text-ink-900"
          : "text-ink-500 hover:bg-ink-100 hover:text-ink-700",
        "disabled:cursor-not-allowed disabled:opacity-40"
      )}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ editor, onSave }: EditorToolbarProps) {
  const router = useRouter();

  const currentPaper = useEditorStore((s) => s.currentPaper);
  const savePaper = useEditorStore((s) => s.savePaper);

  const wordCount = useEditorStore((s) => s.wordCount);
  const aiPanelOpen = useEditorStore((s) => s.aiPanelOpen);
  const toggleAIPanel = useEditorStore((s) => s.toggleAIPanel);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isSaving = useEditorStore((s) => s.isSaving);
  const reasoningEffort = useEditorStore((s) => s.reasoningEffort);
  const setReasoningEffort = useEditorStore((s) => s.setReasoningEffort);
  const autocompleteEnabled = useEditorStore((s) => s.autocompleteEnabled);
  const setAutocompleteEnabled = useEditorStore((s) => s.setAutocompleteEnabled);
  const diffusionEnabled = useEditorStore((s) => s.diffusionEnabled);
  const setDiffusionEnabled = useEditorStore((s) => s.setDiffusionEnabled);

  const [exportOpen, setExportOpen] = useState(false);
  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
  const title = currentPaper
    ? titleDrafts[currentPaper.id] ?? currentPaper.title
    : "Untitled Paper";

  const persistTitle = () => {
    if (!currentPaper) return;

    const trimmed = title.trim() || "Untitled Paper";
    if (trimmed === currentPaper.title) return;

    savePaper(currentPaper.id, { title: trimmed });
    setTitleDrafts((state) => {
      const next = { ...state };
      delete next[currentPaper.id];
      return next;
    });
  };

  const handleSetLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const toolbarDisabled = !editor;

  const statusEntry = currentPaper ? (statusConfig[currentPaper.status] ?? { label: currentPaper.status, className: "bg-ink-100 text-ink-600" }) : null;

  return (
    <header className="flex-shrink-0 bg-white border-b border-ink-200">
      {/* Top bar */}
      <div className="flex h-12 items-center px-4">
        {/* Left: back + title + status */}
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <input
            value={title}
            onChange={(event) => {
              if (!currentPaper) return;
              const nextTitle = event.target.value;
              setTitleDrafts((state) => ({ ...state, [currentPaper.id]: nextTitle }));
            }}
            onBlur={persistTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            className="min-w-0 max-w-[280px] rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-ink-900 outline-none transition-colors hover:border-ink-200 focus:border-ink-300"
            aria-label="Paper title"
          />

          {statusEntry ? (
            <span
              className={cn(
                "text-[11px] font-medium px-2 py-0.5 rounded-full",
                statusEntry.className
              )}
            >
              {statusEntry.label}
            </span>
          ) : null}
        </div>

        {/* Right: word count, reasoning effort, AI toggle, export, save indicator */}
        <div className="flex items-center gap-1">
          <span className="mr-1 text-xs text-ink-400 tabular-nums">
            {wordCount.toLocaleString()} words
          </span>

          <Select
            value={reasoningEffort}
            onValueChange={(value) => setReasoningEffort(value as ReasoningEffort)}
          >
            <SelectTrigger
              className="h-7 w-[112px] border-ink-200 bg-white text-xs text-ink-600 shadow-none focus:ring-1 focus:ring-brand-500"
              aria-label="Reasoning effort: controls AI quality/speed tradeoff"
              title="Controls AI quality/speed tradeoff"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant" className="text-xs">Instant</SelectItem>
              <SelectItem value="low" className="text-xs">Low</SelectItem>
              <SelectItem value="medium" className="text-xs">Medium</SelectItem>
              <SelectItem value="high" className="text-xs">High</SelectItem>
            </SelectContent>
          </Select>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setAutocompleteEnabled(!autocompleteEnabled)}
                  aria-label={autocompleteEnabled ? "Disable autocomplete" : "Enable autocomplete"}
                  className={cn(
                    "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
                    autocompleteEnabled
                      ? "bg-mercury-50 text-mercury-600"
                      : "text-ink-400 hover:text-ink-600 hover:bg-ink-50"
                  )}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {autocompleteEnabled ? "Disable autocomplete" : "Enable autocomplete"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => setDiffusionEnabled(!diffusionEnabled)}
                  aria-label={diffusionEnabled ? "Disable diffusion effect" : "Enable diffusion effect"}
                  className={cn(
                    "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
                    diffusionEnabled
                      ? "bg-mercury-50 text-mercury-600"
                      : "text-ink-400 hover:text-ink-600 hover:bg-ink-50"
                  )}
                >
                  <Waves className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {diffusionEnabled ? "Disable diffusion effect" : "Enable diffusion effect"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DarkModeToggle />

          <button
            type="button"
            onClick={toggleAIPanel}
            aria-label={aiPanelOpen ? "Hide AI panel" : "Show AI panel"}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
              aiPanelOpen
                ? "bg-brand-50 text-brand-600"
                : "text-ink-500 hover:bg-ink-100"
            )}
          >
            {aiPanelOpen
              ? <PanelRightClose className="h-4 w-4" />
              : <PanelRightOpen className="h-4 w-4" />
            }
          </button>

          <button
            type="button"
            onClick={() => setExportOpen(true)}
            aria-label="Export paper"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-100"
          >
            <Download className="h-4 w-4" />
          </button>

          <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />

          <button
            type="button"
            onClick={() => isDirty && onSave?.()}
            disabled={!isDirty || isSaving}
            className="ml-1 inline-flex min-w-[56px] items-center justify-end gap-1 text-xs text-ink-400 hover:text-ink-600 transition-colors disabled:cursor-default disabled:hover:text-ink-400"
            aria-label={isSaving ? "Saving" : isDirty ? "Save now" : "All changes saved"}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </>
            ) : isDirty ? (
              <span className="text-ink-400">Unsaved</span>
            ) : (
              <>
                <Check className="h-3 w-3" />
                Saved
              </>
            )}
          </button>
        </div>
      </div>

      {/* Formatting toolbar */}
      <div
        className="flex h-11 items-center justify-center gap-1 overflow-x-auto border-b border-ink-100 bg-white px-4"
        role="toolbar"
        aria-label="Editor formatting"
      >
        <ToolbarButton
          title="Bold"
          isActive={editor?.isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={toolbarDisabled}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Italic"
          isActive={editor?.isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={toolbarDisabled}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Underline"
          isActive={editor?.isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          disabled={toolbarDisabled}
        >
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Strikethrough"
          isActive={editor?.isActive("strike")}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          disabled={toolbarDisabled}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Superscript"
          isActive={editor?.isActive("superscript")}
          onClick={() => editor?.chain().focus().toggleSuperscript().run()}
          disabled={toolbarDisabled}
        >
          <SuperscriptIcon className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Subscript"
          isActive={editor?.isActive("subscript")}
          onClick={() => editor?.chain().focus().toggleSubscript().run()}
          disabled={toolbarDisabled}
        >
          <SubscriptIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Heading 1"
          isActive={editor?.isActive("heading", { level: 1 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={toolbarDisabled}
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 2"
          isActive={editor?.isActive("heading", { level: 2 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={toolbarDisabled}
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Heading 3"
          isActive={editor?.isActive("heading", { level: 3 })}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={toolbarDisabled}
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Bulleted list"
          isActive={editor?.isActive("bulletList")}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={toolbarDisabled}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Numbered list"
          isActive={editor?.isActive("orderedList")}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={toolbarDisabled}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Blockquote"
          isActive={editor?.isActive("blockquote")}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          disabled={toolbarDisabled}
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Code block"
          isActive={editor?.isActive("codeBlock")}
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          disabled={toolbarDisabled}
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Insert math"
          onClick={() => editor?.chain().focus().insertInlineMath({ latex: 'E = mc^2' }).run()}
          disabled={toolbarDisabled}
        >
          <Sigma className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Insert link"
          isActive={editor?.isActive("link")}
          onClick={handleSetLink}
          disabled={toolbarDisabled}
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          title="Align left"
          isActive={editor?.isActive({ textAlign: "left" })}
          onClick={() => editor?.chain().focus().setTextAlign("left").run()}
          disabled={toolbarDisabled}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align center"
          isActive={editor?.isActive({ textAlign: "center" })}
          onClick={() => editor?.chain().focus().setTextAlign("center").run()}
          disabled={toolbarDisabled}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          title="Align right"
          isActive={editor?.isActive({ textAlign: "right" })}
          onClick={() => editor?.chain().focus().setTextAlign("right").run()}
          disabled={toolbarDisabled}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </header>
  );
}
