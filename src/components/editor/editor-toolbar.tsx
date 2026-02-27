"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PanelRightOpen,
  PanelRightClose,
  Download,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { useEditorStore } from "@/lib/store/editor-store";
import type { Editor } from "@tiptap/react";

interface EditorToolbarProps {
  editor: Editor | null;
}

function ToolbarButton({
  isActive = false,
  onClick,
  title,
  disabled = false,
  children,
}: {
  isActive?: boolean;
  onClick: () => void;
  title: string;
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
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-sm transition-colors",
        "hover:bg-ink-100 active:bg-ink-200 dark:hover:bg-ink-800 dark:active:bg-ink-700",
        "disabled:opacity-50 disabled:pointer-events-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
        isActive
          ? "bg-ink-200 text-ink-900 dark:bg-ink-700 dark:text-ink-100"
          : "text-ink-600 dark:text-ink-400"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <div className="h-4 w-px bg-ink-200 mx-1 dark:bg-ink-700" aria-hidden="true" />
  );
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  "in-review": "In Review",
  revision: "Revision",
  final: "Final",
  published: "Published",
};

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const router = useRouter();
  const currentPaper = useEditorStore((s) => s.currentPaper);
  const wordCount = useEditorStore((s) => s.wordCount);
  const aiPanelOpen = useEditorStore((s) => s.aiPanelOpen);
  const toggleAIPanel = useEditorStore((s) => s.toggleAIPanel);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isSaving = useEditorStore((s) => s.isSaving);
  const [title, setTitle] = useState(currentPaper?.title ?? "Untitled");

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex items-center h-12 px-3 border-b border-ink-200 bg-surface dark:border-ink-700 dark:bg-surface-secondary">
      {/* Left: back + title + status */}
      <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard")}
          aria-label="Back to dashboard"
          className="h-7 w-7"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-transparent border-none outline-none text-sm font-semibold text-ink-900 dark:text-ink-100 max-w-[180px] truncate focus:ring-1 focus:ring-brand-500 rounded px-1"
          aria-label="Paper title"
        />

        {currentPaper && (
          <Badge variant="secondary" className="text-[10px]">
            {STATUS_LABELS[currentPaper.status] ?? currentPaper.status}
          </Badge>
        )}
      </div>

      {/* Center: formatting */}
      <div className="flex items-center gap-0.5 mx-auto flex-shrink-0" role="toolbar" aria-label="Text formatting">
        <ToolbarButton
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          isActive={editor.isActive("heading", { level: 1 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          title="Heading 1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          title="Heading 2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("heading", { level: 3 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          title="Heading 3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Ordered List"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          isActive={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          title="Code Block"
        >
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive("link")}
          onClick={handleSetLink}
          title="Insert Link"
        >
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          isActive={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          title="Align Left"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          title="Align Center"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          isActive={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          title="Align Right"
        >
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* Right: word count, AI toggle, export, save */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-xs text-ink-500 tabular-nums">
          {wordCount.toLocaleString()} words
        </span>

        <ToolbarDivider />

        <Button
          variant={aiPanelOpen ? "secondary" : "ghost"}
          size="sm"
          onClick={toggleAIPanel}
          className="h-7 gap-1.5 text-xs"
          aria-label={aiPanelOpen ? "Close AI panel" : "Open AI panel"}
        >
          {aiPanelOpen ? (
            <PanelRightClose className="h-3.5 w-3.5" />
          ) : (
            <PanelRightOpen className="h-3.5 w-3.5" />
          )}
          AI
        </Button>

        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>

        <div className="flex items-center gap-1 text-xs text-ink-500">
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Saving</span>
            </>
          ) : isDirty ? (
            <span className="text-warning">Unsaved</span>
          ) : (
            <>
              <Check className="h-3 w-3 text-success" />
              <span>Saved</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
