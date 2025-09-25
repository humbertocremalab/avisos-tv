"use client";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function DisplayPage() {
  const [avisos, setAvisos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  const ROTATION_TIME = 7000; // ms para texto/imagen

  // Traer avisos iniciales
  const fetchAvisos = async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setAvisos(data || []);
      if (currentIndex >= (data?.length || 0)) setCurrentIndex(0);
    } else {
      console.error("❌ Error al cargar avisos:", error);
    }
  };

  // Suscripción real-time: actualizar estado según payload (insert / update / delete)
  useEffect(() => {
    fetchAvisos();

    const handleChange = (payload) => {
      // payload can contain: eventType OR event, and new/old rows
      const event = payload.eventType || payload.event || payload.type;
      const newRow = payload.new || payload.record || null;
      const oldRow = payload.old || null;

      setAvisos((prev) => {
        if (!event) {
          // fallback: recargar
          fetchAvisos();
          return prev;
        }

        const ev = String(event).toUpperCase();

        if (ev === "INSERT") {
          if (!newRow) return prev;
          // evitar duplicados si ya existe
          if (prev.some((p) => p.id === newRow.id)) return prev;
          return [newRow, ...prev];
        }

        if (ev === "UPDATE") {
          if (!newRow) return prev;
          return prev.map((p) => (p.id === newRow.id ? newRow : p));
        }

        if (ev === "DELETE") {
          const filtered = prev.filter((p) => p.id !== (oldRow ? oldRow.id : null));
          // ajustar índice de carrusel en función del elemento eliminado
          setCurrentIndex((ci) => {
            if (filtered.length === 0) return 0;
            // si el elemento eliminado estaba antes del índice, decrementar
            const removedIdx = prev.findIndex((p) => p.id === (oldRow ? oldRow.id : null));
            if (removedIdx === -1) {
              return ci >= filtered.length ? 0 : ci;
            }
            if (removedIdx < ci) return Math.max(ci - 1, 0);
            if (ci >= filtered.length) return 0;
            return ci;
          });
          return filtered;
        }

        // fallback: recargar todo
        fetchAvisos();
        return prev;
      });
    };

    const channel = supabase
      .channel("avisos-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "avisos" },
        handleChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  // Control del carrusel: para texto/imagen usamos timeout, para video escuchamos ended
  useEffect(() => {
    if (!avisos || avisos.length === 0) return;

    const current = avisos[currentIndex];
    let timer;

    // Si es video, usar ref para escuchar ended
    if (current && (current.tipo === "video" || current.tipo === "Video" || current.tipo === "VIDEO")) {
      // small delay para asegurar que el <video> se haya montado
      setTimeout(() => {
        const v = videoRef.current;
        if (!v) return;
        const onEnded = () => {
          setCurrentIndex((prev) => (prev + 1) % Math.max(1, avisos.length));
        };
        v.removeEventListener("ended", onEnded); // evitar duplicados
        v.addEventListener("ended", onEnded);
        // intentar reproducir (silenciado)
        v.play().catch(() => {});
      }, 100);
      // cleanup: remover listener cuando cambie aviso
      return () => {
        const v = videoRef.current;
        if (v) {
          v.pause();
          v.currentTime = 0;
          try {
            v.removeEventListener("ended", () => {});
          } catch (e) {}
        }
      };
    } else {
      // texto o imagen: avanzar con timeout
      timer = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % avisos.length);
      }, ROTATION_TIME);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [avisos, currentIndex]);

  if (!avisos || avisos.length === 0) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #4DA6FF, #9B59B6)",
          color: "white",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontFamily: "'Poppins', sans-serif",
          fontWeight: "bold",
          fontSize: "2rem",
        }}
      >
        📺 No hay avisos por mostrar
      </div>
    );
  }

  const aviso = avisos[currentIndex];

  // helper: múltiples nombres posibles (url vs video_url, titulo vs title)
  const videoSrc = aviso.url || aviso.video_url || aviso.videoUrl || aviso.video;
  const imageSrc = aviso.imagen_url || aviso.image_url || aviso.imagenUrl;
  const title = aviso.titulo || aviso.title || "";

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #4DA6FF, #9B59B6)",
        color: "white",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "40px",
        fontFamily: "'Poppins', sans-serif",
        fontWeight: "bold",
      }}
    >
      <div
        key={aviso.id}
        style={{
          background: "rgba(0,0,0,0.55)",
          borderRadius: "16px",
          padding: "30px",
          textAlign: "center",
          width: "80%",
          maxWidth: "900px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          transition: "opacity 0.5s ease",
          overflow: "hidden",
          whiteSpace: "pre-wrap",
          lineHeight: 1.4,
        }}
      >
        {title && (
          <h2 style={{ fontSize: "2rem", marginBottom: "18px", color: "#FFD700" }}>{title}</h2>
        )}

        {String(aviso.tipo).toLowerCase() === "texto" && (
          <p style={{ fontSize: "1.8rem", wordWrap: "break-word" }}>
            {aviso.descripcion}
          </p>
        )}

        {String(aviso.tipo).toLowerCase() === "video" && videoSrc && (
          <video
            ref={videoRef}
            id={`video-${aviso.id}`}
            src={videoSrc}
            style={{ width: "100%", borderRadius: "12px" }}
            autoPlay
            muted
            controls={false}
          />
        )}

        {String(aviso.tipo).toLowerCase() === "imagen" && imageSrc && (
          <img src={imageSrc} alt="aviso" style={{ width: "100%", borderRadius: "12px" }} />
        )}
      </div>
    </div>
  );
}
