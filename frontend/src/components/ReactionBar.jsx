import { Angry, Brain, Flame, GraduationCap } from "lucide-react";

const reactionMeta = [
  { key: "fire", label: "Hot", Icon: Flame },
  { key: "cap", label: "Cap", Icon: GraduationCap },
  { key: "brain", label: "Smart", Icon: Brain },
  { key: "angry", label: "Angry", Icon: Angry },
];

function ReactionBar({ reactions = {}, onReact, disabled = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      {reactionMeta.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onReact?.(item.key)}
          disabled={disabled}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-1">
            <item.Icon size={14} />
            {item.label}
          </span>{" "}
          <span className="ml-1 text-slate-500">
            {reactions[item.key] || 0}
          </span>
        </button>
      ))}
    </div>
  );
}

export default ReactionBar;
