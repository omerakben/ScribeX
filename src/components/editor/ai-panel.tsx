"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  BookOpen,
  ChevronRight,
  ClipboardCheck,
  Copy,
  ListTree,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { markdownToHtml } from "@/lib/utils/markdown-to-html";
import { parseChangeBlocks, hasChangeBlocks } from "@/lib/utils/change-block-parser";
import { streamChatCompletion, structuredChatCompletion } from "@/lib/mercury/client";
import { ChangeDiffCard } from "@/components/editor/change-diff-card";
import { CHAT_SYSTEM_PROMPT } from "@/lib/prompts/assistant/chat";
import { useEditorStore } from "@/lib/store/editor-store";
import {
  getCitationEntityId,
  isNumericCitationStyle,
  normalizeCitationStyleSelection,
  REVIEW_JSON_SCHEMA,
} from "@/lib/constants";
import { CitationSearch } from "@/components/editor/citation-search";
import type { AIMessage, AIPanelMode, Citation } from "@/lib/types";
import type { Editor } from "@tiptap/react";

interface AIPanelProps {
  editor: Editor | null;
}

const TABS: { mode: AIPanelMode; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { mode: "chat", label: "Chat", Icon: MessageSquare },
  { mode: "review", label: "Review", Icon: ClipboardCheck },
  { mode: "citations", label: "Citations", Icon: BookOpen },
  { mode: "outline", label: "Outline", Icon: ListTree },
];

function formatCitationAuthors(citation: Citation): string {
  const authors = citation.authors;
  if (authors.length === 0) return "Unknown";
  if (authors.length === 1) return authors[0].name;
  if (authors.length === 2) return `${authors[0].name} & ${authors[1].name}`;
  return `${authors[0].name} et al.`;
}

function getHighestCitationIndex(editor: Editor | null): number {
  if (!editor) return 0;

  let maxIndex = 0;

  const text = editor.getText();
  const bracketMatches = text.matchAll(/\[(\d+)\]/g);
  for (const match of bracketMatches) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) maxIndex = Math.max(maxIndex, value);
  }

  const html = editor.getHTML();
  const superscriptMatches = html.matchAll(/<sup>(\d+)<\/sup>/g);
  for (const match of superscriptMatches) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) maxIndex = Math.max(maxIndex, value);
  }

  return maxIndex;
}

// ─── Chat Tab ──────────────────────────────────────────────────

