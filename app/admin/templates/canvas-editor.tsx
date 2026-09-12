"use client";

import React, { useRef, useEffect, useState } from "react";

export interface CanvasPlaceholder {
  id: string;
  key: string;
  label: string;
  required: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  backgroundFit: "contain" | "cover" | "fill";
}

interface CanvasEditorProps {
  backgroundImage?: string;
  placeholders?: CanvasPlaceholder[];
  onChange?: (data: {
    backgroundImage: string;
    imagePlaceholders: CanvasPlaceholder[];
  }) => void;
  readOnly?: boolean;
}

// A4 dimensions
const A4_WIDTH = 210; // mm
const A4_HEIGHT = 297; // mm
const DPI = 96;
const SCALE = DPI / 25.4; // pixels per mm

export const A4_WIDTH_PX = Math.round(A4_WIDTH * SCALE); // ~794px
export const A4_HEIGHT_PX = Math.round(A4_HEIGHT * SCALE); // ~1123px

const HANDLE_SIZE = 8;
const MIN_SIZE = 30;

export default function CanvasEditor({
  backgroundImage: initialBg = "",
  placeholders: initialPlaceholders = [],
  onChange,
  readOnly = false,
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [backgroundImage, setBackgroundImage] = useState<string>(initialBg);
  const [placeholders, setPlaceholders] = useState<CanvasPlaceholder[]>(
    initialPlaceholders
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mouseDown, setMouseDown] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);

  // Calculate canvas scale to fit in container
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 40;
        const scale = Math.min(containerWidth / A4_WIDTH_PX, 1);
        setCanvasScale(scale);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw A4 page background
    ctx.fillStyle = "#f9fafb";
    ctx.fillRect(0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);

    // Draw background image if available
    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(img, 0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);
        ctx.restore();
      };
      img.src = backgroundImage;
    }

    // Draw placeholders
    placeholders.forEach((placeholder) => {
      const isSelected = selectedId === placeholder.id;

      ctx.save();
      ctx.translate(
        placeholder.x + placeholder.width / 2,
        placeholder.y + placeholder.height / 2
      );
      ctx.rotate((placeholder.rotation * Math.PI) / 180);

      // Draw rectangle
      ctx.fillStyle = isSelected ? "rgba(59,130,246,0.25)" : "rgba(59,130,246,0.12)";
      ctx.strokeStyle = isSelected ? "#3b82f6" : "#bfdbfe";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.fillRect(
        -placeholder.width / 2,
        -placeholder.height / 2,
        placeholder.width,
        placeholder.height
      );
      ctx.strokeRect(
        -placeholder.width / 2,
        -placeholder.height / 2,
        placeholder.width,
        placeholder.height
      );

      // Draw label
      if (placeholder.label) {
        ctx.font = "bold 12px sans-serif";
        ctx.fillStyle = "#1f2937";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(placeholder.label, 0, 0);
      }

      ctx.restore();

      // Draw handles if selected
      if (isSelected && !readOnly) {
        drawHandles(ctx, placeholder);
      }
    });
  }, [backgroundImage, placeholders, selectedId, readOnly]);

  function drawHandles(ctx: CanvasRenderingContext2D, placeholder: CanvasPlaceholder) {
    const corners = [
      { x: placeholder.x, y: placeholder.y },
      { x: placeholder.x + placeholder.width, y: placeholder.y },
      { x: placeholder.x, y: placeholder.y + placeholder.height },
      { x: placeholder.x + placeholder.width, y: placeholder.y + placeholder.height },
    ];

    corners.forEach((corner) => {
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(
        corner.x - HANDLE_SIZE / 2,
        corner.y - HANDLE_SIZE / 2,
        HANDLE_SIZE,
        HANDLE_SIZE
      );
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        corner.x - HANDLE_SIZE / 2,
        corner.y - HANDLE_SIZE / 2,
        HANDLE_SIZE,
        HANDLE_SIZE
      );
    });

    // Rotation handle
    const rotateHandleY = placeholder.y - 30;
    ctx.fillStyle = "#ec4899";
    ctx.beginPath();
    ctx.arc(placeholder.x + placeholder.width / 2, rotateHandleY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function handleBackgroundUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setBackgroundImage(dataUrl);
        onChange?.({ backgroundImage: dataUrl, imagePlaceholders: placeholders });
      };
      reader.readAsDataURL(file);
    }
  }

  function getMousePos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / canvasScale,
      y: (e.clientY - rect.top) / canvasScale,
    };
  }

  function isPointInPlaceholder(x: number, y: number, placeholder: CanvasPlaceholder): boolean {
    return x >= placeholder.x && x <= placeholder.x + placeholder.width && y >= placeholder.y && y <= placeholder.y + placeholder.height;
  }

  function getResizeHandle(x: number, y: number, placeholder: CanvasPlaceholder): string | null {
    const threshold = HANDLE_SIZE + 5;
    if (Math.abs(x - placeholder.x) < threshold && Math.abs(y - placeholder.y) < threshold) return "nw";
    if (Math.abs(x - (placeholder.x + placeholder.width)) < threshold && Math.abs(y - placeholder.y) < threshold) return "ne";
    if (Math.abs(x - placeholder.x) < threshold && Math.abs(y - (placeholder.y + placeholder.height)) < threshold) return "sw";
    if (Math.abs(x - (placeholder.x + placeholder.width)) < threshold && Math.abs(y - (placeholder.y + placeholder.height)) < threshold) return "se";
    return null;
  }

  function getRotationHandle(x: number, y: number, placeholder: CanvasPlaceholder): boolean {
    const rotateHandleY = placeholder.y - 30;
    const rotateHandleX = placeholder.x + placeholder.width / 2;
    const distance = Math.sqrt(Math.pow(x - rotateHandleX, 2) + Math.pow(y - rotateHandleY, 2));
    return distance < 12;
  }

  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (readOnly) return;
    const { x, y } = getMousePos(e);
    setMouseDown(true);

    for (const placeholder of placeholders) {
      if (getRotationHandle(x, y, placeholder)) {
        setRotatingId(placeholder.id);
        setSelectedId(placeholder.id);
        return;
      }
    }

    const selected = placeholders.find((p) => p.id === selectedId);
    if (selected) {
      const handle = getResizeHandle(x, y, selected);
      if (handle) {
        setResizingId(selected.id);
        setResizeHandle(handle);
        return;
      }
    }

    for (const placeholder of placeholders) {
      if (isPointInPlaceholder(x, y, placeholder)) {
        setSelectedId(placeholder.id);
        setDraggingId(placeholder.id);
        setDragOffset({ x: x - placeholder.x, y: y - placeholder.y });
        return;
      }
    }

    setSelectedId(null);
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (readOnly) return;
    const { x, y } = getMousePos(e);

    if (rotatingId && mouseDown) {
      const placeholder = placeholders.find((p) => p.id === rotatingId);
      if (placeholder) {
        const centerX = placeholder.x + placeholder.width / 2;
        const centerY = placeholder.y + placeholder.height / 2;
        let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;
        angle = (angle + 360) % 360;
        const updated = placeholders.map((p) => (p.id === rotatingId ? { ...p, rotation: Math.round(angle) } : p));
        setPlaceholders(updated);
        onChange?.({ backgroundImage, imagePlaceholders: updated });
      }
      return;
    }

    if (resizingId && resizeHandle && mouseDown) {
      const placeholder = placeholders.find((p) => p.id === resizingId);
      if (placeholder) {
        let newX = placeholder.x;
        let newY = placeholder.y;
        let newWidth = placeholder.width;
        let newHeight = placeholder.height;

        if (resizeHandle.includes("n")) {
          newY = Math.min(y, placeholder.y + placeholder.height - MIN_SIZE);
          newHeight = Math.max(MIN_SIZE, placeholder.y + placeholder.height - newY);
        }
        if (resizeHandle.includes("s")) newHeight = Math.max(MIN_SIZE, y - placeholder.y);
        if (resizeHandle.includes("w")) {
          newX = Math.min(x, placeholder.x + placeholder.width - MIN_SIZE);
          newWidth = Math.max(MIN_SIZE, placeholder.x + placeholder.width - newX);
        }
        if (resizeHandle.includes("e")) newWidth = Math.max(MIN_SIZE, x - placeholder.x);

        const updated = placeholders.map((p) => (p.id === resizingId ? { ...p, x: newX, y: newY, width: newWidth, height: newHeight } : p));
        setPlaceholders(updated);
        onChange?.({ backgroundImage, imagePlaceholders: updated });
      }
      return;
    }

    if (draggingId && mouseDown) {
      const placeholder = placeholders.find((p) => p.id === draggingId);
      if (placeholder) {
        const newX = Math.max(0, Math.min(x - dragOffset.x, A4_WIDTH_PX - placeholder.width));
        const newY = Math.max(0, Math.min(y - dragOffset.y, A4_HEIGHT_PX - placeholder.height));
        const updated = placeholders.map((p) => (p.id === draggingId ? { ...p, x: newX, y: newY } : p));
        setPlaceholders(updated);
        onChange?.({ backgroundImage, imagePlaceholders: updated });
      }
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const selected = placeholders.find((p) => p.id === selectedId);
      if (selected && getResizeHandle(x, y, selected)) {
        const handle = getResizeHandle(x, y, selected);
        canvas.style.cursor = handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize";
      } else if (selected && getRotationHandle(x, y, selected)) {
        canvas.style.cursor = "grab";
      } else {
        canvas.style.cursor = "default";
      }
    }
  }

  function handleCanvasMouseUp() {
    setMouseDown(false);
    setDraggingId(null);
    setResizingId(null);
    setRotatingId(null);
  }

  function addPlaceholder() {
    const newPlaceholder: CanvasPlaceholder = {
      id: Math.random().toString(36).substr(2, 9),
      key: `placeholder_${placeholders.length + 1}`,
      label: `Image ${placeholders.length + 1}`,
      required: false,
      x: 50,
      y: 50,
      width: 200,
      height: 150,
      rotation: 0,
      backgroundFit: "cover",
    };
    const updated = [...placeholders, newPlaceholder];
    setPlaceholders(updated);
    setSelectedId(newPlaceholder.id);
    onChange?.({ backgroundImage, imagePlaceholders: updated });
  }

  function deletePlaceholder(id: string) {
    const updated = placeholders.filter((p) => p.id !== id);
    setPlaceholders(updated);
    if (selectedId === id) setSelectedId(null);
    onChange?.({ backgroundImage, imagePlaceholders: updated });
  }

  function updatePlaceholder(id: string, field: string, value: any) {
    const updated = placeholders.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    setPlaceholders(updated);
    onChange?.({ backgroundImage, imagePlaceholders: updated });
  }

  const selected = placeholders.find((p) => p.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ fontFamily: "var(--bw-font-display)" }}>
          Canvas Template Editor
        </h3>
        {!readOnly && placeholders.length > 0 && (
          <p className="text-sm" style={{ color: "var(--bw-muted)" }}>
            {placeholders.length} placeholder{placeholders.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Background Upload */}
      {!readOnly && (
        <div className="rounded-[var(--bw-radius-md)] p-4 border" style={{ background: "var(--bw-bg)", borderColor: "var(--bw-border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Background Image</span>
              {backgroundImage && <span className="text-xs" style={{ color: "var(--bw-green)" }}>✓ Loaded</span>}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer"
              style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
            >
              📁 Upload PNG
            </button>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleBackgroundUpload} className="hidden" />
          </div>
        </div>
      )}

      {/* Main Canvas & Properties Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Canvas Area */}
        <div className="lg:col-span-3">
          <div ref={containerRef} className="rounded-[var(--bw-radius-lg)] p-5" style={{ background: "var(--bw-bg)", border: "1px solid var(--bw-border)", display: "flex", justifyContent: "center", alignItems: "flex-start", minHeight: "600px" }}>
            <div style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}>
              <canvas
                ref={canvasRef}
                width={A4_WIDTH_PX}
                height={A4_HEIGHT_PX}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                style={{ display: "block", backgroundColor: "#ffffff", cursor: readOnly ? "default" : "crosshair", border: "1px solid #e5e7eb" }}
              />
            </div>
          </div>

          {!readOnly && (
            <button
              onClick={addPlaceholder}
              className="mt-4 w-full px-4 py-2.5 text-sm font-semibold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer"
              style={{ background: "var(--bw-green)", color: "var(--bw-bg)" }}
            >
              + Add Placeholder Zone
            </button>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Properties Panel */}
          <div className="rounded-[var(--bw-radius-lg)] p-4 border" style={{ background: "var(--bw-surface)", borderColor: "var(--bw-border)" }}>
            <h4 className="text-sm font-bold mb-4" style={{ fontFamily: "var(--bw-font-display)" }}>
              Properties
            </h4>

            {!selected ? (
              <p className="text-xs text-center" style={{ color: "var(--bw-muted)" }}>
                Click a zone to edit
              </p>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--bw-ghost)" }}>
                    Key
                  </label>
                  <input type="text" value={selected.key} onChange={(e) => updatePlaceholder(selected.id, "key", e.target.value)} className="bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] px-2 py-1.5 text-xs text-[var(--bw-ink)] outline-none w-full" disabled={readOnly} />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--bw-ghost)" }}>
                    Label
                  </label>
                  <input type="text" value={selected.label} onChange={(e) => updatePlaceholder(selected.id, "label", e.target.value)} className="bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] px-2 py-1.5 text-xs text-[var(--bw-ink)] outline-none w-full" disabled={readOnly} />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                  <input type="checkbox" checked={selected.required} onChange={(e) => updatePlaceholder(selected.id, "required", e.target.checked)} className="w-3 h-3 rounded cursor-pointer" disabled={readOnly} />
                  <span>Required</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>
                      X
                    </label>
                    <input type="number" value={Math.round(selected.x)} onChange={(e) => updatePlaceholder(selected.id, "x", parseInt(e.target.value, 10))} className="bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] px-2 py-1.5 text-xs text-[var(--bw-ink)] outline-none w-full" disabled={readOnly} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>
                      Y
                    </label>
                    <input type="number" value={Math.round(selected.y)} onChange={(e) => updatePlaceholder(selected.id, "y", parseInt(e.target.value, 10))} className="bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] px-2 py-1.5 text-xs text-[var(--bw-ink)] outline-none w-full" disabled={readOnly} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>
                      W
                    </label>
                    <input type="number" value={Math.round(selected.width)} onChange={(e) => updatePlaceholder(selected.id, "width", Math.max(30, parseInt(e.target.value, 10)))} className="bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] px-2 py-1.5 text-xs text-[var(--bw-ink)] outline-none w-full" disabled={readOnly} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>
                      H
                    </label>
                    <input type="number" value={Math.round(selected.height)} onChange={(e) => updatePlaceholder(selected.id, "height", Math.max(30, parseInt(e.target.value, 10)))} className="bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] px-2 py-1.5 text-xs text-[var(--bw-ink)] outline-none w-full" disabled={readOnly} />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold block mb-2" style={{ color: "var(--bw-ghost)" }}>
                    Rotate ({selected.rotation}°)
                  </label>
                  <input type="range" min="0" max="360" value={selected.rotation} onChange={(e) => updatePlaceholder(selected.id, "rotation", parseInt(e.target.value, 10))} className="w-full" disabled={readOnly} />
                </div>

                <div>
                  <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>
                    Fit
                  </label>
                  <select value={selected.backgroundFit} onChange={(e) => updatePlaceholder(selected.id, "backgroundFit", e.target.value as "contain" | "cover" | "fill")} className="bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] px-2 py-1.5 text-xs text-[var(--bw-ink)] outline-none w-full cursor-pointer" disabled={readOnly}>
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                    <option value="fill">Fill</option>
                  </select>
                </div>

                {!readOnly && (
                  <button onClick={() => deletePlaceholder(selected.id)} className="w-full px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer" style={{ background: "rgba(220,38,38,0.15)", color: "rgb(220,38,38)" }}>
                    🗑️ Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Placeholders List */}
          {placeholders.length > 0 && (
            <div className="rounded-[var(--bw-radius-lg)] p-4 border max-h-96 overflow-y-auto" style={{ background: "var(--bw-surface)", borderColor: "var(--bw-border)" }}>
              <h4 className="text-xs font-bold mb-3" style={{ fontFamily: "var(--bw-font-display)" }}>
                Zones ({placeholders.length})
              </h4>

              <div className="space-y-1.5">
                {placeholders.map((placeholder) => (
                  <button
                    key={placeholder.id}
                    onClick={() => setSelectedId(placeholder.id)}
                    className="w-full text-left rounded-[var(--bw-radius-md)] p-2.5 border transition-all text-xs"
                    style={{ background: selectedId === placeholder.id ? "var(--bw-bg)" : "transparent", borderColor: selectedId === placeholder.id ? "var(--bw-ink)" : "var(--bw-border)", cursor: "pointer" }}
                  >
                    <p className="font-semibold">{placeholder.label}</p>
                    <code className="text-[10px]" style={{ color: "var(--bw-muted)", fontFamily: "var(--bw-font-mono)" }}>
                      {placeholder.key}
                    </code>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}