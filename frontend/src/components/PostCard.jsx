import { Link } from "react-router-dom";
import ReactionBar from "./ReactionBar";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const excerpt = (text, max = 160) => {
  if (!text) return "";
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
};

function PostCard({ post, onReact, reacting = false }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {post.category}
        </span>
        <span className="text-xs text-slate-500">
          {formatDate(post.createdAt)}
        </span>
      </div>
      <h3 className="mt-4 text-xl font-semibold">
        <Link to={`/posts/${post._id}`} className="hover:underline">
          {post.title}
        </Link>
      </h3>
      <p className="mt-3 text-sm text-slate-600">
        {excerpt(post.content, 200)}
      </p>
      <div className="mt-4">
        <ReactionBar
          reactions={post.reactions}
          onReact={(type) => onReact?.(post._id, type)}
          disabled={reacting}
        />
      </div>
    </article>
  );
}

export default PostCard;
