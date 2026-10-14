"use client";

import PuzzleForm from "@/components/puzzles/PuzzleForm";
import api from "@/lib/api";

export default function CreatePuzzlePage() {
  return (
    <div className="min-h-screen px-4 sm:px-5 py-6 sm:py-8" style={{ background: "var(--bw-bg)", color: "var(--bw-ink)" }}>
      <div className="max-w-[1400px] mx-auto">
        <h1 className="text-2xl sm:text-3xl tracking-tight mb-6" style={{ fontFamily: "var(--bw-font-display)" }}>
          Create Puzzle
        </h1>
        <PuzzleForm
          submitLabel="Create Puzzle"
          onSubmit={async (body) => {
            await api.post("/admin/puzzles", body);
          }}
        />
      </div>
    </div>
  );
}
