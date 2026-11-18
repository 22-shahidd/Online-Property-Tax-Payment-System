import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import { Landmark, ArrowRight } from "lucide-react";

// Login page - citizen, officer, and admin all login here
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save user info and redirect based on role
      login(data);
      navigate(`/${data.user.role}/dashboard`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Left visual panel */}
      <div className="auth-visual">
        <div className="auth-brand">
          <span className="brand-mark">
            <Landmark size={22} />
          </span>
          <span>Nagarpalika</span>
        </div>
        <div className="auth-copy">
          <p className="eyebrow">Municipal services, simplified</p>
          <h1>Property tax made clear, convenient, and accountable.</h1>
          <p>
            One trusted place for citizens, ward officers, and municipal
            administrators to manage property records and payments.
          </p>
        </div>
        <div className="auth-footer">
          <span>Secure civic services</span>
          <span>-</span>
          <span>Property Tax System</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="mobile-brand">
            <span className="brand-mark">
              <Landmark size={20} />
            </span>
            <b>Nagarpalika</b>
          </div>

          <div className="auth-heading">
            <p className="eyebrow">Welcome back</p>
            <h2>Sign in to your portal</h2>
            <p>Use your municipal account to continue.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="form-label">
              Email address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="form-label">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </label>

            {error && <div className="notice error">{error}</div>}

            <button className="primary-button wide" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Continue to portal"}
              <ArrowRight size={17} />
            </button>
          </form>

          {/* <div className="demo-hint">
            <span>Demo accounts</span>
            <small>
              Admin: <b>admin@nagarpalika.gov</b> / admin123
              <br />
              Officer: <b>officer@nagarpalika.gov</b> / officer123
              <br />
              Citizen: <b>aarav@example.com</b> / citizen123
            </small>
          </div> */}

          <Link to="/register" className="switch-auth">
            New citizen? Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
