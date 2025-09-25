"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token"); // Captura el token si viene de la invitación

  useEffect(() => {
    if (token) setHasToken(true); // Si hay token, mostramos formulario de establecer contraseña
  }, [token]);

  // 🔑 Función para iniciar sesión normal
  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("❌ Error: " + error.message);
    } else {
      setMessage("✅ Inicio de sesión correcto");
      router.push("/dashboard");
    }
  };

  // 🔒 Función para establecer contraseña desde invitación
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (!token) {
      setMessage("Token no encontrado en la URL");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
      access_token: token,
    });

    if (error) {
      setMessage("❌ Error: " + error.message);
    } else {
      setMessage("✅ Contraseña establecida correctamente. Redirigiendo...");
      setTimeout(() => router.push("/dashboard"), 1500);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #4a00e0, #8e2de2)",
        fontFamily: "'Poppins', sans-serif",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "30px",
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: "20px", fontWeight: "600", color: "#4a00e0" }}>
          {hasToken ? "Establece tu contraseña" : "Inicia sesión"}
        </h2>

        <form
          onSubmit={hasToken ? handleSetPassword : handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
          {!hasToken && (
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "10px",
                fontSize: "1rem",
                borderRadius: "8px",
                border: "1px solid #ccc",
              }}
            />
          )}

          <input
            type="password"
            placeholder={hasToken ? "Nueva contraseña" : "Contraseña"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "10px",
              fontSize: "1rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
          />

          <button
            type="submit"
            style={{
              padding: "12px",
              fontWeight: "600",
              background: "#4a00e0",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            {hasToken ? "Establecer contraseña" : "Iniciar sesión"}
          </button>
        </form>

        {message && <p style={{ marginTop: "15px", color: "#333" }}>{message}</p>}
      </div>
    </div>
  );
}
