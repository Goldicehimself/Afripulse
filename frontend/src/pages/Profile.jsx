import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  Settings,
  Share2,
} from "lucide-react";
import { fetchProfile, updateProfile } from "../api/profile";
import { fetchPredictions } from "../api/predictions";
import { uploadImage } from "../api/cloudinary";
import useAuthStore from "../store/useAuthStore";

const tabs = ["Predictions", "Reactions", "Comments", "Bookmarks"];
const filters = ["All", "Correct", "Incorrect", "Pending"];

const emptyProfile = {
  name: "AfriPulse Fan",
  handle: "@pulsefan",
  bio: "",
  location: "",
  memberSince: "",
  avatarUrl: "",
  followers: 0,
  following: 0,
  stats: {
    predictionPoints: 0,
    accuracyRate: 0,
    reactionsGiven: 0,
    dailyStreak: 0,
  },
  achievements: [],
};

function Profile() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState(emptyProfile);
  const [predictions, setPredictions] = useState([]);
  const [activeTab, setActiveTab] = useState("Predictions");
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyProfile);
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
        if (!active) return null;
        const nextProfile = profileData || emptyProfile;
        setProfile(nextProfile);
        setForm(nextProfile);
        return fetchPredictions({
          page: 1,
          limit: 12,
          userName: nextProfile.name,
        });
      })
      .then((predictionData) => {
        if (!active || !predictionData) return;
        setPredictions(predictionData.items || []);
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load profile data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const stats = useMemo(
    () => [
      {
        label: "Prediction Points",
        value: profile.stats?.predictionPoints ?? 0,
        meta: "This month",
      },
      {
        label: "Accuracy Rate",
        value: `${profile.stats?.accuracyRate ?? 0}%`,
        meta: "Vs community avg",
      },
      {
        label: "Reactions Given",
        value: profile.stats?.reactionsGiven ?? 0,
        meta: "High engagement",
      },
      {
        label: "Daily Login Streak",
        value: profile.stats?.dailyStreak ?? 0,
        meta: "Keep it going",
      },
    ],
    [profile]
  );

  const filteredPredictions = useMemo(() => {
    if (activeFilter === "All") return predictions;
    if (activeFilter === "Correct") {
      return predictions.filter((item) => item.status === "Completed");
    }
    if (activeFilter === "Incorrect") {
      return predictions.filter((item) => item.status === "Missed");
    }
    return predictions.filter((item) => item.status === "Pending");
  }, [predictions, activeFilter]);

  const handleSave = async () => {
    if (!token) {
      setError("Login as admin to update the profile.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile(form);
      setProfile(updated);
      setEditing(false);
    } catch {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

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
      }
    } catch (err) {
      setError("Avatar upload failed. Check Cloudinary settings.");
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!token) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
        Please sign in to view your profile.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center text-sm text-slate-400">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#151924]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.22),transparent_50%),radial-gradient(circle_at_85%_15%,rgba(14,165,233,0.2),transparent_45%)]" />
        <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-4 text-slate-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5"
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>
            <p className="text-sm font-semibold">Profile</p>
          </div>
          <div className="flex items-center gap-2">
            {[
              { label: "Settings", Icon: Settings },
              { label: "Share", Icon: Share2 },
              { label: "More", Icon: MoreHorizontal },
            ].map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5"
                aria-label={label}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        <div className="relative px-6 py-10">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 p-1">
                <div className="h-full w-full overflow-hidden rounded-full bg-[#1a1f2b] grid place-items-center text-2xl font-semibold text-white">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.name || "Profile avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{profile.name?.slice(0, 2).toUpperCase() || "AP"}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 grid h-7 w-7 place-items-center rounded-full bg-amber-400 text-black"
                aria-label="Edit avatar"
              >
                <Pencil size={12} />
              </button>
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-white">
              {profile.name}
            </h1>
            <p className="text-sm text-amber-300">{profile.handle}</p>
            <p className="mt-2 text-xs text-slate-400">
              Member since {profile.memberSince}
            </p>
            <p className="text-xs text-slate-400">{profile.location}</p>
            <p className="mt-4 max-w-xl text-sm text-slate-300">
              {profile.bio}
            </p>
            <div className="mt-4 flex items-center gap-6 text-center">
              <div>
                <p className="text-base font-semibold text-white">
                  {profile.followers}
                </p>
                <p className="text-xs text-slate-400">Followers</p>
              </div>
              <div>
                <p className="text-base font-semibold text-white">
                  {profile.following}
                </p>
                <p className="text-xs text-slate-400">Following</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEditing((prev) => !prev)}
              className="mt-6 rounded-full border border-white/10 bg-white/10 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-white"
            >
              {editing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>
      </section>

      {editing && (
        <section className="ap-card ap-card-pad border border-white/10 bg-white/5">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Update Profile
          </h2>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-slate-200">
              Avatar (optional)
              <input
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setAvatarSelection(file);
                }}
              />
              <span className="mt-1 block text-xs text-slate-400">
                Select an image to preview, then click Upload.
              </span>
            </label>
            <button
              type="button"
              onClick={handleAvatarUpload}
              disabled={!avatarFile || avatarUploading}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-60"
            >
              {avatarUploading ? "Uploading..." : "Upload Avatar"}
            </button>
            {avatarUploading && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-amber-400 transition-all"
                  style={{ width: `${avatarProgress}%` }}
                />
              </div>
            )}
            {(avatarPreview || form.avatarUrl) && (
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-full border border-white/10 bg-white/5">
                  <img
                    src={avatarPreview || form.avatarUrl}
                    alt="Avatar preview"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="text-xs text-slate-400">
                  Preview shown above. Save changes to update profile.
                </p>
              </div>
            )}
          </div>
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
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mt-4 rounded-full bg-emerald-400 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-black disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </section>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="ap-card ap-card-pad relative overflow-hidden border border-white/10 bg-white/5 shadow-[0_14px_30px_rgba(0,0,0,0.35)]"
          >
            <p className="text-xs uppercase tracking-widest text-slate-400">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-amber-200">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stat.meta}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Achievements
          </h2>
          <span className="text-xs text-slate-500">
            {profile.achievements?.length || 0} earned
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(profile.achievements || []).map((item) => (
            <div
              key={item.title + item.meta}
              className={`rounded-2xl border border-white/10 bg-white/5 p-4 text-left shadow-[0_12px_28px_rgba(0,0,0,0.25)] ${
                item.locked ? "opacity-60" : ""
              }`}
            >
              <div className="mb-3 h-10 w-10 rounded-full border border-white/10 bg-white/10" />
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="text-xs text-slate-400">{item.meta}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => setActiveTab(pill)}
              className={`rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                pill === activeTab
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-slate-300"
              }`}
            >
              {pill}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border border-white/10 px-3 py-1 text-xs ${
                filter === activeFilter
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-slate-400"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {activeTab !== "Predictions" ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
            No {activeTab.toLowerCase()} yet.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPredictions.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-slate-400">
                No predictions yet.
              </div>
            ) : (
              filteredPredictions.map((item) => (
                <div
                  key={item._id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 shadow-[0_12px_28px_rgba(0,0,0,0.25)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {item.matchLabel}
                      </p>
                      <p className="text-xs text-slate-400">
                        {item.competition || "Friendly"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-wide ${
                          item.status === "Completed"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : item.status === "Missed"
                            ? "bg-rose-500/20 text-rose-200"
                            : "bg-amber-500/20 text-amber-200"
                        }`}
                      >
                        {item.points ? `+${item.points} pts` : "Pending"}
                      </span>
                      <span className="text-slate-400">{item.status}</span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-400">My Prediction</p>
                      <p className="text-sm text-amber-200">
                        {item.pick}
                        {item.predictedScore
                          ? ` (${item.predictedScore})`
                          : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Actual Result</p>
                      <p className="text-sm text-white">
                        {item.actualResult || "Not started"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

export default Profile;

