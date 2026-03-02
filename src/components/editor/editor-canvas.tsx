"use client";

import "katex/dist/katex.min.css";
import { useCallback, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import Heading from "@tiptap/extension-heading";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Mathematics } from "@tiptap/extension-mathematics";
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
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import { applyEdit, streamChatCompletion } from "@/lib/mercury/client";
import { routePrompt } from "@/lib/prompts/router";
import { getCommandPrompt } from "@/lib/prompts";
import { getTemperature } from "@/lib/constants/temperatures";
import { markdownToHtml } from "@/lib/utils/markdown-to-html";
import { GhostText } from "@/lib/extensions/ghost-text";
import { MermaidBlock } from "@/lib/extensions/mermaid-block";
import { AIKeyboardShortcuts } from "@/lib/extensions/keyboard-shortcuts";
import { useEditorStore } from "@/lib/store/editor-store";
import { DiffusionOverlay } from "@/components/editor/diffusion-overlay";
import { FloatingMenu } from "@/components/editor/floating-menu";
import { ReadabilityBadge } from "@/components/editor/readability-badge";
import { DocumentStats } from "@/components/editor/document-stats";
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
  const autocompleteEnabled = useEditorStore((s) => s.autocompleteEnabled);
  const setActiveWritingMode = useEditorStore((s) => s.setActiveWritingMode);
  const setIsAIStreaming = useEditorStore((s) => s.setIsAIStreaming);
  const addAIMessage = useEditorStore((s) => s.addAIMessage);
  const updateLastAIMessage = useEditorStore((s) => s.updateLastAIMessage);

  const reportedEditorRef = useRef<Editor | null>(null);
  const hydratedPaperRef = useRef<string | null>(null);
  const contentReadyRef = useRef(false);

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
      Superscript,
      Subscript,
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
      MermaidBlock,
      CharacterCount,
      Color,
      TextStyle,
      Mathematics.configure({
        katexOptions: { throwOnError: false, strict: false },
      }),
      GhostText.configure({ enabled: autocompleteEnabled }),
      AIKeyboardShortcuts,
    ],
    content: currentPaper?.content || "",
    editorProps: {
      attributes: {
        class: "tiptap",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor }) => {
      if (!contentReadyRef.current) return;
      setIsDirty(true);
      setWordCount(editor.storage.characterCount.words());
    },
  });

  // Hydrate editor content when the persisted paper loads (TipTap only reads
  // `content` at creation time, so we must push it in after hydration).
  useEffect(() => {
    if (!editor || !currentPaper) return;

    // Only set content once per paper id (avoid clobbering in-progress edits)
    if (hydratedPaperRef.current === currentPaper.id) return;
    hydratedPaperRef.current = currentPaper.id;

    if (currentPaper.content) {
      editor.commands.setContent(currentPaper.content, { emitUpdate: false });
    }
    contentReadyRef.current = true;
    setWordCount(editor.storage.characterCount.words());
  }, [editor, currentPaper, setWordCount]);

  // Notify parent when editor instance changes (handles HMR recreation)
  useEffect(() => {
    if (!editor || reportedEditorRef.current === editor) return;
    reportedEditorRef.current = editor;
    onEditorReady(editor);
    setWordCount(editor.storage.characterCount.words());
  }, [editor, onEditorReady, setWordCount]);

  // Sync autocomplete toggle with the GhostText extension options
  useEffect(() => {
    if (!editor) return;

    const ghostTextExt = editor.extensionManager.extensions.find(
      (ext) => ext.name === "ghostText"
    );
    if (ghostTextExt) {
      ghostTextExt.options.enabled = autocompleteEnabled;
    }
  }, [editor, autocompleteEnabled]);

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
        case "abstract":
        case "diffuse": {
          const state = useEditorStore.getState();
          const useDiffusion = command.action === "diffuse" || state.diffusionEnabled;
          setActiveWritingMode(useDiffusion ? "diffusion-draft" : "compose");
          setIsAIStreaming(true);
          const reasoningEffort = state.reasoningEffort;

          // Route through prompt system (handles truncation + selection markers)
          const routed = routePrompt({
            action: command.action,
            selectedText: "",
            documentText: content,
            selectionStart: from,
            selectionEnd: from,
          });
          const userPrompt = routed?.prompt ?? getCommandPrompt(command.action, { context: content }) ?? content;

          if (useDiffusion) {
            // Diffusion mode: text denoises from noise → clarity via replacement semantics
            state.setIsDiffusing(true);
            state.setDiffusionStep(0);
            state.setDiffusionContent("");

            let finalText = "";

            await streamChatCompletion(
              [{ role: "user", content: userPrompt }],
              {
                reasoningEffort,
                temperature: getTemperature(command.action),
                diffusing: true,
                onChunk: () => {},
                onDiffusionStep: (fullText, step) => {
                  finalText = fullText;
                  state.setDiffusionContent(fullText);
                  state.setDiffusionStep(step);
                },
                onDone: () => {
                  setIsAIStreaming(false);
                  setActiveWritingMode(null);
                  if (finalText.trim()) {
                    editor.chain().focus().setTextSelection(from).insertContent(markdownToHtml(finalText)).run();
                  }
                  // Brief delay so user sees the final clear text before overlay dismisses
                  setTimeout(() => state.resetDiffusion(), 400);
                },
                onError: () => {
                  setIsAIStreaming(false);
                  setActiveWritingMode(null);
                  state.resetDiffusion();
                },
              }
            );
          } else {
            // Standard autoregressive streaming mode
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
              [{ role: "user", content: userPrompt }],
              {
                reasoningEffort,
                temperature: getTemperature(command.action),
                onChunk: (text) => {
                  accumulated += text;
                  updateLastAIMessage(accumulated);
                },
                onDone: () => {
                  updateLastAIMessage(accumulated, false);
                  setIsAIStreaming(false);
                  setActiveWritingMode(null);
                  if (accumulated.trim()) {
                    editor.chain().focus().setTextSelection(from).insertContent(markdownToHtml(accumulated)).run();
                  }
                },
                onError: () => {
                  updateLastAIMessage(accumulated, false);
                  setIsAIStreaming(false);
                  setActiveWritingMode(null);
                },
              }
            );
          }
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

          // Get instruction from prompt system (falls back to raw prompt if no vars needed)
          const instruction = getCommandPrompt(command.action) ?? target;

          try {
            const result = await applyEdit(target, instruction);
            editor.chain().focus().deleteRange(range).insertContentAt(range.from, markdownToHtml(result)).run();
          } catch {
            // Keep editor stable if request fails.
          }

          setIsAIStreaming(false);
          setActiveWritingMode(null);
          break;
        }

        case "rewrite": {
          const { from: rwFrom, to: rwTo } = editor.state.selection;
          let rwTarget = "";
          let rwRange: { from: number; to: number } | null = null;

          if (rwFrom !== rwTo) {
            rwTarget = editor.state.doc.textBetween(rwFrom, rwTo, " ");
            rwRange = { from: rwFrom, to: rwTo };
          } else {
            const $pos = editor.state.doc.resolve(rwFrom);
            const pStart = $pos.start($pos.depth);
            const pEnd = $pos.end($pos.depth);
            rwTarget = editor.state.doc.textBetween(pStart, pEnd, " ");
            rwRange = { from: pStart, to: pEnd };
          }

          if (!rwRange || !rwTarget.trim()) return;

          setActiveWritingMode("deep-rewrite");
          setIsAIStreaming(true);

          let rwAccumulated = "";
          addAIMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            model: "mercury-2",
            timestamp: new Date().toISOString(),
            isStreaming: true,
          });

          const fullContext = editor.getText();
          const rwEffort = useEditorStore.getState().reasoningEffort ?? "high";

          // Route through prompt system (handles truncation + selection markers)
          const rwRouted = routePrompt({
            action: "rewrite",
            selectedText: rwTarget,
            documentText: fullContext,
            selectionStart: rwRange.from,
            selectionEnd: rwRange.to,
          });
          const rwPrompt = rwRouted?.prompt ?? getCommandPrompt("rewrite", { context: rwTarget }) ?? rwTarget;

          await streamChatCompletion(
            [{ role: "user", content: rwPrompt }],
            {
              reasoningEffort: rwEffort === "instant" || rwEffort === "low" ? "high" : rwEffort,
              temperature: getTemperature("rewrite"),
              onChunk: (text) => {
                rwAccumulated += text;
                updateLastAIMessage(rwAccumulated);
              },
              onDone: () => {
                updateLastAIMessage(rwAccumulated, false);
                setIsAIStreaming(false);
                setActiveWritingMode(null);
                if (rwAccumulated.trim() && rwRange) {
                  editor.chain().focus().deleteRange(rwRange).insertContentAt(rwRange.from, markdownToHtml(rwAccumulated)).run();
                }
              },
              onError: () => {
                updateLastAIMessage(rwAccumulated, false);
                setIsAIStreaming(false);
                setActiveWritingMode(null);
              },
            }
          );
          break;
        }

        case "summarize": {
          const { from: sumFrom, to: sumTo } = editor.state.selection;
          const textToSummarize = sumFrom !== sumTo
            ? editor.state.doc.textBetween(sumFrom, sumTo, " ")
            : editor.getText();

          if (!textToSummarize.trim()) return;

          setActiveWritingMode("review");
          setIsAIStreaming(true);

          const sumPrompt = getCommandPrompt("summarize", { text: textToSummarize }) ?? textToSummarize;

          let sumAccumulated = "";
          addAIMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            model: "mercury-2",
            timestamp: new Date().toISOString(),
            isStreaming: true,
          });

          await streamChatCompletion(
            [{ role: "user", content: sumPrompt }],
            {
              reasoningEffort: useEditorStore.getState().reasoningEffort,
              temperature: getTemperature("summarize"),
              onChunk: (text) => {
                sumAccumulated += text;
                updateLastAIMessage(sumAccumulated);
              },
              onDone: () => {
                updateLastAIMessage(sumAccumulated, false);
                setIsAIStreaming(false);
                setActiveWritingMode(null);
              },
              onError: () => {
                updateLastAIMessage(sumAccumulated, false);
                setIsAIStreaming(false);
                setActiveWritingMode(null);
              },
            }
          );
          break;
        }

        case "continue": {
          const { from: contFrom } = editor.state.selection;
          const doc = editor.state.doc;

          // Extract text before and after the cursor position
          const textBefore = doc.textBetween(0, contFrom, "\n").trimEnd();
          const textAfter = doc.textBetween(contFrom, doc.content.size, "\n").trimStart();

          if (!textBefore.trim()) return;

          setActiveWritingMode("compose");
          setIsAIStreaming(true);

          const contPrompt = getCommandPrompt("continue", { textBefore, textAfter }) ?? textBefore;
          const reasoningEffort = useEditorStore.getState().reasoningEffort;

          let contAccumulated = "";
          addAIMessage({
            id: crypto.randomUUID(),
            role: "assistant",
            content: "",
            model: "mercury-2",
            timestamp: new Date().toISOString(),
            isStreaming: true,
          });

          await streamChatCompletion(
            [{ role: "user", content: contPrompt }],
            {
              reasoningEffort,
              temperature: getTemperature("continue"),
              onChunk: (text) => {
                contAccumulated += text;
                updateLastAIMessage(contAccumulated);
              },
              onDone: () => {
                updateLastAIMessage(contAccumulated, false);
                setIsAIStreaming(false);
                setActiveWritingMode(null);
                if (contAccumulated.trim()) {
                  editor.chain().focus().setTextSelection(contFrom).insertContent(markdownToHtml(contAccumulated)).run();
                }
              },
              onError: () => {
                updateLastAIMessage(contAccumulated, false);
                setIsAIStreaming(false);
                setActiveWritingMode(null);
              },
            }
          );
          break;
        }

        case "mermaid": {
          editor.chain().focus().insertContent({
            type: "mermaidBlock",
            attrs: { content: "graph TD\n  A[Start] --> B[Process]\n  B --> C[End]" },
          }).run();
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
    <section className="editor-scroll-area relative flex min-w-0 flex-1 flex-col overflow-y-auto bg-ink-50">
      <div className="mx-auto w-full max-w-[860px] px-8 pb-16 pt-12">
        <div
          className="flex min-h-[calc(100vh-6rem)] flex-col bg-white px-12 py-12"
          onClick={(e) => {
            // Click on empty paper area focuses editor at the end
            if (editor && e.target === e.currentTarget) {
              editor.chain().focus("end").run();
            }
          }}
        >
          <EditorContent editor={editor} className="tiptap-wrapper" />
          <SlashCommandMenu editor={editor} onCommand={handleSlashCommand} />
          <FloatingMenu editor={editor} />
          <DiffusionOverlay />
        </div>
      </div>

      <footer className="sticky bottom-0 bg-white border-t border-ink-200 px-4 pb-2 pt-1.5">
        <div className="flex items-center justify-end gap-3 pr-4">
          <p className="text-xs text-ink-400">
            {editor.storage.characterCount.words().toLocaleString()} words &nbsp;&middot;&nbsp;{" "}
            {editor.storage.characterCount.characters().toLocaleString()} characters
          </p>
          <DocumentStats editor={editor} />
          <ReadabilityBadge editor={editor} />
        </div>
      </footer>
    </section>
  );
}
