"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PuzzleForm from "@/components/puzzles/PuzzleForm";
import api from "@/lib/api";

export default function EditPuzzlePage() {
  const params = useParams();
  const id = params.id as string;
  const [puzzle, setPuzzle] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<any>(`/admin/puzzles/${id}`)
      .then((res) => setPuzzle(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : "Puzzle not found"));
  }, [id]);

  return (
    <div className="min-h-screen px-4 sm:px-5 py-6 sm:py-8" style={{ background: "var(--bw-bg)", color: "var(--bw-ink)" }}>
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-2xl sm:text-3xl tracking-tight mb-6" style={{ fontFamily: "var(--bw-font-display)" }}>
          Edit Puzzle
        </h1>
        {error && <p className="text-sm" style={{ color: "rgb(220,38,38)" }}>{error}</p>}
        {!puzzle && !error && <p style={{ color: "var(--bw-muted)" }}>Loading…</p>}
        {puzzle && (
          <PuzzleForm
            submitLabel="Save Puzzle"
            initial={{
              name: puzzle.name ?? "",
              details: puzzle.details ?? "",
              isActive: puzzle.isActive !== false,
              thumbnail: puzzle.thumbnail ?? "",
              maxImages: puzzle.maxImages ?? 1,
              sellingPrice: puzzle.pricing?.sellingPrice ?? "",
              costPrice: puzzle.pricing?.costPrice ?? "",
              currency: puzzle.pricing?.currency ?? "BDT",
            }}
            onSubmit={async (body) => {
              await api.put(`/admin/puzzles/${id}`, body);
            }}
          />
        )}
      </div>
    </div>
  );
}
