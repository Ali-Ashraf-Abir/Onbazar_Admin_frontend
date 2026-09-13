"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";

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

export interface CanvasTextPlaceholder {
  id: string;
  key: string;
  label: string;
  required: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  fontFamily: string;
  fontUrl: string | null;
  fontFormat: "woff2" | "woff" | "truetype" | "opentype" | "embedded-opentype" | null;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  color: string;
  textAlign: "left" | "center" | "right" | "justify";
  lineHeight: number;
  letterSpacing: number;
  maxLength: number | null;
  defaultText: string;
  placeholder: string;
}

export interface FontOption {
  _id: string;
  name: string;
  family: string;
  fileUrl: string;
  format: "woff2" | "woff" | "truetype" | "opentype" | "embedded-opentype";
  weight: number;
  style: "normal" | "italic";
}

interface CanvasEditorProps {
  backgroundImage?: string;
  placeholders?: CanvasPlaceholder[];
  textPlaceholders?: CanvasTextPlaceholder[];
  availableFonts?: FontOption[];
  onChange?: (data: {
    backgroundImage: string;
    imagePlaceholders: CanvasPlaceholder[];
    textPlaceholders: CanvasTextPlaceholder[];
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

const SYSTEM_FONTS = [
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Helvetica",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS",
];

type SelectedItem = {
  type: "image" | "text";
  id: string;
};

export default function CanvasEditor({
  backgroundImage: initialBg = "",
  placeholders: initialPlaceholders = [],
  textPlaceholders: initialTextPlaceholders = [],
  availableFonts = [],
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
  const [textPlaceholders, setTextPlaceholders] = useState<CanvasTextPlaceholder[]>(
    initialTextPlaceholders
  );
  const [selected, setSelected] = useState<SelectedItem | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [draggingType, setDraggingType] = useState<"image" | "text" | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizingType, setResizingType] = useState<"image" | "text" | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [rotatingType, setRotatingType] = useState<"image" | "text" | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [mouseDown, setMouseDown] = useState(false);
  const [canvasScale, setCanvasScale] = useState(1);

  // Inject @font-face for custom fonts used in text placeholders
  const fontFaceCss = useMemo(() => {
    const seen = new Set<string>();
    let css = "";
    for (const tp of textPlaceholders) {
      if (!tp.fontUrl || !tp.fontFamily) continue;
      const dedupeKey = `${tp.fontFamily}|${tp.fontWeight}|${tp.fontStyle}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      css += `
@font-face {
  font-family: '${tp.fontFamily}';
  src: url('${tp.fontUrl}') format('${tp.fontFormat || "woff2"}');
  font-weight: ${tp.fontWeight || 400};
  font-style: ${tp.fontStyle || "normal"};
  font-display: swap;
}
`;
    }
    // Also inject available fonts for the preview
    for (const font of availableFonts) {
      const dedupeKey = `${font.family}|${font.weight}|${font.style}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      css += `
@font-face {
  font-family: '${font.family}';
  src: url('${font.fileUrl}') format('${font.format || "woff2"}');
  font-weight: ${font.weight || 400};
  font-style: ${font.style || "normal"};
  font-display: swap;
}
`;
    }
    return css;
  }, [textPlaceholders, availableFonts]);

  function emitChange(
    bg: string,
    imgP: CanvasPlaceholder[],
    txtP: CanvasTextPlaceholder[]
  ) {
    onChange?.({ backgroundImage: bg, imagePlaceholders: imgP, textPlaceholders: txtP });
  }

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
        // Re-draw placeholders on top of image
        drawAllPlaceholders(ctx);
      };
      img.crossOrigin = "anonymous";
      img.src = backgroundImage;
    } else {
      drawAllPlaceholders(ctx);
    }
  }, [backgroundImage, placeholders, textPlaceholders, selected]);

  function drawAllPlaceholders(ctx: CanvasRenderingContext2D) {
    // Draw image placeholders
    placeholders.forEach((placeholder) => {
      const isSelected = selected?.type === "image" && selected?.id === placeholder.id;

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

      // Draw image icon
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("🖼️", 0, placeholder.label ? -18 : 0);

      ctx.restore();

      // Draw handles if selected
      if (isSelected && !readOnly) {
        drawHandles(ctx, placeholder);
      }
    });

    // Draw text placeholders
    textPlaceholders.forEach((tp) => {
      const isSelected2 = selected?.type === "text" && selected?.id === tp.id;

      ctx.save();
      ctx.translate(tp.x + tp.width / 2, tp.y + tp.height / 2);
      ctx.rotate((tp.rotation * Math.PI) / 180);

      // Draw rectangle with distinct styling (green tint for text)
      ctx.fillStyle = isSelected2 ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.08)";
      ctx.strokeStyle = isSelected2 ? "#10b981" : "#a7f3d0";
      ctx.lineWidth = isSelected2 ? 2 : 1;
      ctx.setLineDash(isSelected2 ? [] : [4, 4]);
      ctx.fillRect(-tp.width / 2, -tp.height / 2, tp.width, tp.height);
      ctx.strokeRect(-tp.width / 2, -tp.height / 2, tp.width, tp.height);
      ctx.setLineDash([]);

      // Draw text preview
      const displayText = tp.defaultText || tp.placeholder || tp.label || tp.key;
      const fontSizeForCanvas = Math.min(tp.fontSize || 24, tp.height * 0.6, 40);
      ctx.font = `${tp.fontWeight || 400} ${tp.fontStyle === "italic" ? "italic " : ""}${fontSizeForCanvas}px '${tp.fontFamily || "Arial"}', sans-serif`;
      ctx.fillStyle = tp.color || "#000000";
      ctx.textAlign = (tp.textAlign || "left") as CanvasTextAlign;
      ctx.textBaseline = "middle";

      const textX = tp.textAlign === "center" ? 0 : tp.textAlign === "right" ? tp.width / 2 - 8 : -tp.width / 2 + 8;
      ctx.fillText(displayText, textX, 0, tp.width - 16);

      // Draw type badge
      ctx.font = "bold 9px sans-serif";
      ctx.fillStyle = isSelected2 ? "#065f46" : "#6b7280";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("Aa", -tp.width / 2 + 4, -tp.height / 2 + 4);

      ctx.restore();

      // Draw handles if selected
      if (isSelected2 && !readOnly) {
        drawHandles(ctx, tp);
      }
    });
  }

  function drawHandles(ctx: CanvasRenderingContext2D, placeholder: { x: number; y: number; width: number; height: number }) {
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
        emitChange(dataUrl, placeholders, textPlaceholders);
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

  function isPointInRect(x: number, y: number, rect: { x: number; y: number; width: number; height: number }): boolean {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  function getResizeHandle(x: number, y: number, rect: { x: number; y: number; width: number; height: number }): string | null {
    const threshold = HANDLE_SIZE + 5;
    if (Math.abs(x - rect.x) < threshold && Math.abs(y - rect.y) < threshold) return "nw";
    if (Math.abs(x - (rect.x + rect.width)) < threshold && Math.abs(y - rect.y) < threshold) return "ne";
    if (Math.abs(x - rect.x) < threshold && Math.abs(y - (rect.y + rect.height)) < threshold) return "sw";
    if (Math.abs(x - (rect.x + rect.width)) < threshold && Math.abs(y - (rect.y + rect.height)) < threshold) return "se";
    return null;
  }

  function getRotationHandle(x: number, y: number, rect: { x: number; y: number; width: number; height: number }): boolean {
    const rotateHandleY = rect.y - 30;
    const rotateHandleX = rect.x + rect.width / 2;
    const distance = Math.sqrt(Math.pow(x - rotateHandleX, 2) + Math.pow(y - rotateHandleY, 2));
    return distance < 12;
  }

  function handleCanvasMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (readOnly) return;
    const { x, y } = getMousePos(e);
    setMouseDown(true);

    // Check rotation handles on selected item first
    if (selected) {
      const item = selected.type === "image"
        ? placeholders.find((p) => p.id === selected.id)
        : textPlaceholders.find((p) => p.id === selected.id);
      if (item && getRotationHandle(x, y, item)) {
        setRotatingId(selected.id);
        setRotatingType(selected.type);
        return;
      }
      if (item) {
        const handle = getResizeHandle(x, y, item);
        if (handle) {
          setResizingId(selected.id);
          setResizingType(selected.type);
          setResizeHandle(handle);
          return;
        }
      }
    }

    // Check all rotation handles
    for (const placeholder of placeholders) {
      if (getRotationHandle(x, y, placeholder)) {
        setRotatingId(placeholder.id);
        setRotatingType("image");
        setSelected({ type: "image", id: placeholder.id });
        return;
      }
    }
    for (const tp of textPlaceholders) {
      if (getRotationHandle(x, y, tp)) {
        setRotatingId(tp.id);
        setRotatingType("text");
        setSelected({ type: "text", id: tp.id });
        return;
      }
    }

    // Check click on text placeholders (check text first for higher z-index)
    for (const tp of [...textPlaceholders].reverse()) {
      if (isPointInRect(x, y, tp)) {
        setSelected({ type: "text", id: tp.id });
        setDraggingId(tp.id);
        setDraggingType("text");
        setDragOffset({ x: x - tp.x, y: y - tp.y });
        return;
      }
    }

    // Check click on image placeholders
    for (const placeholder of [...placeholders].reverse()) {
      if (isPointInRect(x, y, placeholder)) {
        setSelected({ type: "image", id: placeholder.id });
        setDraggingId(placeholder.id);
        setDraggingType("image");
        setDragOffset({ x: x - placeholder.x, y: y - placeholder.y });
        return;
      }
    }

    setSelected(null);
  }

  function handleCanvasMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (readOnly) return;
    const { x, y } = getMousePos(e);

    if (rotatingId && mouseDown) {
      const items = rotatingType === "image" ? placeholders : textPlaceholders;
      const item = items.find((p) => p.id === rotatingId);
      if (item) {
        const centerX = item.x + item.width / 2;
        const centerY = item.y + item.height / 2;
        let angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;
        angle = (angle + 360) % 360;

        if (rotatingType === "image") {
          const updated = placeholders.map((p) => (p.id === rotatingId ? { ...p, rotation: Math.round(angle) } : p));
          setPlaceholders(updated);
          emitChange(backgroundImage, updated, textPlaceholders);
        } else {
          const updated = textPlaceholders.map((p) => (p.id === rotatingId ? { ...p, rotation: Math.round(angle) } : p));
          setTextPlaceholders(updated);
          emitChange(backgroundImage, placeholders, updated);
        }
      }
      return;
    }

    if (resizingId && resizeHandle && mouseDown) {
      const isImage = resizingType === "image";
      const items = isImage ? placeholders : textPlaceholders;
      const item = items.find((p) => p.id === resizingId);
      if (item) {
        let newX = item.x;
        let newY = item.y;
        let newWidth = item.width;
        let newHeight = item.height;

        if (resizeHandle.includes("n")) {
          newY = Math.min(y, item.y + item.height - MIN_SIZE);
          newHeight = Math.max(MIN_SIZE, item.y + item.height - newY);
        }
        if (resizeHandle.includes("s")) newHeight = Math.max(MIN_SIZE, y - item.y);
        if (resizeHandle.includes("w")) {
          newX = Math.min(x, item.x + item.width - MIN_SIZE);
          newWidth = Math.max(MIN_SIZE, item.x + item.width - newX);
        }
        if (resizeHandle.includes("e")) newWidth = Math.max(MIN_SIZE, x - item.x);

        if (isImage) {
          const updated = placeholders.map((p) => (p.id === resizingId ? { ...p, x: newX, y: newY, width: newWidth, height: newHeight } : p));
          setPlaceholders(updated);
          emitChange(backgroundImage, updated, textPlaceholders);
        } else {
          const updated = textPlaceholders.map((p) => (p.id === resizingId ? { ...p, x: newX, y: newY, width: newWidth, height: newHeight } : p));
          setTextPlaceholders(updated);
          emitChange(backgroundImage, placeholders, updated);
        }
      }
      return;
    }

    if (draggingId && mouseDown) {
      const isImage = draggingType === "image";
      const items = isImage ? placeholders : textPlaceholders;
      const item = items.find((p) => p.id === draggingId);
      if (item) {
        const newX = Math.max(0, Math.min(x - dragOffset.x, A4_WIDTH_PX - item.width));
        const newY = Math.max(0, Math.min(y - dragOffset.y, A4_HEIGHT_PX - item.height));

        if (isImage) {
          const updated = placeholders.map((p) => (p.id === draggingId ? { ...p, x: newX, y: newY } : p));
          setPlaceholders(updated);
          emitChange(backgroundImage, updated, textPlaceholders);
        } else {
          const updated = textPlaceholders.map((p) => (p.id === draggingId ? { ...p, x: newX, y: newY } : p));
          setTextPlaceholders(updated);
          emitChange(backgroundImage, placeholders, updated);
        }
      }
    }

    // Update cursor
    const canvas = canvasRef.current;
    if (canvas) {
      if (selected) {
        const item = selected.type === "image"
          ? placeholders.find((p) => p.id === selected.id)
          : textPlaceholders.find((p) => p.id === selected.id);
        if (item && getResizeHandle(x, y, item)) {
          const handle = getResizeHandle(x, y, item);
          canvas.style.cursor = handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize";
        } else if (item && getRotationHandle(x, y, item)) {
          canvas.style.cursor = "grab";
        } else {
          canvas.style.cursor = "default";
        }
      } else {
        canvas.style.cursor = "default";
      }
    }
  }

  function handleCanvasMouseUp() {
    setMouseDown(false);
    setDraggingId(null);
    setDraggingType(null);
    setResizingId(null);
    setResizingType(null);
    setRotatingId(null);
    setRotatingType(null);
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
    setSelected({ type: "image", id: newPlaceholder.id });
    emitChange(backgroundImage, updated, textPlaceholders);
  }

  function addTextPlaceholder() {
    const newTp: CanvasTextPlaceholder = {
      id: Math.random().toString(36).substr(2, 9),
      key: `text_${textPlaceholders.length + 1}`,
      label: `Text ${textPlaceholders.length + 1}`,
      required: false,
      x: 80,
      y: 80,
      width: 250,
      height: 60,
      rotation: 0,
      opacity: 1,
      zIndex: 1,
      fontFamily: "Arial",
      fontUrl: null,
      fontFormat: null,
      fontSize: 24,
      fontWeight: 400,
      fontStyle: "normal",
      color: "#000000",
      textAlign: "left",
      lineHeight: 1.2,
      letterSpacing: 0,
      maxLength: null,
      defaultText: "",
      placeholder: "Enter text…",
    };
    const updated = [...textPlaceholders, newTp];
    setTextPlaceholders(updated);
    setSelected({ type: "text", id: newTp.id });
    emitChange(backgroundImage, placeholders, updated);
  }

  function deleteItem(type: "image" | "text", id: string) {
    if (type === "image") {
      const updated = placeholders.filter((p) => p.id !== id);
      setPlaceholders(updated);
      if (selected?.id === id) setSelected(null);
      emitChange(backgroundImage, updated, textPlaceholders);
    } else {
      const updated = textPlaceholders.filter((p) => p.id !== id);
      setTextPlaceholders(updated);
      if (selected?.id === id) setSelected(null);
      emitChange(backgroundImage, placeholders, updated);
    }
  }

  function updateImagePlaceholder(id: string, field: string, value: any) {
    const updated = placeholders.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    setPlaceholders(updated);
    emitChange(backgroundImage, updated, textPlaceholders);
  }

  function updateTextPlaceholder(id: string, field: string, value: any) {
    const updated = textPlaceholders.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    setTextPlaceholders(updated);
    emitChange(backgroundImage, placeholders, updated);
  }

  function handleFontChange(tpId: string, fontFamily: string) {
    // Check if it's a custom font from availableFonts
    const customFont = availableFonts.find((f) => f.family === fontFamily);
    if (customFont) {
      const updated = textPlaceholders.map((p) =>
        p.id === tpId
          ? {
            ...p,
            fontFamily: customFont.family,
            fontUrl: customFont.fileUrl,
            fontFormat: customFont.format,
            fontWeight: customFont.weight,
            fontStyle: customFont.style as "normal" | "italic",
          }
          : p
      );
      setTextPlaceholders(updated);
      emitChange(backgroundImage, placeholders, updated);
    } else {
      // System font
      const updated = textPlaceholders.map((p) =>
        p.id === tpId
          ? { ...p, fontFamily, fontUrl: null, fontFormat: null }
          : p
      );
      setTextPlaceholders(updated);
      emitChange(backgroundImage, placeholders, updated);
    }
  }

  const selectedImagePlaceholder = selected?.type === "image" ? placeholders.find((p) => p.id === selected.id) : null;
  const selectedTextPlaceholder = selected?.type === "text" ? textPlaceholders.find((p) => p.id === selected.id) : null;

  const allItems = [
    ...placeholders.map((p) => ({ ...p, _type: "image" as const })),
    ...textPlaceholders.map((p) => ({ ...p, _type: "text" as const })),
  ];

  const inputCls = "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] px-2 py-1.5 text-xs text-[var(--bw-ink)] outline-none w-full";
  const labelSmall = "block text-[9px] font-bold uppercase tracking-widest mb-1";

  return (
    <div className="space-y-6">
      {fontFaceCss && <style>{fontFaceCss}</style>}

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold" style={{ fontFamily: "var(--bw-font-display)" }}>
          Canvas Template Editor
        </h3>
        {!readOnly && (placeholders.length > 0 || textPlaceholders.length > 0) && (
          <p className="text-sm" style={{ color: "var(--bw-muted)" }}>
            {placeholders.length} image · {textPlaceholders.length} text
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
            <div className="mt-4 flex gap-3">
              <button
                onClick={addPlaceholder}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer"
                style={{ background: "var(--bw-green)", color: "var(--bw-bg)" }}
              >
                + Add Image Zone
              </button>
              <button
                onClick={addTextPlaceholder}
                className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer"
                style={{ background: "#8b5cf6", color: "#fff" }}
              >
                + Add Text Zone
              </button>
            </div>
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
            ) : selectedImagePlaceholder ? (
              /* ── Image Placeholder Properties ── */
              <div className="space-y-3">
                <div className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded text-center" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                  🖼️ Image Zone
                </div>

                <div>
                  <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Key</label>
                  <input type="text" value={selectedImagePlaceholder.key} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "key", e.target.value)} className={inputCls} disabled={readOnly} />
                </div>

                <div>
                  <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Label</label>
                  <input type="text" value={selectedImagePlaceholder.label} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "label", e.target.value)} className={inputCls} disabled={readOnly} />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                  <input type="checkbox" checked={selectedImagePlaceholder.required} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "required", e.target.checked)} className="w-3 h-3 rounded cursor-pointer" disabled={readOnly} />
                  <span>Required</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>X</label>
                    <input type="number" value={Math.round(selectedImagePlaceholder.x)} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "x", parseInt(e.target.value, 10))} className={inputCls} disabled={readOnly} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>Y</label>
                    <input type="number" value={Math.round(selectedImagePlaceholder.y)} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "y", parseInt(e.target.value, 10))} className={inputCls} disabled={readOnly} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>W</label>
                    <input type="number" value={Math.round(selectedImagePlaceholder.width)} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "width", Math.max(30, parseInt(e.target.value, 10)))} className={inputCls} disabled={readOnly} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>H</label>
                    <input type="number" value={Math.round(selectedImagePlaceholder.height)} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "height", Math.max(30, parseInt(e.target.value, 10)))} className={inputCls} disabled={readOnly} />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold block mb-2" style={{ color: "var(--bw-ghost)" }}>
                    Rotate ({selectedImagePlaceholder.rotation}°)
                  </label>
                  <input type="range" min="0" max="360" value={selectedImagePlaceholder.rotation} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "rotation", parseInt(e.target.value, 10))} className="w-full" disabled={readOnly} />
                </div>

                <div>
                  <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>Fit</label>
                  <select value={selectedImagePlaceholder.backgroundFit} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "backgroundFit", e.target.value)} className={`${inputCls} cursor-pointer`} disabled={readOnly}>
                    <option value="contain">Contain</option>
                    <option value="cover">Cover</option>
                    <option value="fill">Fill</option>
                  </select>
                </div>

                {!readOnly && (
                  <button onClick={() => deleteItem("image", selectedImagePlaceholder.id)} className="w-full px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer" style={{ background: "rgba(220,38,38,0.15)", color: "rgb(220,38,38)" }}>
                    🗑️ Delete
                  </button>
                )}
              </div>
            ) : selectedTextPlaceholder ? (
              /* ── Text Placeholder Properties ── */
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                <div className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded text-center" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                  Aa Text Zone
                </div>

                <div>
                  <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Key</label>
                  <input type="text" value={selectedTextPlaceholder.key} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "key", e.target.value)} className={inputCls} disabled={readOnly} />
                </div>

                <div>
                  <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Label</label>
                  <input type="text" value={selectedTextPlaceholder.label} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "label", e.target.value)} className={inputCls} disabled={readOnly} />
                </div>

                <label className="flex items-center gap-2 cursor-pointer select-none text-xs">
                  <input type="checkbox" checked={selectedTextPlaceholder.required} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "required", e.target.checked)} className="w-3 h-3 rounded cursor-pointer" disabled={readOnly} />
                  <span>Required</span>
                </label>

                {/* Position & Size */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>X</label>
                    <input type="number" value={Math.round(selectedTextPlaceholder.x)} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "x", parseInt(e.target.value, 10))} className={inputCls} disabled={readOnly} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>Y</label>
                    <input type="number" value={Math.round(selectedTextPlaceholder.y)} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "y", parseInt(e.target.value, 10))} className={inputCls} disabled={readOnly} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>W</label>
                    <input type="number" value={Math.round(selectedTextPlaceholder.width)} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "width", Math.max(30, parseInt(e.target.value, 10)))} className={inputCls} disabled={readOnly} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>H</label>
                    <input type="number" value={Math.round(selectedTextPlaceholder.height)} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "height", Math.max(30, parseInt(e.target.value, 10)))} className={inputCls} disabled={readOnly} />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold block mb-2" style={{ color: "var(--bw-ghost)" }}>
                    Rotate ({selectedTextPlaceholder.rotation}°)
                  </label>
                  <input type="range" min="0" max="360" value={selectedTextPlaceholder.rotation} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "rotation", parseInt(e.target.value, 10))} className="w-full" disabled={readOnly} />
                </div>

                {/* Typography */}
                <div className="pt-2 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--bw-ghost)" }}>Typography</p>
                </div>

                <div>
                  <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Font</label>
                  <select
                    value={selectedTextPlaceholder.fontFamily}
                    onChange={(e) => handleFontChange(selectedTextPlaceholder.id, e.target.value)}
                    className={`${inputCls} cursor-pointer`}
                    disabled={readOnly}
                  >
                    <optgroup label="System Fonts">
                      {SYSTEM_FONTS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </optgroup>
                    {availableFonts.length > 0 && (
                      <optgroup label="Custom Fonts">
                        {availableFonts.map((f) => (
                          <option key={f._id} value={f.family}>{f.name}</option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Size (px)</label>
                    <input type="number" value={selectedTextPlaceholder.fontSize} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "fontSize", Math.max(8, parseInt(e.target.value, 10) || 24))} className={inputCls} disabled={readOnly} min={8} />
                  </div>
                  <div>
                    <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Weight</label>
                    <select value={selectedTextPlaceholder.fontWeight} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "fontWeight", parseInt(e.target.value, 10))} className={`${inputCls} cursor-pointer`} disabled={readOnly}>
                      <option value={100}>Thin</option>
                      <option value={300}>Light</option>
                      <option value={400}>Regular</option>
                      <option value={500}>Medium</option>
                      <option value={600}>SemiBold</option>
                      <option value={700}>Bold</option>
                      <option value={800}>ExtraBold</option>
                      <option value={900}>Black</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Color</label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="color"
                        value={selectedTextPlaceholder.color}
                        onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "color", e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer border-none p-0"
                        disabled={readOnly}
                      />
                      <input
                        type="text"
                        value={selectedTextPlaceholder.color}
                        onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "color", e.target.value)}
                        className={`${inputCls} flex-1`}
                        disabled={readOnly}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Style</label>
                    <select value={selectedTextPlaceholder.fontStyle} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "fontStyle", e.target.value)} className={`${inputCls} cursor-pointer`} disabled={readOnly}>
                      <option value="normal">Normal</option>
                      <option value="italic">Italic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Align</label>
                    <select value={selectedTextPlaceholder.textAlign} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "textAlign", e.target.value)} className={`${inputCls} cursor-pointer`} disabled={readOnly}>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                      <option value="justify">Justify</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Line Height</label>
                    <input type="number" value={selectedTextPlaceholder.lineHeight} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "lineHeight", Math.max(0.5, parseFloat(e.target.value) || 1.2))} className={inputCls} disabled={readOnly} step={0.1} min={0.5} />
                  </div>
                </div>

                <div>
                  <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Letter Spacing (px)</label>
                  <input type="number" value={selectedTextPlaceholder.letterSpacing} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "letterSpacing", parseFloat(e.target.value) || 0)} className={inputCls} disabled={readOnly} step={0.5} />
                </div>

                {/* Content */}
                <div className="pt-2 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "var(--bw-ghost)" }}>Content</p>
                </div>

                <div>
                  <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Default Text</label>
                  <textarea value={selectedTextPlaceholder.defaultText} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "defaultText", e.target.value)} className={`${inputCls} resize-none`} disabled={readOnly} rows={2} />
                </div>

                <div>
                  <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Placeholder</label>
                  <input type="text" value={selectedTextPlaceholder.placeholder} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "placeholder", e.target.value)} className={inputCls} disabled={readOnly} />
                </div>

                <div>
                  <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Max Length</label>
                  <input type="number" value={selectedTextPlaceholder.maxLength ?? ""} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "maxLength", e.target.value ? parseInt(e.target.value, 10) : null)} className={inputCls} disabled={readOnly} placeholder="No limit" />
                </div>

                {!readOnly && (
                  <button onClick={() => deleteItem("text", selectedTextPlaceholder.id)} className="w-full px-3 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer" style={{ background: "rgba(220,38,38,0.15)", color: "rgb(220,38,38)" }}>
                    🗑️ Delete
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* Zones List */}
          {allItems.length > 0 && (
            <div className="rounded-[var(--bw-radius-lg)] p-4 border max-h-96 overflow-y-auto" style={{ background: "var(--bw-surface)", borderColor: "var(--bw-border)" }}>
              <h4 className="text-xs font-bold mb-3" style={{ fontFamily: "var(--bw-font-display)" }}>
                Zones ({allItems.length})
              </h4>

              <div className="space-y-1.5">
                {allItems.map((item) => (
                  <button
                    key={`${item._type}-${item.id}`}
                    onClick={() => setSelected({ type: item._type, id: item.id })}
                    className="w-full text-left rounded-[var(--bw-radius-md)] p-2.5 border transition-all text-xs"
                    style={{
                      background: selected?.id === item.id && selected?.type === item._type ? "var(--bw-bg)" : "transparent",
                      borderColor: selected?.id === item.id && selected?.type === item._type ? "var(--bw-ink)" : "var(--bw-border)",
                      cursor: "pointer",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{
                        background: item._type === "image" ? "rgba(59,130,246,0.1)" : "rgba(139,92,246,0.1)",
                        color: item._type === "image" ? "#3b82f6" : "#8b5cf6",
                      }}>
                        {item._type === "image" ? "🖼️" : "Aa"}
                      </span>
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <code className="text-[10px]" style={{ color: "var(--bw-muted)", fontFamily: "var(--bw-font-mono)" }}>
                          {item.key}
                        </code>
                      </div>
                    </div>
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