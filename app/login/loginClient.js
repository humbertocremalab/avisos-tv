"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useSearchParams, useRouter } from "next/navigation";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [token, setToken] = useState(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // solo cliente
    if (!searchParams) return;

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

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("❌ Error: " + error.message);
    } else {
      router.push("/dashboard");
    }
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

    if (error) {
      setMessage("❌ Error: " + error.message);
    } else {
      setMessage("✅ Contraseña establecida correctamente!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div style={{ background: "#fff", padding: "30px", borderRadius: "16px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
        <h1>{isSettingPassword ? "Establecer contraseña" : "Iniciar sesión"}</h1>
        {message && <p style={{ color: message.startsWith("❌") ? "red" : "green" }}>{message}</p>}

        {isSettingPassword ? (
          <form onSubmit={handleSetPassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input type="password" placeholder="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            <button type="submit">Establecer contraseña</button>
          </form>
        ) : (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input type="email" placeholder="Correo" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">Iniciar sesión</button>
          </form>
        )}
      </div>
    </div>
  );
}
