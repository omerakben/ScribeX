"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  Bold,
  Check,
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
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { useEditorStore } from "@/lib/store/editor-store";
import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  "in-review": "In Review",
  revision: "Revision",
  final: "Final",
  published: "Published",
};

function ToolbarDivider() {
  return <div className="mx-1 h-4 w-px bg-ink-300" aria-hidden="true" />;
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
        "grid h-8 w-8 place-items-center rounded-md border text-ink-700 transition",
        isActive
          ? "border-brand-300 bg-brand-50 text-brand-700"
          : "border-transparent hover:border-ink-300 hover:bg-white",
        "disabled:cursor-not-allowed disabled:opacity-40"
      )}
    >
      {children}
    </button>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const router = useRouter();

  const currentPaper = useEditorStore((s) => s.currentPaper);
  const papers = useEditorStore((s) => s.papers);
  const setPapers = useEditorStore((s) => s.setPapers);
  const setCurrentPaper = useEditorStore((s) => s.setCurrentPaper);

  const wordCount = useEditorStore((s) => s.wordCount);
  const aiPanelOpen = useEditorStore((s) => s.aiPanelOpen);
  const toggleAIPanel = useEditorStore((s) => s.toggleAIPanel);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isSaving = useEditorStore((s) => s.isSaving);

  const [titleDrafts, setTitleDrafts] = useState<Record<string, string>>({});
  const title = currentPaper
    ? titleDrafts[currentPaper.id] ?? currentPaper.title
    : "Untitled Paper";

  const persistTitle = () => {
    if (!currentPaper) return;

    const trimmed = title.trim() || "Untitled Paper";
    if (trimmed === currentPaper.title) return;

    const updatedPaper = {
      ...currentPaper,
      title: trimmed,
      updatedAt: new Date().toISOString(),
    };

    setCurrentPaper(updatedPaper);
    setPapers(papers.map((entry) => (entry.id === currentPaper.id ? updatedPaper : entry)));
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

  return (
    <header className="border-b border-ink-200/70 bg-white/92 px-4 py-2 backdrop-blur-xl lg:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/dashboard")}
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

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
            className="w-[220px] max-w-[48vw] rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-sm font-semibold text-ink-900 outline-none transition focus:border-brand-300 focus:bg-brand-50/30"
            aria-label="Paper title"
          />

          {currentPaper ? (
            <Badge variant="secondary" className="border border-ink-300 bg-surface text-[10px] uppercase tracking-[0.1em]">
              {statusLabels[currentPaper.status] ?? currentPaper.status}
            </Badge>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-xl border border-ink-200 bg-surface-secondary px-2 py-1">
          <div className="flex items-center gap-0.5" role="toolbar" aria-label="Editor formatting">
            <ToolbarButton
              title="Bold"
              isActive={editor?.isActive("bold")}
              onClick={() => editor?.chain().focus().toggleBold().run()}
              disabled={toolbarDisabled}
            >
              <Bold className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Italic"
              isActive={editor?.isActive("italic")}
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              disabled={toolbarDisabled}
            >
              <Italic className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Underline"
              isActive={editor?.isActive("underline")}
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              disabled={toolbarDisabled}
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Strike"
              isActive={editor?.isActive("strike")}
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              disabled={toolbarDisabled}
            >
              <Strikethrough className="h-3.5 w-3.5" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              title="Heading 1"
              isActive={editor?.isActive("heading", { level: 1 })}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              disabled={toolbarDisabled}
            >
              <Heading1 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 2"
              isActive={editor?.isActive("heading", { level: 2 })}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              disabled={toolbarDisabled}
            >
              <Heading2 className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Heading 3"
              isActive={editor?.isActive("heading", { level: 3 })}
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              disabled={toolbarDisabled}
            >
              <Heading3 className="h-3.5 w-3.5" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              title="Bulleted list"
              isActive={editor?.isActive("bulletList")}
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              disabled={toolbarDisabled}
            >
              <List className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Numbered list"
              isActive={editor?.isActive("orderedList")}
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              disabled={toolbarDisabled}
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Blockquote"
              isActive={editor?.isActive("blockquote")}
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              disabled={toolbarDisabled}
            >
              <Quote className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Code block"
              isActive={editor?.isActive("codeBlock")}
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              disabled={toolbarDisabled}
            >
              <Code className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Insert link" onClick={handleSetLink} disabled={toolbarDisabled}>
              <LinkIcon className="h-3.5 w-3.5" />
            </ToolbarButton>

            <ToolbarDivider />

            <ToolbarButton
              title="Align left"
              isActive={editor?.isActive({ textAlign: "left" })}
              onClick={() => editor?.chain().focus().setTextAlign("left").run()}
              disabled={toolbarDisabled}
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Align center"
              isActive={editor?.isActive({ textAlign: "center" })}
              onClick={() => editor?.chain().focus().setTextAlign("center").run()}
              disabled={toolbarDisabled}
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </ToolbarButton>
            <ToolbarButton
              title="Align right"
              isActive={editor?.isActive({ textAlign: "right" })}
              onClick={() => editor?.chain().focus().setTextAlign("right").run()}
              disabled={toolbarDisabled}
            >
              <AlignRight className="h-3.5 w-3.5" />
            </ToolbarButton>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 text-xs text-ink-600">
          <span className="rounded-lg border border-ink-300 bg-surface-secondary px-2 py-1 font-medium tabular-nums">
            {wordCount.toLocaleString()} words
          </span>

          <Button
            variant={aiPanelOpen ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-1.5"
            onClick={toggleAIPanel}
            aria-label={aiPanelOpen ? "Hide AI panel" : "Show AI panel"}
          >
            {aiPanelOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
            AI
          </Button>

          <Button variant="ghost" size="sm" className="h-8 gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>

          <span className="inline-flex min-w-[72px] items-center justify-end gap-1.5 font-medium">
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving
              </>
            ) : isDirty ? (
              <span className="text-warning">Unsaved</span>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 text-success" />
                Saved
              </>
            )}
          </span>
        </div>
      </div>
    </header>
  );
}
