"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import AvisoCard from "../components/AvisoCard";

export default function DisplayPage() {
  const [avisos, setAvisos] = useState([]);
  const [index, setIndex] = useState(0);

  // cargar avisos
  useEffect(() => {
    const fetchAvisos = async () => {
      const { data, error } = await supabase
        .from("avisos")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        // marcar como nuevos los recién insertados
        const withFlags = data.map((a) => ({
          ...a,
          isNew: true,
        }));
        setAvisos(withFlags);
      }
    };

    fetchAvisos();

    // realtime supabase para nuevos avisos
    const channel = supabase
      .channel("avisos-changes")
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

  // rotar avisos en carrusel
  useEffect(() => {
    if (avisos.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % avisos.length);
    }, 5000); // ⏱️ cada 5 segs
    return () => clearInterval(interval);
  }, [avisos]);

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f4f4f4",
      }}
    >
      {avisos.length > 0 ? (
        <AvisoCard aviso={avisos[index]} />
      ) : (
        <p>No hay avisos aún</p>
      )}
    </div>
  );
}
