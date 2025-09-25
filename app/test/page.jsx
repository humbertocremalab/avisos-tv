"use client";
import { useState } from "react";
import { supabase } from "../../supabaseClient";

export default function DashboardPage() {
  const [tipo, setTipo] = useState("texto");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

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
      setMessage("❌ Error: " + error.message);
    } else {
      setMessage("✅ Aviso agregado con éxito");
      setTitulo("");
      setDescripcion("");
      setVideoUrl("");
      setImagenUrl("");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "20px" }}>📊 Dashboard de Avisos</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          maxWidth: "400px",
        }}
      >
        {/* Selección de tipo */}
        <label>
          Tipo de aviso:
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="texto">📝 Texto</option>
            <option value="video">🎥 Video</option>
            <option value="imagen">🖼 Imagen</option>
          </select>
        </label>

        {/* Título común */}
        <input
          type="text"
          placeholder="Título (opcional)"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        {/* Campos según tipo */}
        {tipo === "texto" && (
          <textarea
            placeholder="Escribe el aviso en texto..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
          />
        )}

        {tipo === "video" && (
          <input
            type="text"
            placeholder="URL del video"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            required
          />
        )}

        {tipo === "imagen" && (
          <input
            type="text"
            placeholder="URL de la imagen"
            value={imagenUrl}
            onChange={(e) => setImagenUrl(e.target.value)}
            required
          />
        )}

        <button
          type="submit"
          style={{
            padding: "10px",
            background: "blue",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Agregar Aviso
        </button>
      </form>

      {message && <p style={{ marginTop: "20px" }}>{message}</p>}
    </div>
  );
}