function ChatTab({ editor }: { editor: Editor | null }) {
  const aiMessages = useEditorStore((s) => s.aiMessages);
  const isStreaming = useEditorStore((s) => s.isAIStreaming);
  const addAIMessage = useEditorStore((s) => s.addAIMessage);
  const updateLastAIMessage = useEditorStore((s) => s.updateLastAIMessage);
  const setIsAIStreaming = useEditorStore((s) => s.setIsAIStreaming);
  const clearAIMessages = useEditorStore((s) => s.clearAIMessages);
  const reasoningEffort = useEditorStore((s) => s.reasoningEffort);

  const [input, setInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const handleInsertAtCursor = useCallback(
    (content: string) => {
      if (!editor) return;
      editor.chain().focus().insertContent(markdownToHtml(content)).run();
    },
    [editor]
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const editorContent = editor?.getText() ?? "";

    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    addAIMessage(userMessage);

    const assistantMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      model: "mercury-2",
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    addAIMessage(assistantMessage);

    setInput("");
    setIsAIStreaming(true);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = "";

    const contextMessages = [
      ...aiMessages
        .filter((message) => !message.isStreaming)
        .map((message) => ({
          role: message.role as "user" | "assistant",
          content: message.content,
        })),
      {
        role: "user" as const,
        content: editorContent
          ? CHAT_SYSTEM_PROMPT.replace("{{context}}", `[Current manuscript]\n${editorContent}`) + `\n\n[Prompt]\n${trimmed}`
          : trimmed,
      },
    ];

    await streamChatCompletion(contextMessages, {
      reasoningEffort,
      onChunk: (chunk) => {
        accumulated += chunk;
        updateLastAIMessage(accumulated);
      },
      onDone: () => {
        updateLastAIMessage(accumulated, false);
        setIsAIStreaming(false);
      },
      onError: (error) => {
        updateLastAIMessage(accumulated || `Error: ${error.message}`, false);
        setIsAIStreaming(false);
      },
      signal: controller.signal,
    });
  }, [
    input,
    isStreaming,
    editor,
    aiMessages,
    reasoningEffort,
    addAIMessage,
    updateLastAIMessage,
    setIsAIStreaming,
  ]);

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {aiMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageSquare className="w-8 h-8 text-ink-300 mb-3" />
            <p className="text-sm text-ink-500">Ask about your manuscript</p>
            <p className="mt-1 text-xs text-ink-400">
              Get drafting help, feedback, and suggestions.
            </p>
          </div>
        ) : (
          aiMessages.map((message) => (
            <article
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div className="flex flex-col max-w-[85%]">
                {message.role === "assistant" &&
                message.content &&
                !message.isStreaming &&
                hasChangeBlocks(message.content) ? (
                  <div className="space-y-2">
                    {parseChangeBlocks(message.content).map((block, blockIndex) => {
                      if (block.type === "text" && block.content.trim()) {
                        return (
                          <div
                            key={`text-${blockIndex}`}
                            className="whitespace-pre-wrap text-sm bg-ink-50 text-ink-700 rounded-2xl rounded-bl-md px-4 py-2.5 leading-relaxed"
                          >
                            {block.content.trim()}
                          </div>
                        );
                      }
                      if (block.type === "change") {
                        return (
                          <ChangeDiffCard
                            key={`change-${blockIndex}`}
                            change={block}
                            editor={editor}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "whitespace-pre-wrap text-sm",
                      message.role === "user"
                        ? "bg-brand-600 text-white rounded-2xl rounded-br-md px-4 py-2.5"
                        : "bg-ink-50 text-ink-700 rounded-2xl rounded-bl-md px-4 py-2.5 leading-relaxed"
                    )}
                  >
                    {message.content || (
                      <span className="inline-flex items-center gap-1.5 text-ink-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Thinking
                      </span>
                    )}
                  </div>
                )}

                {/* Action buttons for completed assistant messages */}
                {message.role === "assistant" && message.content && !message.isStreaming && (
                  <div className="flex items-center gap-3 mt-1.5 ml-1">
                    <button
                      type="button"
                      onClick={() => handleInsertAtCursor(message.content)}
                      className="inline-flex items-center gap-1 text-xs text-ink-400 hover:text-brand-600 transition-colors"
                      title="Insert at cursor position in editor"
                    >
                      <ArrowDownToLine className="h-3 w-3" />
                      Insert
                    </button>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(message.content)}
                      className="inline-flex items-center gap-1 text-xs text-ink-400 hover:text-ink-600 transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                )}
              </div>
            </article>
          ))
        )}
        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-ink-100 p-3">
        {aiMessages.length > 0 ? (
          <div className="flex justify-end mb-2">
            <button
              type="button"
              onClick={clearAIMessages}
              disabled={isStreaming}
              className="text-xs text-ink-400 hover:text-ink-600 transition-colors disabled:opacity-40"
            >
              Clear chat
            </button>
          </div>
        ) : null}

        <div className="relative">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your paper..."
            className="w-full border border-ink-200 rounded-lg px-3 py-2 pr-10 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-ink-400 min-h-[40px] max-h-[120px] text-ink-900"
            style={{ minHeight: "40px" }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            aria-label="Send message"
            className="absolute bottom-2 right-2 w-7 h-7 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 flex items-center justify-center transition-colors"
          >
            {isStreaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Review Tab ────────────────────────────────────────────────

interface ReviewCategory {
  label: string;
  score: number;
  feedback: string;
}

function ReviewTab({ editor }: { editor: Editor | null }) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [results, setResults] = useState<ReviewCategory[]>([]);
  const setActiveWritingMode = useEditorStore((s) => s.setActiveWritingMode);
  const setIsAIStreaming = useEditorStore((s) => s.setIsAIStreaming);
  const reasoningEffort = useEditorStore((s) => s.reasoningEffort);

  const runReview = useCallback(async () => {
    if (!editor) return;

    const content = editor.getText();
    if (!content.trim()) return;

    setIsReviewing(true);
    setActiveWritingMode("review");
    setIsAIStreaming(true);

    try {
      const response = await structuredChatCompletion<{ categories: ReviewCategory[] }>(
        [
          {
            role: "user",
            content: `Review this academic manuscript. Score each category 1-10 and provide 2-3 sentences of actionable feedback.\n\nManuscript:\n${content}`,
          },
        ],
        REVIEW_JSON_SCHEMA,
        { reasoningEffort }
      );
      setResults(response.categories);
    } catch {
      setResults([
        {
          label: "Request Error",
          score: 0,
          feedback: "Review request failed. Please try again.",
        },
      ]);
    } finally {
      setIsReviewing(false);
      setIsAIStreaming(false);
      setActiveWritingMode(null);
    }
  }, [editor, reasoningEffort, setActiveWritingMode, setIsAIStreaming]);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-600";
    if (score >= 5) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Run review button */}
      <div className="p-4 border-b border-ink-100">
        <button
          type="button"
          onClick={runReview}
          disabled={isReviewing}
          className="w-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-60 rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isReviewing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Reviewing manuscript
            </>
          ) : (
            <>
              <ClipboardCheck className="h-4 w-4" />
              Run Review
            </>
          )}
        </button>
      </div>

      {/* Results area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {results.length === 0 && !isReviewing ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-ink-500">
              Run a review to get feedback on your manuscript
            </p>
          </div>
        ) : null}

        {results.map((result) => (
          <article key={result.label} className="bg-ink-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium text-ink-900">{result.label}</p>
              {result.score > 0 ? (
                <p className={cn("text-sm font-semibold tabular-nums", getScoreColor(result.score))}>
                  {result.score}/10
                </p>
              ) : null}
            </div>
            <p className="text-sm text-ink-600 leading-relaxed">{result.feedback}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

// ─── Outline Tab ───────────────────────────────────────────────

interface HeadingItem {
  level: number;
  text: string;
  pos: number;
}

function OutlineTab({ editor }: { editor: Editor | null }) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  useEffect(() => {
    if (!editor) return;

    const extract = () => {
      const items: HeadingItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          items.push({
            level: node.attrs.level as number,
            text: node.textContent,
            pos,
          });
        }
      });
      setHeadings(items);
    };

    extract();
    editor.on("update", extract);

    return () => {
      editor.off("update", extract);
    };
  }, [editor]);

  const jumpTo = (pos: number) => {
    if (!editor) return;

    editor.chain().focus().setTextSelection(pos).run();
    const dom = editor.view.domAtPos(pos).node as Element;
    dom?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="p-4 flex-1 overflow-y-auto">
      {headings.length === 0 ? (
        <div className="flex h-full items-center justify-center text-center">
          <p className="text-sm text-ink-500">Add headings to see your outline</p>
        </div>
      ) : (
        <nav className="space-y-1" aria-label="Document outline">
          {headings.map((heading, index) => (
            <button
              key={`${heading.pos}-${index}`}
              type="button"
              onClick={() => jumpTo(heading.pos)}
              className={cn(
                "w-full text-left rounded-md transition-colors",
                heading.level === 1 &&
                  "text-sm font-medium text-ink-900 pl-0 py-1.5 hover:text-brand-600 hover:bg-ink-50 px-2",
                heading.level === 2 &&
                  "text-sm text-ink-700 pl-4 py-1 hover:text-brand-600 hover:bg-ink-50 px-2",
                heading.level === 3 &&
                  "text-sm text-ink-500 pl-8 py-1 hover:text-brand-600 hover:bg-ink-50 px-2"
              )}
            >
              <span className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-ink-400" />
                <span className="truncate">{heading.text || "Untitled section"}</span>
              </span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────

export function AIPanel({ editor }: AIPanelProps) {
  const aiPanelOpen = useEditorStore((s) => s.aiPanelOpen);
  const aiPanelMode = useEditorStore((s) => s.aiPanelMode);
  const setAIPanelMode = useEditorStore((s) => s.setAIPanelMode);
  const currentPaper = useEditorStore((s) => s.currentPaper);
  const papers = useEditorStore((s) => s.papers);
  const setPapers = useEditorStore((s) => s.setPapers);
  const setCurrentPaper = useEditorStore((s) => s.setCurrentPaper);
  const citationIndexMapRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    citationIndexMapRef.current.clear();
  }, [currentPaper?.id]);

  const upsertCitationReference = useCallback(
    (citation: Citation): number | undefined => {
      if (!currentPaper) return undefined;

      const references = currentPaper.references ?? [];
      const citationId = getCitationEntityId(citation);
      const existingIndex = references.findIndex(
        (entry) => getCitationEntityId(entry) === citationId
      );

      if (existingIndex >= 0) return existingIndex + 1;

      const nextReferences = [...references, citation];
      const now = new Date().toISOString();
      const updatedPaper = {
        ...currentPaper,
        references: nextReferences,
        updatedAt: now,
      };

      setCurrentPaper(updatedPaper);
      setPapers(
        papers.some((entry) => entry.id === updatedPaper.id)
          ? papers.map((entry) => (entry.id === updatedPaper.id ? updatedPaper : entry))
          : [...papers, updatedPaper]
      );
      return nextReferences.length;
    },
    [currentPaper, papers, setCurrentPaper, setPapers]
  );

  const handleInsertCitation = useCallback(
    (citation: Citation) => {
      if (!editor) return;

      const style = normalizeCitationStyleSelection(currentPaper?.citationStyle);
      const referenceIndex = upsertCitationReference(citation);

      if (isNumericCitationStyle(style)) {
        const citationId = getCitationEntityId(citation);
        let index = referenceIndex ?? citationIndexMapRef.current.get(citationId);

        if (!index) {
          const mappedMax = Math.max(...Array.from(citationIndexMapRef.current.values()), 0);
          const docMax = getHighestCitationIndex(editor);
          index = Math.max(mappedMax, docMax) + 1;
        }
        citationIndexMapRef.current.set(citationId, index);

        const marker =
          style.id === "chicago-17" && style.chicagoVariant === "notes-bibliography"
            ? `<sup>${index}</sup>`
            : `[${index}]`;
        editor.chain().focus().insertContent(marker).run();
        return;
      }

      const authorText = formatCitationAuthors(citation);
      const yearText = citation.year ? String(citation.year) : "n.d.";
      const marker =
        style.id === "mla-9"
          ? `(${authorText})`
          : style.id === "chicago-17" && style.chicagoVariant === "author-date"
          ? `(${authorText} ${yearText})`
          : `(${authorText}, ${yearText})`;

      editor.chain().focus().insertContent(marker).run();
    },
    [currentPaper?.citationStyle, editor, upsertCitationReference]
  );

  if (!aiPanelOpen) return null;

  return (
    <aside
      className="w-[400px] border-l border-ink-200 bg-white flex flex-col h-full shrink-0"
      aria-label="AI panel"
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-brand-600 flex items-center justify-center">
            <MessageSquare className="h-3 w-3 text-white" />
          </div>
          <span className="text-sm font-semibold text-ink-900">AI Assistant</span>
        </div>
        <div className="flex items-center gap-0.5">
          {TABS.map(({ mode, label, Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setAIPanelMode(mode)}
              title={label}
              aria-label={label}
              className={cn(
                "h-7 w-7 flex items-center justify-center rounded-md transition-colors",
                aiPanelMode === mode
                  ? "bg-brand-50 text-brand-600"
                  : "text-ink-400 hover:text-ink-600 hover:bg-ink-50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>
      {/* Active tab label */}
      <div className="px-4 py-2 bg-ink-50 border-b border-ink-100 shrink-0">
        <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">
          {TABS.find(t => t.mode === aiPanelMode)?.label}
        </span>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {aiPanelMode === "chat" && <ChatTab editor={editor} />}
        {aiPanelMode === "review" && <ReviewTab editor={editor} />}
        {aiPanelMode === "citations" && (
          <div className="p-4 flex flex-col h-full">
            <CitationSearch
              styleId={normalizeCitationStyleSelection(currentPaper?.citationStyle).id}
              onInsert={handleInsertCitation}
            />
          </div>
        )}
        {aiPanelMode === "outline" && <OutlineTab editor={editor} />}
      </div>
    </aside>
  );
}
