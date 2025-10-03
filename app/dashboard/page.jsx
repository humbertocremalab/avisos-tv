"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [tipo, setTipo] = useState("texto");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [avisos, setAvisos] = useState([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeMsg, setYoutubeMsg] = useState("");
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      // Revisar sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");

      // Cargar avisos
      const { data: avisosData, error: avisosError } = await supabase
        .from("avisos")
        .select("*")
        .order("created_at", { ascending: false });
      if (!avisosError) setAvisos(avisosData);

      // Obtener link de YouTube
      const { data: configData, error: configError } = await supabase
        .from("configuracion")
        .select("youtube_url")
        .eq("id", 1)
        .single();
      if (!configError && configData?.youtube_url) setYoutubeUrl(configData.youtube_url);

      // Suscripción a cambios en tiempo real
      const channel = supabase
        .channel("youtube-config")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "configuracion",
            filter: "id=eq.1",
          },
          (payload) => {
            if (payload.new.youtube_url) {
              setYoutubeUrl(payload.new.youtube_url);
            }
          }
        )
        .subscribe();

      return () => supabase.removeChannel(channel);
    };

    init();
  }, []);

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
        const folder = tipo === "video" ? "videos" : "imagenes";
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avisos-media")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("avisos-media")
          .getPublicUrl(filePath);

        if (tipo === "video") url = publicData.publicUrl;
        if (tipo === "imagen") imagen_url = publicData.publicUrl;
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

      // Recargar avisos
      const { data: newAvisos } = await supabase.from("avisos").select("*").order("created_at", { ascending: false });
      if (newAvisos) setAvisos(newAvisos);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  const borrarAviso = async (aviso) => {
    try {
      if (aviso.tipo === "video" && aviso.url) {
        const filePath = aviso.url.split("/avisos-media/")[1];
        if (filePath)
          await supabase.storage.from("avisos-media").remove([filePath]);
      }
      if (aviso.tipo === "imagen" && aviso.imagen_url) {
        const filePath = aviso.imagen_url.split("/avisos-media/")[1];
        if (filePath)
          await supabase.storage.from("avisos-media").remove([filePath]);
      }

      const { error } = await supabase.from("avisos").delete().eq("id", aviso.id);
      if (error) throw error;

      // Recargar avisos
      const { data: newAvisos } = await supabase.from("avisos").select("*").order("created_at", { ascending: false });
      if (newAvisos) setAvisos(newAvisos);
    } catch (err) {
      console.error("Error al borrar aviso:", err.message || err);
      setMessage("❌ Error al eliminar aviso: " + (err.message || ""));
    }
  };

  const handleYoutubeChange = (e) => setYoutubeUrl(e.target.value);

  const handleYoutubeSave = async () => {
    const { error } = await supabase.from("configuracion").update({ youtube_url: youtubeUrl }).eq("id", 1);
    if (error) {
      console.error("Error al guardar URL:", error);
      setYoutubeMsg("❌ Error al guardar URL");
    } else {
      setYoutubeMsg("✅ URL guardada correctamente");
      setTimeout(() => setYoutubeMsg(""), 3000);
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return "";
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : "";
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

  

      {/* Formulario de avisos */}
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
        <label>Tipo de aviso:</label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ccc" }}
        >
          <option value="texto">Texto</option>
          <option value="video">Video</option>
          <option value="imagen">Imagen</option>
        </select>

        <label>Título:</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ccc" }}
        />

        {tipo === "texto" && (
          <>
            <label>Descripción:</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              style={{ padding: "8px", borderRadius: "8px", border: "1px solid #ccc" }}
            />
          </>
        )}

        {(tipo === "video" || tipo === "imagen") && (
          <>
            <label>Archivo ({tipo}):</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept={tipo === "video" ? "video/*" : "image/*"}
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            background: "#0044cc",
            color: "#fff",
            border: "none",
            padding: "10px",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "10px",
          }}
        >
          {loading ? "Guardando..." : "Agregar aviso"}
        </button>
      </form>

      {message && <p style={{ marginTop: "20px", textAlign: "center" }}>{message}</p>}

      {/* Sección de YouTube */}
      <div
        style={{
          maxWidth: "500px",
          margin: "30px auto",
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "12px",
          background: "#fff",
        }}
      >
        <label style={{ fontWeight: "500", color: "#2e2e2eff" }}>Link de YouTube:</label>
        <input
          type="text"
          value={youtubeUrl}
          onChange={handleYoutubeChange}
          placeholder="https://www.youtube.com/watch?v=..."
          style={{ padding: "10px", color: "#2e2e2eff", borderRadius: "8px", border: "1px solid #272727ff", width: "100%", marginTop: "8px" }}
        />
        <button
          onClick={handleYoutubeSave}
          style={{
            marginTop: "10px",
            padding: "8px 12px",
            background: "#28a745",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Guardar Link
        </button>
        {youtubeMsg && <p style={{ marginTop: "10px", color: youtubeMsg.startsWith("❌") ? "red" : "green" }}>{youtubeMsg}</p>}
      </div>

      {/* Lista de avisos */}
      <h2 style={{ marginTop: "40px", textAlign: "center", fontWeight: "600", fontSize: "1.5rem", color: "#000" }}>
        Avisos existentes
      </h2>
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
            }}
          >
            <div>
              <strong style={{ fontSize: "1.1rem" }}>{aviso.titulo || "(sin título)"}</strong>{" "}
              <span style={{ fontSize: "0.9rem", color: "#555" }}>[{aviso.tipo}]</span>
              {aviso.tipo === "texto" && <p style={{ whiteSpace: "pre-wrap" }}>{aviso.descripcion}</p>}
              {aviso.tipo === "video" && <p>🎬 Video subido</p>}
              {aviso.tipo === "imagen" && (
                <img src={aviso.imagen_url} alt="preview" style={{ borderRadius: "12px", maxWidth: "100%" }} />
              )}
            </div>
            <button
              onClick={() => borrarAviso(aviso)}
              style={{
                background: "red",
                color: "white",
                border: "none",
                padding: "8px 12px",
                borderRadius: "8px",
                cursor: "pointer",
                marginTop: "10px",
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
