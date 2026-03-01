import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AIMessage,
  AIPanelMode,
  CitationStyleSelection,
  Paper,
  PaperTemplate,
  ReasoningEffort,
  WritingMode,
} from "@/lib/types";
import {
  DEFAULT_CITATION_STYLE_SELECTION,
  normalizeCitationStyleSelection,
} from "@/lib/constants";
import { STORAGE_KEYS, STORAGE_VERSION } from "@/lib/storage";
import { djb2Hash } from "@/lib/utils/content-hash";
import { structuredChatCompletion } from "@/lib/mercury/client";
import { getTemperature } from "@/lib/constants/temperatures";
import { interpolate, getRawGenerateNamePrompt } from "@/lib/prompts/loader";

const normalizePaperCitationStyle = (paper: Paper): Paper => ({
  ...paper,
  citationStyle: normalizeCitationStyleSelection(paper.citationStyle),
  references: paper.references ?? [],
});

// ─── Editor Store ──────────────────────────────────────────────

interface EditorState {
  // Document
  currentPaper: Paper | null;
  papers: Paper[];
  isDirty: boolean;

  // AI Panel
  aiPanelOpen: boolean;
  aiPanelMode: AIPanelMode;
  /** Per-paper chat histories keyed by paper ID. */
  chatHistories: Record<string, AIMessage[]>;
  /** Computed getter — returns messages for the current paper. */
  getCurrentMessages: () => AIMessage[];
  isAIStreaming: boolean;

  // Writing mode
  activeWritingMode: WritingMode | null;
  selectedText: string;
  selectionRange: { from: number; to: number } | null;

  // Autocomplete
  ghostText: string;
  showGhostText: boolean;
  autocompleteEnabled: boolean;

  // Diffusion
  isDiffusing: boolean;
  diffusionStep: number;
  diffusionContent: string;
  diffusionEnabled: boolean;

  // Reasoning
  reasoningEffort: ReasoningEffort;

  // Prompt history (persisted)
  promptHistory: string[];

  // UI
  wordCount: number;
  isSaving: boolean;
  isExporting: boolean;
  darkMode: boolean;

  // Transient (not persisted)
  contentHashes: Record<string, number>;
  promptHistoryIndex: number;
  /** Tracks which paper IDs have already been auto-named (transient, not persisted). */
  autoNamedPapers: Record<string, boolean>;

  // Actions
  setCurrentPaper: (paper: Paper | null) => void;
  setPapers: (papers: Paper[]) => void;
  setIsDirty: (dirty: boolean) => void;
  toggleAIPanel: () => void;
  setAIPanelMode: (mode: AIPanelMode) => void;
  addAIMessage: (message: AIMessage) => void;
  updateLastAIMessage: (content: string, isStreaming?: boolean) => void;
  clearAIMessages: () => void;
  /** Remove chat histories for papers that no longer exist (housekeeping). */
  pruneOrphanedChatHistories: () => void;
  setIsAIStreaming: (streaming: boolean) => void;
  setActiveWritingMode: (mode: WritingMode | null) => void;
  setSelectedText: (text: string, range?: { from: number; to: number }) => void;
  setGhostText: (text: string) => void;
  setShowGhostText: (show: boolean) => void;
  setAutocompleteEnabled: (enabled: boolean) => void;
  setIsDiffusing: (diffusing: boolean) => void;
  setDiffusionStep: (step: number) => void;
  setDiffusionContent: (content: string) => void;
  setDiffusionEnabled: (enabled: boolean) => void;
  resetDiffusion: () => void;
  setReasoningEffort: (effort: ReasoningEffort) => void;
  setWordCount: (count: number) => void;
  setIsSaving: (saving: boolean) => void;
  setIsExporting: (exporting: boolean) => void;
  toggleDarkMode: () => void;
  addPromptToHistory: (prompt: string) => void;
  setPromptHistoryIndex: (index: number) => void;
  resetPromptHistoryIndex: () => void;

  // Persistence-aware actions
  savePaper: (id: string, updates: Partial<Omit<Paper, "id">>) => void;
  deletePaper: (id: string) => void;
  updatePaperContent: (id: string, content: string, wordCount: number) => void;
  /** Updates the paper title and marks the paper as auto-named. */
  autoNamePaper: (id: string, name: string) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      // Document
      currentPaper: null,
      papers: [],
      isDirty: false,

      // AI Panel
      aiPanelOpen: true,
      aiPanelMode: "chat",
      chatHistories: {},
      getCurrentMessages: () => {
        const { chatHistories, currentPaper } = get();
        return currentPaper ? (chatHistories[currentPaper.id] ?? []) : [];
      },
      isAIStreaming: false,

      // Writing mode
      activeWritingMode: null,
      selectedText: "",
      selectionRange: null,

      // Autocomplete
      ghostText: "",
      showGhostText: false,
      autocompleteEnabled: true,

