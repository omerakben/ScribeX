"use client";

import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import { Table } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { BookOpenText, Sparkles } from "lucide-react";
import { applyEdit, streamChatCompletion } from "@/lib/mercury/client";
import { useEditorStore } from "@/lib/store/editor-store";
import { SlashCommandMenu } from "@/components/editor/slash-command-menu";
import type { SlashCommand } from "@/lib/types";
import type { Editor } from "@tiptap/react";

interface EditorCanvasProps {
  onEditorReady: (editor: Editor) => void;
}

export function EditorCanvas({ onEditorReady }: EditorCanvasProps) {
  const currentPaper = useEditorStore((s) => s.currentPaper);
  const setIsDirty = useEditorStore((s) => s.setIsDirty);
  const setWordCount = useEditorStore((s) => s.setWordCount);
  const setSelectedText = useEditorStore((s) => s.setSelectedText);
  const setActiveWritingMode = useEditorStore((s) => s.setActiveWritingMode);
  const setIsAIStreaming = useEditorStore((s) => s.setIsAIStreaming);
  const addAIMessage = useEditorStore((s) => s.addAIMessage);
  const updateLastAIMessage = useEditorStore((s) => s.updateLastAIMessage);

  const editorReadyRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false, horizontalRule: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      Placeholder.configure({
        placeholder:
          "Begin your manuscript, or type / for actions like generate, simplify, citation lookup, and review...",
      }),
      Highlight.configure({ multicolor: true }),
      Typography,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Image,
      HorizontalRule,
      CharacterCount,
      Color,
      TextStyle,
    ],
    content: currentPaper?.content || "",
    editorProps: {
      attributes: {
        class: "tiptap",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => {
      setIsDirty(true);
      setWordCount(editor.storage.characterCount.words());
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      if (from !== to) {
        const text = editor.state.doc.textBetween(from, to, " ");
        setSelectedText(text, { from, to });
      } else {
        setSelectedText("");
      }
    },
  });

  useEffect(() => {
    if (!editor || editorReadyRef.current) return;

    editorReadyRef.current = true;
    onEditorReady(editor);
    setWordCount(editor.storage.characterCount.words());
  }, [editor, onEditorReady, setWordCount]);

  useEffect(() => {
    if (!editor) return;

    const words = editor.storage.characterCount.words();
    setWordCount(words);
  }, [currentPaper?.id, editor, setWordCount]);

  const handleSlashCommand = useCallback(
    async (command: SlashCommand) => {
      if (!editor) return;

      const content = editor.getText();
      const { from } = editor.state.selection;

      switch (command.action) {
        case "generate":
        case "expand":
        case "outline":
        case "counter":
        case "evidence":
        case "transition":
        case "abstract": {
          setActiveWritingMode("compose");
          setIsAIStreaming(true);

          const prompts: Record<string, string> = {
            generate:
              "Generate the next section in an academic tone while maintaining manuscript consistency.",
            expand:
              "Expand the current section with richer detail, references, and methodological precision.",
            outline:
              "Generate an outline for the next section with clear subsection suggestions.",
            counter:
              "Produce a rigorous counter-argument to the current thesis section.",
            evidence:
              "Surface supporting evidence suggestions for the current claims.",
            transition:
              "Write a transition that links the current section to the next one naturally.",
            abstract:
              "Draft a concise, publication-ready abstract based on the manuscript.",
          };

          let accumulated = "";
          addAIMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            model: "mercury-2",
            timestamp: new Date().toISOString(),
            isStreaming: true,
          });

          await streamChatCompletion(
            [
              {
                role: "user",
                content: `${prompts[command.action]}\n\nCurrent manuscript context:\n${content}`,
              },
            ],
            {
              onChunk: (text) => {
                accumulated += text;
                updateLastAIMessage(accumulated);
              },
              onDone: () => {
                setIsAIStreaming(false);
                setActiveWritingMode(null);
                if (accumulated.trim()) {
                  editor.chain().focus().setTextSelection(from).insertContent(accumulated).run();
                }
              },
              onError: () => {
                setIsAIStreaming(false);
                setActiveWritingMode(null);
              },
            }
          );
          break;
        }

        case "simplify":
        case "academic": {
          const { from: selFrom, to: selTo } = editor.state.selection;
          let target = "";
          let range: { from: number; to: number } | null = null;

          if (selFrom !== selTo) {
            target = editor.state.doc.textBetween(selFrom, selTo, " ");
            range = { from: selFrom, to: selTo };
          } else {
            const $pos = editor.state.doc.resolve(selFrom);
            const paragraphStart = $pos.start($pos.depth);
            const paragraphEnd = $pos.end($pos.depth);
            target = editor.state.doc.textBetween(paragraphStart, paragraphEnd, " ");
            range = { from: paragraphStart, to: paragraphEnd };
          }

          if (!range || !target.trim()) return;

          setActiveWritingMode("quick-edit");
          setIsAIStreaming(true);

          const instruction =
            command.action === "simplify"
              ? "Simplify this passage while preserving argument quality and factual meaning."
              : "Rewrite this passage in formal academic register while preserving intent and claims.";

          try {
            const result = await applyEdit(target, instruction);
            editor.chain().focus().deleteRange(range).insertContentAt(range.from, result).run();
          } catch {
            // Keep editor stable if request fails.
          }

          setIsAIStreaming(false);
          setActiveWritingMode(null);
          break;
        }

        case "cite": {
          const state = useEditorStore.getState();
          state.setAIPanelMode("citations");
          if (!state.aiPanelOpen) {
            state.toggleAIPanel();
          }
          break;
        }

        default:
          break;
      }
    },
    [
      editor,
      setActiveWritingMode,
      setIsAIStreaming,
      addAIMessage,
      updateLastAIMessage,
    ]
  );

  if (!editor) return null;

  return (
    <section className="editor-scroll-area relative flex min-w-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-[1080px] px-4 pb-8 pt-8 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white/86 px-4 py-3 shadow-sm backdrop-blur">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink-800">
            <BookOpenText className="h-4 w-4 text-brand-600" />
            {currentPaper?.title ?? "Untitled Paper"}
          </p>
          <p className="inline-flex items-center gap-2 text-xs text-ink-600">
            <Sparkles className="h-3.5 w-3.5 text-mercury-600" />
            Type <span className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[11px]">/</span> for command palette
          </p>
        </div>

        <div className="relative rounded-[26px] border border-ink-200 bg-white px-6 py-8 shadow-lg lg:px-12 lg:py-10">
          <EditorContent editor={editor} />
          <SlashCommandMenu editor={editor} onCommand={handleSlashCommand} />
        </div>
      </div>

      <footer className="sticky bottom-0 border-t border-ink-200/70 bg-white/88 px-4 py-2 backdrop-blur lg:px-8">
        <div className="mx-auto flex w-full max-w-[1080px] items-center justify-end">
          <p className="text-[11px] text-ink-500 tabular-nums">
            {editor.storage.characterCount.words().toLocaleString()} words / {" "}
            {editor.storage.characterCount.characters().toLocaleString()} characters
          </p>
        </div>
      </footer>
    </section>
  );
}
