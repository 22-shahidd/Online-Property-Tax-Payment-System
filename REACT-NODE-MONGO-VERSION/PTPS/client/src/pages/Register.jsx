import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Landmark, ArrowRight, Check } from "lucide-react";

// Register page - only citizens can self-register
export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes using event.target.name and event.target.value
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Registration failed");
      }

      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-brand">
          <span className="brand-mark">
            <Landmark size={22} />
          </span>
          <span>Nagarpalika</span>
        </div>
        <div className="auth-copy">
          <p className="eyebrow">Join the citizen portal</p>
          <h1>Register to manage your property taxes online.</h1>
          <p>
            Create your citizen account to add properties, pay taxes, and raise
            grievances - all in one place.
          </p>
        </div>
        <div className="auth-footer">
          <span>Secure civic services</span>
          <span>-</span>
          <span>Property Tax System</span>
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-form">
          <div className="mobile-brand">
            <span className="brand-mark">
              <Landmark size={20} />
            </span>
            <b>Nagarpalika</b>
          </div>

          <div className="auth-heading">
            <p className="eyebrow">Create your account</p>
            <h2>Register as a citizen</h2>
            <p>Fill in your details to get started.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label className="form-label">
              Full name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                required
              />
            </label>
            <label className="form-label">
              Email address
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="form-label">
              Phone number
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit phone number"
                required
              />
            </label>
            <label className="form-label">
              Password
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
            </label>

            {error && <div className="notice error">{error}</div>}
            {success && (
              <div className="notice success">
                <Check size={16} />
                {success}
              </div>
            )}

            <button className="primary-button wide" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create citizen account"}
              <ArrowRight size={17} />
            </button>
          </form>

          <Link to="/login" className="switch-auth">
            Already registered? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
