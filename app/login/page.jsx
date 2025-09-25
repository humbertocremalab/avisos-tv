"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [token, setToken] = useState(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Solo usar searchParams dentro de useEffect (cliente)
  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const type = searchParams.get("type");

    if (accessToken && type === "magiclink") {
      setToken(accessToken);
      setIsSettingPassword(true);
      setMessage("Bienvenido! Ingresa tu nueva contraseña.");
    }
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) setMessage("❌ Error: " + error.message);
    else router.push("/dashboard");
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("❌ Token inválido");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("❌ La contraseña debe tener al menos 6 caracteres");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      access_token: token,
      password: newPassword,
    });

    if (error) setMessage("❌ Error: " + error.message);
    else {
      setMessage("✅ Contraseña establecida correctamente!");
      setTimeout(() => router.push("/dashboard"), 1500);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        fontFamily: "'Poppins', sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        <h1 style={{ marginBottom: "20px", fontSize: "1.8rem" }}>
          {isSettingPassword ? "Establecer contraseña" : "Iniciar sesión"}
        </h1>

        {message && (
          <p
            style={{
              marginBottom: "20px",
              color: message.startsWith("❌") ? "red" : "green",
            }}
          >
            {message}
          </p>
        )}

        {isSettingPassword ? (
          <form
            onSubmit={handleSetPassword}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
              required
            />
            <button
              type="submit"
              style={{
                padding: "12px",
                background: "#0070f3",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Establecer contraseña
            </button>
          </form>
        ) : (
          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
              required
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }}
              required
            />
            <button
              type="submit"
              style={{
                padding: "12px",
                background: "#0070f3",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Iniciar sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
