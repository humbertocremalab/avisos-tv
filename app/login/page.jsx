"use client";

import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("❌ Error: " + error.message);
    } else {
      router.push("/dashboard");
    }

    setLoading(false);
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#667eea", fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ background: "#fff", padding: "30px", borderRadius: "16px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
        <h1 style={{ marginBottom: "20px" }}>Iniciar sesión</h1>

        {message && <p style={{ color: message.startsWith("❌") ? "red" : "green" }}>{message}</p>}

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: "10px", borderRadius: "8px", color: "#383838ff", border: "1px solid #2c2c2cff" }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: "10px", borderRadius: "8px", color: "#383838ff", border: "1px solid #2c2c2cff" }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: "12px", background: "#0070f3", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600" }}
          >
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
