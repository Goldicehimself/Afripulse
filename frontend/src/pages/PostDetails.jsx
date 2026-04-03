import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deletePost, fetchPostById, reactToPost } from "../api/posts";
import ReactionBar from "../components/ReactionBar";
import useAuthStore from "../store/useAuthStore";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

function PostDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reacting, setReacting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    fetchPostById(id)
      .then((data) => {
        if (!active) return;
        setPost(data);
      })
      .catch(() => {
        if (!active) return;
        setError("Post not found.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleReact = async (type) => {
    if (!post) return;
    try {
      setReacting(true);
      const updated = await reactToPost(post._id, type);
      setPost(updated);
    } catch {
      setError("Reaction failed. Please try again.");
    } finally {
      setReacting(false);
    }
  };

  const handleDelete = async () => {
    if (!post || deleting) return;
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;
    try {
      setDeleting(true);
      await deletePost(post._id);
      navigate("/");
    } catch {
      setError("Delete failed. Check your login.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
        Loading post...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="space-y-4">
        <p className="text-slate-400">{error || "Post not found."}</p>
        <Link to="/" className="text-sm font-medium text-white underline">
          Back to feed
        </Link>
      </div>
    );
  }

  return (
    <article className="ap-card ap-card-pad space-y-6 border border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {post.category} · {formatDate(post.createdAt)} · AfriPulse Desk
        </p>
        <h1 className="ap-title text-white">
          {post.title}
        </h1>
      </header>

      {post.image ? (
        <img
          src={post.image}
          alt={post.title}
          className="w-full rounded-2xl object-cover"
        />
      ) : null}

      <p className="ap-body whitespace-pre-line text-slate-300">
        {post.content}
      </p>

      <ReactionBar
        reactions={post.reactions}
        onReact={handleReact}
        disabled={reacting}
      />

      <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Comments</h3>
          <span className="text-xs text-slate-400">Top comments</span>
        </div>
        <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-slate-400">
          No comments yet. Be the first to react.
        </div>
      </section>

      {token && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-rose-200 disabled:opacity-60"
        >
          {deleting ? "Deleting..." : "Delete Post"}
        </button>
      )}

      <Link to="/" className="text-sm font-medium text-white underline">
        Back to feed
      </Link>
    </article>
  );
}

export default PostDetails;