      // Diffusion
      isDiffusing: false,
      diffusionStep: 0,
      diffusionContent: "",
      diffusionEnabled: false,

      // Reasoning
      reasoningEffort: "medium",

      // UI
      wordCount: 0,
      isSaving: false,
      isExporting: false,
      darkMode: false,

      // Prompt history (persisted)
      promptHistory: [],

      // Transient (not persisted)
      contentHashes: {},
      promptHistoryIndex: -1,
      autoNamedPapers: {},

      // Actions
      setCurrentPaper: (paper) =>
        set({ currentPaper: paper ? normalizePaperCitationStyle(paper) : null, isDirty: false }),
      setPapers: (papers) => set({ papers: papers.map(normalizePaperCitationStyle) }),
      setIsDirty: (isDirty) => set({ isDirty }),
      toggleAIPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
      setAIPanelMode: (aiPanelMode) => set({ aiPanelMode }),
      addAIMessage: (message) =>
        set((s) => {
          const paperId = s.currentPaper?.id;
          if (!paperId) return {};
          const existing = s.chatHistories[paperId] ?? [];
          // Trim to max 100 messages per paper, removing oldest first
          const next = [...existing, message].slice(-100);
          return { chatHistories: { ...s.chatHistories, [paperId]: next } };
        }),
      updateLastAIMessage: (content, isStreaming) =>
        set((s) => {
          const paperId = s.currentPaper?.id;
          if (!paperId) return {};
          const msgs = [...(s.chatHistories[paperId] ?? [])];
          if (msgs.length > 0) {
            const updates: Partial<AIMessage> = { content };
            if (isStreaming !== undefined) updates.isStreaming = isStreaming;
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ...updates };
          }
          return { chatHistories: { ...s.chatHistories, [paperId]: msgs } };
        }),
      clearAIMessages: () =>
        set((s) => {
          const paperId = s.currentPaper?.id;
          if (!paperId) return {};
          return { chatHistories: { ...s.chatHistories, [paperId]: [] } };
        }),
      pruneOrphanedChatHistories: () =>
        set((s) => {
          const paperIds = new Set(s.papers.map((p) => p.id));
          const pruned: Record<string, AIMessage[]> = {};
          for (const [id, msgs] of Object.entries(s.chatHistories)) {
            if (paperIds.has(id)) pruned[id] = msgs;
          }
          return { chatHistories: pruned };
        }),
      setIsAIStreaming: (isAIStreaming) => set({ isAIStreaming }),
      setActiveWritingMode: (activeWritingMode) => set({ activeWritingMode }),
      setSelectedText: (selectedText, selectionRange) =>
        set({ selectedText, selectionRange: selectionRange ?? null }),
      setGhostText: (ghostText) => set({ ghostText }),
      setShowGhostText: (showGhostText) => set({ showGhostText }),
      setAutocompleteEnabled: (autocompleteEnabled) => set({ autocompleteEnabled }),
      setIsDiffusing: (isDiffusing) => set({ isDiffusing }),
      setDiffusionStep: (diffusionStep) => set({ diffusionStep }),
      setDiffusionContent: (diffusionContent) => set({ diffusionContent }),
      setDiffusionEnabled: (diffusionEnabled) => set({ diffusionEnabled }),
      resetDiffusion: () => set({ isDiffusing: false, diffusionStep: 0, diffusionContent: "" }),
      setReasoningEffort: (reasoningEffort) => set({ reasoningEffort }),
      setWordCount: (wordCount) => set({ wordCount }),
      setIsSaving: (isSaving) => set({ isSaving }),
      setIsExporting: (isExporting) => set({ isExporting }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      addPromptToHistory: (prompt) =>
        set((s) => {
          const trimmed = prompt.trim();
          if (!trimmed) return {};
          // Deduplicate consecutive identical prompts
          if (s.promptHistory[0] === trimmed) return {};
          const next = [trimmed, ...s.promptHistory].slice(0, 50);
          return { promptHistory: next, promptHistoryIndex: -1 };
        }),
      setPromptHistoryIndex: (promptHistoryIndex) => set({ promptHistoryIndex }),
      resetPromptHistoryIndex: () => set({ promptHistoryIndex: -1 }),

      // Persistence-aware actions
      savePaper: (id, updates) =>
        set((s) => {
          const updatedAt = new Date().toISOString();
          const merged = { ...updates, updatedAt };
          return {
            papers: s.papers.map((p) =>
              p.id === id ? normalizePaperCitationStyle({ ...p, ...merged }) : p
            ),
            currentPaper:
              s.currentPaper?.id === id
                ? normalizePaperCitationStyle({ ...s.currentPaper, ...merged })
                : s.currentPaper,
          };
        }),

      deletePaper: (id) =>
        set((s) => ({
          papers: s.papers.filter((p) => p.id !== id),
          currentPaper: s.currentPaper?.id === id ? null : s.currentPaper,
        })),

      autoNamePaper: (id, name) =>
        set((s) => {
          const updatedAt = new Date().toISOString();
          return {
            papers: s.papers.map((p) =>
              p.id === id ? { ...p, title: name, updatedAt } : p
            ),
            currentPaper:
              s.currentPaper?.id === id
                ? { ...s.currentPaper, title: name, updatedAt }
                : s.currentPaper,
            autoNamedPapers: { ...s.autoNamedPapers, [id]: true },
          };
        }),

      updatePaperContent: (id, content, wordCount) => {
        const s = get();
        const newHash = djb2Hash(content);
        if (s.contentHashes[id] === newHash) {
          // Content unchanged — skip the save
          set({ isSaving: false });
          return;
        }

        const updatedAt = new Date().toISOString();
        set({
          papers: s.papers.map((p) =>
            p.id === id ? { ...p, content, wordCount, updatedAt } : p
          ),
          currentPaper:
            s.currentPaper?.id === id
              ? { ...s.currentPaper, content, wordCount, updatedAt }
              : s.currentPaper,
          isDirty: false,
          isSaving: false,
          contentHashes: { ...s.contentHashes, [id]: newHash },
        });

        // Auto-naming: fire-and-forget for untitled papers with enough content
        const paper = s.papers.find((p) => p.id === id);
        const plainText = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
        const shouldAutoName =
          plainText.length > 50 &&
          paper?.title === "Untitled Paper" &&
          !s.autoNamedPapers[id];

        if (shouldAutoName) {
          // Mark as named BEFORE the async call to prevent duplicate requests
          set((prev) => ({
            autoNamedPapers: { ...prev.autoNamedPapers, [id]: true },
          }));

          const excerpt = plainText.slice(0, 500);
          // Embed the generate-name instructions in the user message so they
          // override the default academic system prompt behavior.
          const userMessage = interpolate(getRawGenerateNamePrompt(), { text: excerpt });

          structuredChatCompletion<{ name: string }>(
            [{ role: "user", content: userMessage }],
            {
              type: "object",
              properties: { name: { type: "string" } },
              required: ["name"],
            },
            {
              maxTokens: 64,
              temperature: getTemperature("generate_name"),
            }
          )
            .then((result) => {
              const name = result?.name?.trim();
              if (name && name.length > 0) {
                get().autoNamePaper(id, name);
              }
            })
            .catch(() => {
              // Silently fail — auto-naming is non-critical
            });
        }
      },
    }),
    {
      name: STORAGE_KEYS.editor,
      version: STORAGE_VERSION,
      skipHydration: true,
      partialize: (state) => ({
        papers: state.papers,
        autocompleteEnabled: state.autocompleteEnabled,
        diffusionEnabled: state.diffusionEnabled,
        reasoningEffort: state.reasoningEffort,
        promptHistory: state.promptHistory,
        darkMode: state.darkMode,
        chatHistories: state.chatHistories,
      }),
      migrate: (persisted) => {
        const data = persisted as Record<string, unknown>;
        // Migrate legacy flat aiMessages → chatHistories
        // We can't know the paper ID at migration time, so we drop the old messages
        // (they would be associated with the wrong paper anyway).
        if ("aiMessages" in data) {
          delete data["aiMessages"];
          if (!data["chatHistories"]) {
            data["chatHistories"] = {};
          }
        }
        return data;
      },
    }
  )
);

