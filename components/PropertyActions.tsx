"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PropertyActions({ id, isPublished }: { id: string; isPublished: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [published, setPublished] = useState(isPublished);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    const res = await fetch(`/api/properties/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    } else {
      setError("No se pudo eliminar. Intenta de nuevo.");
      setDeleting(false);
      setConfirming(false);
    }
  };

  const handleTogglePublish = async () => {
    setToggling(true);
    setError(null);
    const next = !published;
    const res = await fetch(`/api/properties/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_published: next }),
    });
    if (res.ok) {
      setPublished(next);
    } else {
      setError("No se pudo actualizar. Intenta de nuevo.");
    }
    setToggling(false);
  };

  return (
    <div style={{ marginTop: 12 }}>
      {/* Fila 1: Publicar / Despublicar */}
      <button
        onClick={handleTogglePublish}
        disabled={toggling}
        style={{
          width: "100%", marginBottom: 8,
          fontSize: 12, fontWeight: 700,
          color: published ? "#9090b8" : "#00f5a0",
          border: `1px solid ${published ? "rgba(144,144,184,0.25)" : "rgba(0,245,160,0.35)"}`,
          borderRadius: 8, padding: "6px 12px",
          background: published ? "transparent" : "rgba(0,245,160,0.06)",
          cursor: toggling ? "not-allowed" : "pointer",
          fontFamily: "inherit", opacity: toggling ? 0.6 : 1,
          transition: "all 0.15s",
        }}
      >
        {toggling ? "..." : published ? "⏸ Despublicar" : "✓ Publicar"}
      </button>

      {/* Fila 2: Editar + Eliminar */}
      <div style={{ display: "flex", gap: 8 }}>
        <Link
          href={`/mis-propiedades/${id}/editar`}
          style={{
            flex: 1, textAlign: "center",
            fontSize: 12, fontWeight: 700, color: "#00b4d8",
            border: "1px solid rgba(0,180,216,0.3)", borderRadius: 8,
            padding: "6px 12px", textDecoration: "none",
          }}
        >
          Editar
        </Link>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            style={{
              flex: 1, fontSize: 12, fontWeight: 700, color: "#ff6b6b",
              border: "1px solid rgba(255,107,107,0.3)", borderRadius: 8,
              padding: "6px 12px", background: "transparent", cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Eliminar
          </button>
        ) : (
          <div style={{ flex: 1, display: "flex", gap: 4 }}>
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                flex: 1, fontSize: 11, fontWeight: 700, color: "#ff6b6b",
                border: "1px solid rgba(255,107,107,0.5)", borderRadius: 8,
                padding: "6px 8px", background: "rgba(255,107,107,0.1)",
                cursor: deleting ? "not-allowed" : "pointer", fontFamily: "inherit",
                opacity: deleting ? 0.6 : 1,
              }}
            >
              {deleting ? "..." : "¿Confirmar?"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              disabled={deleting}
              style={{
                fontSize: 11, color: "#6b6b9a",
                border: "1px solid #2a2a4a", borderRadius: 8,
                padding: "6px 10px", background: "transparent",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {error && (
        <p style={{ fontSize: 11, color: "#ff6b6b", marginTop: 6, marginBottom: 0 }}>
          {error}
        </p>
      )}
    </div>
  );
}
