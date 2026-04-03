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
    <section className="mx-auto max-w-lg space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-slate-600">
          Create an account or sign in to your profile.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
              activeTab === tab
                ? "bg-black text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {activeTab === "Login" ? (
        <form className="space-y-4" onSubmit={handleLogin}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="email"
              name="email"
              value={loginForm.email}
              onChange={onLoginChange}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
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
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      ) : (
        <form className="space-y-4" onSubmit={handleRegister}>
          <label className="block text-sm font-medium text-slate-700">
            Full name
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="text"
              name="name"
              value={registerForm.name}
              onChange={onRegisterChange}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Handle (optional)
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="text"
              name="handle"
              value={registerForm.handle}
              onChange={onRegisterChange}
              placeholder="@yourname"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              type="email"
              name="email"
              value={registerForm.email}
              onChange={onRegisterChange}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
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
            className="w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
      )}
    </section>
  );
}

export default Auth;
