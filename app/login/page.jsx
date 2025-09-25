"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // contraseña para usuarios existentes
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Lista de usuarios permitidos
  const allowedUsers = ["usuario1@example.com", "usuario2@example.com", "usuario3@example.com"];

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    // Verificar si el usuario está permitido
    if (!allowedUsers.includes(email)) {
      setMessage("❌ Usuario no permitido");
      setLoading(false);
      return;
    }

    // Login con correo y contraseña en Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("❌ Error: " + error.message);
    } else {
      setMessage("✅ Login exitoso");
      router.push("/dashboard"); // redirige al dashboard
    }

    setLoading(false);
  };

  // Manejo de invitación (magic link)
  const handleInvite = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    if (!allowedUsers.includes(email)) {
      setMessage("❌ Usuario no permitido");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });

    if (error) {
      setMessage("❌ Error enviando invitación: " + error.message);
    } else {
      setMessage(`✅ Link enviado a ${email}. Revisa tu correo.`);
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #4DA6FF, #9B59B6)",
        fontFamily: "'Poppins', sans-serif",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "20px", fontWeight: "600" }}>
          Iniciar Sesión
        </h1>

        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "1rem",
          }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            fontSize: "1rem",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            background: "#0070f3",
            color: "#fff",
            fontWeight: "600",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>

        <button
          onClick={handleInvite}
          type="button"
          disabled={loading}
          style={{
            padding: "12px",
            background: "#6c63ff",
            color: "#fff",
            fontWeight: "600",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "1rem",
          }}
        >
          {loading ? "Enviando..." : "Enviar Link de Invitación"}
        </button>

        {message && (
          <p style={{ marginTop: "10px", textAlign: "center", color: "#333" }}>{message}</p>
        )}
      </form>
    </div>
  );
}