// ─── Dashboard Store ───────────────────────────────────────────

interface DashboardState {
  isCreating: boolean;
  selectedTemplate: PaperTemplate;
  selectedCitationStyle: CitationStyleSelection;
  searchQuery: string;
  setIsCreating: (creating: boolean) => void;
  setSelectedTemplate: (template: PaperTemplate) => void;
  setSelectedCitationStyle: (style: CitationStyleSelection) => void;
  setSearchQuery: (query: string) => void;
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      isCreating: false,
      selectedTemplate: "blank",
      selectedCitationStyle: { ...DEFAULT_CITATION_STYLE_SELECTION },
      searchQuery: "",
      setIsCreating: (isCreating) => set({ isCreating }),
      setSelectedTemplate: (selectedTemplate) => set({ selectedTemplate }),
      setSelectedCitationStyle: (selectedCitationStyle) =>
        set({ selectedCitationStyle: normalizeCitationStyleSelection(selectedCitationStyle) }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
    }),
    {
      name: STORAGE_KEYS.dashboard,
      version: STORAGE_VERSION,
      skipHydration: true,
      partialize: (state) => ({
        selectedTemplate: state.selectedTemplate,
        selectedCitationStyle: state.selectedCitationStyle,
      }),
      migrate: (persisted) => persisted as Record<string, unknown>,
    }
  )
);
