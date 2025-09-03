import React, { useState } from "react";
import FAQModal from "./FAQModal";

function AuthForm({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [wallet, setWallet] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState("");
  const [showFAQ, setShowFAQ] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isLogin ? "/login" : "/signup";
    try {
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          ...(isLogin ? {} : { wallet }),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unknown error");
        return;
      }

      onLogin({
        username: data.username,
        wallet: data.wallet || "",
      });
    } catch (err) {
      setError("Connection error to server");
    }
  };

  return (
    <div className="auth-overlay" style={{ position: "relative" }}>
      <button
        onClick={() => setShowFAQ(true)}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          width: "30px",
          height: "30px",
          borderRadius: "50%",
          border: "2px solid #2ce62a",
          background: "black",
          color: "#2ce62a",
          zIndex: 11,
          fontWeight: "bold",
          fontSize: "16px",
          cursor: "pointer",
          boxShadow: "0 0 5px #2ce62a, 0 0 10px #2ce62a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "0.2s ease-in-out",
        }}
        onMouseOver={(e) =>
          (e.currentTarget.style.boxShadow =
            "0 0 5px #2ce62a, 0 0 30px #2ce62a, 0 0 15px #2ce62a")
        }
        onMouseOut={(e) =>
          (e.currentTarget.style.boxShadow =
            "0 0 10px #2ce62a, 0 0 20px #2ce62a")
        }
      >
        ?
      </button>

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="auth-logo">
          <img src="/logo.png" alt="Logo" />
        </div>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input-dark"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-dark"
        />

        {!isLogin && (
          <input
            type="text"
            placeholder="Wallet Address"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="input-dark"
          />
        )}

        <button type="submit" className="neon-btn">
          {isLogin ? "Login" : "Signup"}
        </button>

        <button
          type="button"
          className="neon-btn trial-btn"
          onClick={() => {
            localStorage.setItem("username", "Trial");
            onLogin("Trial");
          }}
        >
          Play as Guest
        </button>

        {error && <p className="auth-error">{error}</p>}

        <p
          onClick={() => {
            setIsLogin(!isLogin);
            setError("");
          }}
          className="auth-switch"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Login"}
        </p>
      </form>

      {showFAQ && <FAQModal onClose={() => setShowFAQ(false)} />}
    </div>
  );
}

export default AuthForm;
