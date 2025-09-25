"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation"; // Importar router

export default function DashboardPage() {
  const [tipo, setTipo] = useState("texto");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [avisos, setAvisos] = useState([]);
  const router = useRouter(); // Inicializar router

  // --- NUEVO: Control de sonido ---
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audio, setAudio] = useState(null);

  useEffect(() => {
    const enabled = localStorage.getItem("soundEnabled") === "true";
    setSoundEnabled(enabled);
    if (enabled) {
      const newAudio = new Audio("/audio/alerta.ogg");
      newAudio.volume = 1;
      setAudio(newAudio);
    }
  }, []);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem("soundEnabled", newState);
    if (newState && !audio) {
      const newAudio = new Audio("/audio/alerta.ogg");
      newAudio.volume = 1;
      setAudio(newAudio);
    }
  };

  // --- Verificación de sesión al cargar ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkSession();

    // Inyectar tipografía Poppins
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Cargar avisos
    cargarAvisos();
  }, []);

  const cargarAvisos = async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error cargando avisos:", error);
    } else {
      setAvisos(data);
    }
  };

  // --- Función para cerrar sesión ---
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("❌ Error al cerrar sesión:", error.message);
    } else {
      router.push("/login");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("avisos").insert([
      {
        tipo,
        titulo,
        descripcion: tipo === "texto" ? descripcion : null,
        url: tipo === "video" ? videoUrl : null,
        imagen_url: tipo === "imagen" ? imagenUrl : null,
      },
    ]);

    if (error) {
      console.error(error);
      setMessage("❌ Error al guardar aviso: " + error.message);
    } else {
      setMessage("✅ Aviso agregado con éxito");
      setTitulo("");
      setDescripcion("");
      setVideoUrl("");
      setImagenUrl("");
      cargarAvisos();
    }

    setLoading(false);
  };

  const borrarAviso = async (id) => {
    const { error } = await supabase.from("avisos").delete().eq("id", id);
    if (error) {
      console.error("❌ Error al borrar aviso:", error);
    } else {
      cargarAvisos();
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "'Poppins', sans-serif",
        background: "#f4f6f8",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* Botón de Cerrar Sesión */}
      <button
        onClick={handleLogout}
        style={{
          padding: "10px 16px",
          background: "red",
          color: "#fff",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          position: "absolute",
          top: "20px",
          right: "20px",
          fontWeight: "600",
        }}
      >
        Cerrar sesión
      </button>

      {/* NUEVO: Botón de sonido */}
      <button
        onClick={toggleSound}
        style={{
          padding: "8px 16px",
          marginBottom: "20px",
          borderRadius: "8px",
          background: soundEnabled ? "#22c55e" : "#f87171",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontWeight: "600",
        }}
      >
        {soundEnabled ? "Sonido Activado" : "Activar Sonido"}
      </button>

      <h1
        style={{
          fontSize: "2rem",
          marginBottom: "20px",
          textAlign: "center",
          fontWeight: "600",
          color: "#0044cc",
        }}
      >
        Dashboard de Avisos
      </h1>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          maxWidth: "420px",
          margin: "0 auto",
          padding: "20px",
          border: "1px solid #e0e0e0",
          borderRadius: "16px",
          background: "#fff",
          color: "#000",
          boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
        }}
      >
        <label style={{ fontWeight: "500" }}>
          Tipo de aviso:
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "1rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
              width: "100%",
              marginTop: "5px",
            }}
          >
            <option value="texto">Agregar Texto</option>
            <option value="video">Agregar Video</option>
            <option value="imagen">Agregar Imagen</option>
          </select>
        </label>

        <input
          type="text"
          placeholder="Título (opcional)"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          style={{
            padding: "10px",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "1px solid #ccc",
            color: "#000",
          }}
        />

       {tipo === "texto" && (
  <>
    <textarea
      placeholder="Descripción"
      value={descripcion}
      onChange={(e) => setDescripcion(e.target.value)}
      style={{
        padding: "10px",
        fontSize: "1rem",
        borderRadius: "8px",
        border: "1px solid #ccc",
        minHeight: "100px",
      }}
      required
    />

    {/* Toggle de sonido */}
    <button
      type="button"
      onClick={() => {
        const newState = !soundEnabled;
        setSoundEnabled(newState);
        localStorage.setItem("soundEnabled", newState);

        if (newState) {
          const preload = new Audio("/audio/alerta.ogg");
          preload.volume = 0.5; // sonido más bajo en la precarga
          preload.play().catch(() => {});
          setAudio(preload);
        }
      }}
      style={{
        padding: "10px",
        borderRadius: "8px",
        background: soundEnabled ? "#22c55e" : "#f87171",
        color: "#fff",
        border: "none",
        cursor: "pointer",
        fontWeight: "600",
        marginTop: "10px",
      }}
    >
      {soundEnabled ? "Con sonido 🔊" : "Sin sonido 🔇"}
    </button>
  </>
)}

        {tipo === "video" && (
          <input
            type="text"
            placeholder="URL del video"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "1rem",
              borderRadius: "8px",
              border: "1px solid #cececeff",
            }}
            required
          />
        )}

        {tipo === "imagen" && (
          <input
            type="text"
            placeholder="URL de la imagen"
            value={imagenUrl}
            onChange={(e) => setImagenUrl(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "1rem",
              borderRadius: "8px",
              border: "1px solid #ccc",
            }}
            required
          />
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            background: "#0070f3",
            color: "white",
            fontSize: "1.1rem",
            fontWeight: "600",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          {loading ? "Guardando..." : "Agregar Aviso"}
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "20px", textAlign: "center" }}>{message}</p>
      )}

      {/* Lista de avisos */}
      <h2
        style={{
          marginTop: "40px",
          textAlign: "center",
          fontWeight: "600",
          fontSize: "1.5rem",
          color: "#000",
        }}
      >
        Avisos existentes
      </h2>
      {avisos.length === 0 && (
        <p style={{ textAlign: "center", color: "#000" }}>No hay avisos aún</p>
      )}

      <div style={{ maxWidth: "600px", margin: "20px auto" }}>
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "16px",
              background: "#fff",
              color: "#000",
              boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div>
              <strong style={{ fontSize: "1.1rem" }}>
                {aviso.titulo || "(sin título)"}
              </strong>{" "}
              <span style={{ fontSize: "0.9rem", color: "#242424ff" }}>
                [{aviso.tipo}]
              </span>
              {aviso.tipo === "texto" && <p>{aviso.descripcion}</p>}
              {aviso.tipo === "video" && <p>{aviso.url}</p>}
              {aviso.tipo === "imagen" && (
                <Image
                  src={aviso.imagen_url}
                  alt="preview"
                  width={600}
                  height={400}
                  style={{ borderRadius: "12px" }}
                />
              )}
            </div>

            <button
              onClick={() => borrarAviso(aviso.id)}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                alignSelf: "flex-start",
                fontWeight: "500",
              }}
            >
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
