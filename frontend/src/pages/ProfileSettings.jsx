import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { fetchProfile, updateProfile } from "../api/profile";
import { uploadImage } from "../api/cloudinary";
import useAuthStore from "../store/useAuthStore";

const emptyProfile = {
  name: "AfriPulse Fan",
  handle: "@pulsefan",
  bio: "",
  location: "",
  memberSince: "",
  avatarUrl: "",
};

function ProfileSettings() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const [form, setForm] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarProgress, setAvatarProgress] = useState(0);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    fetchProfile()
      .then((profileData) => {
        if (!active) return;
        const nextProfile = profileData || emptyProfile;
        setForm({
          name: nextProfile.name || "",
          handle: nextProfile.handle || "",
          bio: nextProfile.bio || "",
          location: nextProfile.location || "",
          memberSince: nextProfile.memberSince || "",
          avatarUrl: nextProfile.avatarUrl || "",
        });
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load settings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const updateField = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const setAvatarSelection = (file) => {
    setAvatarFile(file || null);
    setAvatarProgress(0);
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : "";
    });
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    if (avatarFile.size > 2 * 1024 * 1024) {
      setError("Image too large. Max size is 2MB.");
      return;
    }
    setError("");
    setInfo("");
    setAvatarUploading(true);
    setAvatarProgress(0);
    try {
      const result = await uploadImage(avatarFile, {
        folder: "afripulse/avatars",
        publicId: `avatar-${Date.now()}`,
        onProgress: (value) => setAvatarProgress(value),
      });
      const url = result.secure_url || "";
      if (url) {
        setForm((prev) => ({ ...prev, avatarUrl: url }));
        await updateProfile({ avatarUrl: url });
        setInfo("Avatar updated.");
      }
    } catch (_) {
      setError("Avatar upload failed. Check Cloudinary settings.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    if (!token) {
      setError("Please sign in to update settings.");
      return;
    }
    setSaving(true);
    setError("");
    setInfo("");
    try {
      await updateProfile(form);
      setInfo("Settings updated successfully.");
    } catch (_) {
      setError("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
        Please sign in to edit your settings.{" "}
        <Link to="/auth" className="text-emerald-300 underline">
          Sign in
        </Link>
        .
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5"
            aria-label="Go back"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">
              Profile Settings
            </h1>
            <p className="text-xs text-slate-400">
              Manage your profile details and avatar.
            </p>
          </div>
        </div>
      </header>

      {(error || info) && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            error
              ? "border-rose-500/30 bg-rose-500/10 text-rose-200"
              : "border-white/10 bg-white/5 text-slate-300"
          }`}
        >
          {error || info}
        </div>
      )}

      <section className="ap-card ap-card-pad border border-white/10 bg-white/5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Avatar
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-white/5">
            {(avatarPreview || form.avatarUrl) ? (
              <img
                src={avatarPreview || form.avatarUrl}
                alt="Avatar preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-xs text-slate-500">
                No avatar
              </div>
            )}
          </div>
          <div className="space-y-2">
            <input
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setAvatarSelection(file);
              }}
            />
            <button
              type="button"
              onClick={handleAvatarUpload}
              disabled={!avatarFile || avatarUploading}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-60"
            >
              {avatarUploading ? "Uploading..." : "Upload Avatar"}
            </button>
          </div>
        </div>
        {avatarUploading && (
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-2 rounded-full bg-amber-400 transition-all"
              style={{ width: `${avatarProgress}%` }}
            />
          </div>
        )}
      </section>

      <section className="ap-card ap-card-pad border border-white/10 bg-white/5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
          Profile Details
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            placeholder="Name"
            value={form.name}
            onChange={updateField("name")}
          />
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            placeholder="Handle"
            value={form.handle}
            onChange={updateField("handle")}
          />
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            placeholder="Location"
            value={form.location}
            onChange={updateField("location")}
          />
          <input
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
            placeholder="Member since"
            value={form.memberSince}
            onChange={updateField("memberSince")}
          />
        </div>
        <textarea
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
          rows="3"
          placeholder="Bio"
          value={form.bio}
          onChange={updateField("bio")}
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-emerald-400 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-black disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <Link
            to="/profile"
            className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200"
          >
            Back to profile
          </Link>
        </div>
      </section>
    </div>
  );
}

export default ProfileSettings;
