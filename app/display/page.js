"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabaseClient";
import confetti from "canvas-confetti";

export default function DisplayPage() {
  const [avisos, setAvisos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sonidoActivo, setSonidoActivo] = useState(false);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchAvisos();

    // Suscripción en tiempo real
    const channel = supabase
      .channel("realtime:avisos")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "avisos" },
        (payload) => {
          setAvisos((prev) => [
            { ...payload.new, isNew: true },
            ...prev,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAvisos = async () => {
    let { data, error } = await supabase
      .from("avisos")
      .select("*")
      .order("id", { ascending: false });

    if (!error) {
      const avisosConFlag = data.map((aviso) => ({
        ...aviso,
        isNew: false,
      }));
      setAvisos(avisosConFlag);
    }
  };

  // rotación de carrusel
  useEffect(() => {
    if (avisos.length > 0) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % avisos.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [avisos]);

  // sonido + confeti al detectar nuevo aviso
  useEffect(() => {
    if (avisos.length > 0) {
      const aviso = avisos[currentIndex];

      if (aviso.isNew) {
        if (sonidoActivo && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(() => {});
        }

        if (canvasRef.current) {
          const myConfetti = confetti.create(canvasRef.current, {
            resize: true,
            useWorker: true,
          });
          myConfetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
          });
        }

        // quitar bandera después de 5 seg
        setTimeout(() => {
          aviso.isNew = false;
        }, 5000);
      }
    }
  }, [currentIndex, avisos, sonidoActivo]);

  return (
    <div
      style={{
        transform: "rotate(90deg)", // 👈 rotación al lado izquierdo
        transformOrigin: "center",
        width: "100vh",
        height: "100vw",
        overflow: "hidden",
        position: "relative",
        background: "#f0f0f0",
      }}
    >
      {/* Canvas para confeti */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      {/* Botón de sonido */}
      <button
        onClick={() => setSonidoActivo(!sonidoActivo)}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          zIndex: 20,
          padding: "10px 20px",
          borderRadius: "8px",
          background: sonidoActivo ? "#4caf50" : "#f44336",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        {sonidoActivo ? "🔊 Sonido ON" : "🔇 Sonido OFF"}
      </button>

      {/* Audio precargado */}
      <audio ref={audioRef} src="/audio/alerta.ogg" preload="auto" />

      {/* Avisos */}
      {avisos.length > 0 ? (
        <div
          style={{
            background: avisos[currentIndex].isNew ? "#e0f7fa" : "#fff",
            padding: "20px",
            borderRadius: "10px",
            margin: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <h3>{avisos[currentIndex].titulo}</h3>
          <p>{avisos[currentIndex].descripcion}</p>
        </div>
      ) : (
        <p style={{ padding: "20px" }}>No hay avisos</p>
      )}
    </div>
  );
}
