import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../api/auth";
import useAuthStore from "../store/useAuthStore";

const tabs = ["Login", "Register"];

function Auth() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [activeTab, setActiveTab] = useState("Login");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    handle: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputClass =
    "auth-input mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-slate-400 outline-none focus:border-white/25";

  const onLoginChange = (event) => {
    const { name, value } = event.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const onRegisterChange = (event) => {
    const { name, value } = event.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await loginUser(loginForm.email, loginForm.password);
      setAuth(data.user, data.token);
      navigate("/profile");
    } catch {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerUser(registerForm);
      const data = await loginUser(registerForm.email, registerForm.password);
      setAuth(data.user, data.token);
      navigate("/profile");
    } catch {
      setError("Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell mx-auto max-w-4xl rounded-3xl border border-white/10 bg-[#111520] text-white shadow-sm">
      <div className="grid gap-8 p-8 md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <div className="auth-badge inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200">
            AfriPulse Access
          </div>
          <div>
            <h1 className="text-3xl font-semibold">
              Your feed, your pace.
            </h1>
            <p className="auth-muted mt-3 text-sm text-slate-300">
              Log in to save favorites, react to posts, and build your own
              entertainment dashboard.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="auth-pill rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Live sports updates
            </span>
            <span className="auth-pill rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Trending entertainment
            </span>
            <span className="auth-pill rounded-full border border-white/10 bg-white/5 px-3 py-2">
              Personalized profile
            </span>
          </div>
        </div>

        <div className="auth-panel space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${
                  activeTab === tab
                    ? "auth-tab-active bg-white text-slate-900"
                    : "auth-tab border border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {error && (
            <div className="auth-error rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          )}

          {activeTab === "Login" ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <label className="auth-label block text-sm font-medium text-slate-200">
                Email
                <input
                  className={inputClass}
                  type="email"
                  name="email"
                  value={loginForm.email}
                  onChange={onLoginChange}
                  required
                />
              </label>
              <label className="auth-label block text-sm font-medium text-slate-200">
                Password
                <input
                  className={inputClass}
                  type="password"
                  name="password"
                  value={loginForm.password}
                  onChange={onLoginChange}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="auth-button w-full rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleRegister}>
              <label className="auth-label block text-sm font-medium text-slate-200">
                Full name
                <input
                  className={inputClass}
                  type="text"
                  name="name"
                  value={registerForm.name}
                  onChange={onRegisterChange}
                  required
                />
              </label>
              <label className="auth-label block text-sm font-medium text-slate-200">
                Handle (optional)
                <input
                  className={inputClass}
                  type="text"
                  name="handle"
                  value={registerForm.handle}
                  onChange={onRegisterChange}
                  placeholder="@yourname"
                />
              </label>
              <label className="auth-label block text-sm font-medium text-slate-200">
                Email
                <input
                  className={inputClass}
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={onRegisterChange}
                  required
                />
              </label>
              <label className="auth-label block text-sm font-medium text-slate-200">
                Password
                <input
                  className={inputClass}
                  type="password"
                  name="password"
                  value={registerForm.password}
                  onChange={onRegisterChange}
                  required
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="auth-button w-full rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create account"}
              </button>
            </form>
          )}

          <div className="space-y-3">
            <div className="auth-divider flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-slate-300">
              <span className="auth-rule h-px flex-1 bg-white/10" />
              Or continue with
              <span className="auth-rule h-px flex-1 bg-white/10" />
            </div>
            <div className="text-xs uppercase tracking-[0.25em] text-slate-300">
              Sign in with
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="auth-provider auth-provider-icon-only" aria-label="Sign in with Google">
                <span className="auth-provider-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path
                      fill="#EA4335"
                      d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.7-5.5 3.7-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.6-2.5C16.9 3 14.7 2 12 2 6.7 2 2.4 6.3 2.4 11.6S6.7 21.2 12 21.2c6.9 0 8.6-4.8 8.6-7.3 0-.5-.1-.8-.1-1.1H12z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M3.9 7.4l3.1 2.3c.8-1.6 2.4-2.7 4.1-2.7 1.1 0 2.1.4 2.9 1l2.3-2.2C15 4.6 13.6 4 12.1 4 8.6 4 5.5 6 3.9 7.4z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 20c2.4 0 4.4-.8 5.9-2.1l-2.7-2.1c-.7.5-1.7.9-3.2.9-2.4 0-4.4-1.6-5.1-3.8l-3.2 2.4C5.2 17.8 8.3 20 12 20z"
                    />
                    <path
                      fill="#4285F4"
                      d="M20.6 12c0-.5-.1-.8-.1-1.2H12v3.9h4.9c-.3 1.1-1 2-2 2.6l2.7 2.1c1.6-1.5 2.9-3.7 2.9-6.4z"
                    />
                  </svg>
                </span>
              </button>
              <button type="button" className="auth-provider auth-provider-icon-only" aria-label="Sign in with Instagram">
                <span className="auth-provider-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <defs>
                      <linearGradient id="igGradient" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FEDA75" />
                        <stop offset="30%" stopColor="#FA7E1E" />
                        <stop offset="55%" stopColor="#D62976" />
                        <stop offset="75%" stopColor="#962FBF" />
                        <stop offset="100%" stopColor="#4F5BD5" />
                      </linearGradient>
                    </defs>
                    <rect x="2.5" y="2.5" width="19" height="19" rx="5" fill="url(#igGradient)" />
                    <path
                      fill="#ffffff"
                      d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.6a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8zm5.2-7.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2z"
                    />
                    <path
                      fill="#ffffff"
                      d="M17.3 6.3H6.7c-.2 0-.4.2-.4.4v10.6c0 .2.2.4.4.4h10.6c.2 0 .4-.2.4-.4V6.7c0-.2-.2-.4-.4-.4zm-5.3 9.6a4.3 4.3 0 1 1 0-8.6 4.3 4.3 0 0 1 0 8.6zm5.1-7.8a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8z"
                    />
                  </svg>
                </span>
              </button>
              <button type="button" className="auth-provider auth-provider-icon-only" aria-label="Sign in with Facebook">
                <span className="auth-provider-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path
                      fill="#1877F2"
                      d="M22 12.1C22 6.6 17.5 2 12 2S2 6.6 2 12.1c0 4.9 3.6 9 8.2 9.8v-6.9H7.7V12h2.5V9.7c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.2c-1.2 0-1.6.8-1.6 1.5V12h2.8l-.5 3h-2.3v6.9c4.6-.8 8.2-4.9 8.2-9.8z"
                    />
                  </svg>
                </span>
              </button>
              <button type="button" className="auth-provider auth-provider-icon-only" aria-label="Sign in with X">
                <span className="auth-provider-icon auth-provider-x" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img">
                    <path
                      fill="currentColor"
                      d="M17.6 3H20l-5.3 6.1L21 21h-5l-3.9-5.6L6.8 21H4.4l5.7-6.6L3 3h5.1l3.5 5.1L17.6 3zm-1 16h1.9L7.4 5H5.4l11.2 14z"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Auth;
