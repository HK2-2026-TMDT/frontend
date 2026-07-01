import { useState } from 'react';
import { AI_DESIGN_PROMPT_EXAMPLES } from '../lib/aiDesignPlanner';

type AiDesignPromptPanelProps = {
  isGenerating: boolean;
  lastRationale: string | null;
  onGenerate: (prompt: string) => Promise<void>;
};

export const AiDesignPromptPanel = ({ isGenerating, lastRationale, onGenerate }: AiDesignPromptPanelProps) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = async () => {
    if (!prompt.trim() || isGenerating) return;
    await onGenerate(prompt.trim());
  };

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-xs leading-relaxed text-slate-500">
        Mô tả phong cách — AI chọn sticker có sẵn và sắp xếp lên áo.
      </p>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        rows={4}
        placeholder="Ví dụ: Áo team IT ngầu màu đen, thêm code và tên lửa"
        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
      />

      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Gợi ý nhanh</p>
        <div className="flex flex-col gap-1.5">
          {AI_DESIGN_PROMPT_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setPrompt(example)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-700 transition hover:border-indigo-300 hover:bg-indigo-50/50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={!prompt.trim() || isGenerating}
        className="mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="material-symbols-outlined text-lg">{isGenerating ? 'hourglass_top' : 'auto_awesome'}</span>
        {isGenerating ? 'Đang tạo thiết kế...' : 'Tạo với AI'}
      </button>

      {lastRationale && (
        <p className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-xs leading-relaxed text-indigo-900">
          {lastRationale}
        </p>
      )}
    </div>
  );
};
