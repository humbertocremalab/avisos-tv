"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [tipo, setTipo] = useState("texto");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [avisos, setAvisos] = useState([]);
  const router = useRouter();

  // --- Verificación de sesión ---
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
    };
    checkSession();

    cargarAvisos();
  }, []);

  const cargarAvisos = async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setAvisos(data);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.push("/login");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    let url = null;
    let imagen_url = null;

    try {
      if ((tipo === "video" || tipo === "imagen") && file) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const folder = tipo === "video" ? "videos" : "imagens";
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avisos-media")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("avisos-media")
          .getPublicUrl(filePath);

        if (tipo === "video") {
  const { data: publicData } = supabase
    .storage
    .from("avisos-media")
    .getPublicUrl(filePath);
  url = publicData.publicUrl;
}

if (tipo === "imagen") {
  const { data: publicData } = supabase
    .storage
    .from("avisos-media")
    .getPublicUrl(filePath);
  imagen_url = publicData.publicUrl;
}
      }

      const { error } = await supabase.from("avisos").insert([
        {
          tipo,
          titulo,
          descripcion: tipo === "texto" ? descripcion : null,
          url,
          imagen_url,
        },
      ]);

      if (error) throw error;

      setMessage("✅ Aviso agregado con éxito");
      setTitulo("");
      setDescripcion("");
      setFile(null);
      cargarAvisos();
    } catch (err) {
      console.error(err);
      setMessage("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const borrarAviso = async (id) => {
    const { error } = await supabase.from("avisos").delete().eq("id", id);
    if (!error) cargarAvisos();
  };

  return (
    <div style={{ padding: "20px", fontFamily: "'Poppins', sans-serif", background: "#f4f6f8", minHeight: "100vh", position: "relative" }}>
      <button
        onClick={handleLogout}
        style={{ padding: "10px 16px", background: "red", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", position: "absolute", top: "20px", right: "20px", fontWeight: "600" }}
      >
        Cerrar sesión
      </button>

      <h1 style={{ fontSize: "2rem", marginBottom: "20px", textAlign: "center", fontWeight: "600", color: "#0044cc" }}>
        Dashboard de Avisos
      </h1>

      {/* Formulario */}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "420px", margin: "0 auto", padding: "20px", border: "1px solid #e0e0e0", borderRadius: "16px", background: "#fff", color: "#000", boxShadow: "0 4px 8px rgba(0,0,0,0.05)" }}>
        <label style={{ fontWeight: "500" }}>
          Tipo de aviso:
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ padding: "10px", fontSize: "1rem", borderRadius: "8px", border: "1px solid #ccc", width: "100%", marginTop: "5px" }}>
            <option value="texto">Texto</option>
            <option value="video">Video</option>
            <option value="imagen">Imagen</option>
          </select>
        </label>

        <input
          type="text"
          placeholder="Título (opcional)"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          style={{ padding: "10px", fontSize: "1rem", borderRadius: "8px", border: "1px solid #ccc", color: "#000" }}
        />

        {tipo === "texto" && (
          <textarea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            style={{ padding: "10px", fontSize: "1rem", borderRadius: "8px", border: "1px solid #ccc", minHeight: "100px" }}
            required
          />
        )}

        {(tipo === "video" || tipo === "imagen") && (
          <input
            type="file"
            accept={tipo === "imagen" ? "image/*" : "video/*"}
            onChange={(e) => setFile(e.target.files[0])}
            style={{ marginTop: "10px" }}
            required
          />
        )}

        <button type="submit" disabled={loading} style={{ padding: "12px", background: "#0070f3", color: "white", fontSize: "1.1rem", fontWeight: "600", border: "none", borderRadius: "10px", cursor: "pointer", marginTop: "10px" }}>
          {loading ? "Guardando..." : "Agregar Aviso"}
        </button>
      </form>

      {message && <p style={{ marginTop: "20px", textAlign: "center" }}>{message}</p>}

      {/* Lista de avisos */}
      <h2 style={{ marginTop: "40px", textAlign: "center", fontWeight: "600", fontSize: "1.5rem", color: "#000" }}>Avisos existentes</h2>
      <div style={{ maxWidth: "600px", margin: "20px auto" }}>
        {avisos.map((aviso) => (
          <div key={aviso.id} style={{ border: "1px solid #e0e0e0", borderRadius: "12px", padding: "16px", marginBottom: "16px", background: "#fff", color: "#000", boxShadow: "0 4px 8px rgba(0,0,0,0.05)" }}>
            <div>
              <strong style={{ fontSize: "1.1rem" }}>{aviso.titulo || "(sin título)"}</strong>{" "}
              <span style={{ fontSize: "0.9rem", color: "#555" }}>[{aviso.tipo}]</span>
              {aviso.tipo === "texto" && <p>{aviso.descripcion}</p>}
              {aviso.tipo === "video" && <p>🎬 Video subido</p>}
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
            <button onClick={() => borrarAviso(aviso.id)} style={{ background: "red", color: "white", border: "none", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", marginTop: "10px" }}>
              Eliminar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
