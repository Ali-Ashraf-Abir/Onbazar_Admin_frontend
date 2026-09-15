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
  // Stack order relative to other image placeholders, the canvas
  // background/frame, and text placeholders. Default of 1 matches the
  // previous hardcoded "images always at the bottom" behavior.
  zIndex: number;
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

// Placeholders coming in as props may be from templates saved before
// zIndex existed, so zIndex is optional on input — it gets defaulted
// once, on the way into state (see the useState initializers below).
// Internally (CanvasPlaceholder / CanvasTextPlaceholder) zIndex stays
// required, since every item in state is guaranteed to have one.
type CanvasPlaceholderInput = Omit<CanvasPlaceholder, "zIndex"> & { zIndex?: number };
type CanvasTextPlaceholderInput = Omit<CanvasTextPlaceholder, "zIndex"> & { zIndex?: number };

interface CanvasEditorProps {
  backgroundImage?: string;
  // Stack order of the background/frame relative to placeholders.
  // Default of 2 matches the previous hardcoded middle-layer behavior.
  backgroundZIndex?: number;
  placeholders?: CanvasPlaceholderInput[];
  textPlaceholders?: CanvasTextPlaceholderInput[];
  availableFonts?: FontOption[];
  onChange?: (data: {
    backgroundImage: string;
    backgroundZIndex: number;
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

const DEFAULT_IMAGE_Z = 1;
const DEFAULT_BACKGROUND_Z = 2;
const DEFAULT_TEXT_Z = 3;

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
  backgroundZIndex: initialBgZIndex = DEFAULT_BACKGROUND_Z,
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
  const [backgroundZIndex, setBackgroundZIndex] = useState<number>(
    initialBgZIndex ?? DEFAULT_BACKGROUND_Z
  );
  // Spread first, then default zIndex with `??` — this way the fallback
  // only applies when the incoming placeholder genuinely has no zIndex
  // (older saved templates), and never overwrites a real value of 0.
  const [placeholders, setPlaceholders] = useState<CanvasPlaceholder[]>(
    initialPlaceholders.map((p) => ({ ...p, zIndex: p.zIndex ?? DEFAULT_IMAGE_Z }))
  );
  const [textPlaceholders, setTextPlaceholders] = useState<CanvasTextPlaceholder[]>(
    initialTextPlaceholders.map((p) => ({ ...p, zIndex: p.zIndex ?? DEFAULT_TEXT_Z }))
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
    bgZ: number,
    imgP: CanvasPlaceholder[],
    txtP: CanvasTextPlaceholder[]
  ) {
    onChange?.({
      backgroundImage: bg,
      backgroundZIndex: bgZ,
      imagePlaceholders: imgP,
      textPlaceholders: txtP,
    });
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

    if (backgroundImage) {
      const img = new Image();
      img.onload = () => {
        drawLayered(ctx, img);
      };
      img.crossOrigin = "anonymous";
      img.src = backgroundImage;
    } else {
      drawLayered(ctx, null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundImage, backgroundZIndex, placeholders, textPlaceholders, selected]);

  // Draw the background image, image placeholders, and text
  // placeholders in ascending zIndex order, instead of the old fixed
  // "background always drawn between images and text" order. Ties keep
  // insertion order (images, text, background) to match prior behavior.
  function drawLayered(ctx: CanvasRenderingContext2D, bgImg: HTMLImageElement | null) {
    type DrawLayer =
      | { kind: "background"; zIndex: number }
      | { kind: "image"; zIndex: number; placeholder: CanvasPlaceholder }
      | { kind: "text"; zIndex: number; placeholder: CanvasTextPlaceholder };

    const layers: DrawLayer[] = [];

    for (const p of placeholders) {
      layers.push({ kind: "image", zIndex: p.zIndex ?? DEFAULT_IMAGE_Z, placeholder: p });
    }
    for (const tp of textPlaceholders) {
      layers.push({ kind: "text", zIndex: tp.zIndex ?? DEFAULT_TEXT_Z, placeholder: tp });
    }
    if (bgImg) {
      layers.push({ kind: "background", zIndex: backgroundZIndex ?? DEFAULT_BACKGROUND_Z });
    }

    const sorted = layers
      .map((layer, index) => ({ layer, index }))
      .sort((a, b) => a.layer.zIndex - b.layer.zIndex || a.index - b.index)
      .map((entry) => entry.layer);

    for (const layer of sorted) {
      if (layer.kind === "background" && bgImg) {
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(bgImg, 0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);
        ctx.restore();
      } else if (layer.kind === "image") {
        drawImagePlaceholder(ctx, layer.placeholder);
      } else if (layer.kind === "text") {
        drawTextPlaceholder(ctx, layer.placeholder);
      }
    }
  }

  function drawImagePlaceholder(ctx: CanvasRenderingContext2D, placeholder: CanvasPlaceholder) {
    const isSelected = selected?.type === "image" && selected?.id === placeholder.id;

    ctx.save();
    ctx.translate(
      placeholder.x + placeholder.width / 2,
      placeholder.y + placeholder.height / 2
    );
    ctx.rotate((placeholder.rotation * Math.PI) / 180);

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

    if (placeholder.label) {
      ctx.font = "bold 12px sans-serif";
      ctx.fillStyle = "#1f2937";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(placeholder.label, 0, 0);
    }

    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#6b7280";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🖼️", 0, placeholder.label ? -18 : 0);

    ctx.restore();

    if (isSelected && !readOnly) {
      drawHandles(ctx, placeholder);
    }
  }

  function drawTextPlaceholder(ctx: CanvasRenderingContext2D, tp: CanvasTextPlaceholder) {
    const isSelected2 = selected?.type === "text" && selected?.id === tp.id;

    ctx.save();
    ctx.translate(tp.x + tp.width / 2, tp.y + tp.height / 2);
    ctx.rotate((tp.rotation * Math.PI) / 180);

    ctx.fillStyle = isSelected2 ? "rgba(16,185,129,0.25)" : "rgba(16,185,129,0.08)";
    ctx.strokeStyle = isSelected2 ? "#10b981" : "#a7f3d0";
    ctx.lineWidth = isSelected2 ? 2 : 1;
    ctx.setLineDash(isSelected2 ? [] : [4, 4]);
    ctx.fillRect(-tp.width / 2, -tp.height / 2, tp.width, tp.height);
    ctx.strokeRect(-tp.width / 2, -tp.height / 2, tp.width, tp.height);
    ctx.setLineDash([]);

    const displayText = tp.defaultText || tp.placeholder || tp.label || tp.key;
    // Render at the actual configured font size — no artificial cap.
    // (Previously this was clamped to `Math.min(fontSize, height * 0.6, 40)`,
    // which silently shrank anything larger than ~40-44px depending on the
    // zone's height. Text can now overflow its zone visually in the editor
    // if the size is set larger than the box — that's expected, since the
    // box is just a placement guide, not a hard text container.)
    const fontSizeForCanvas = tp.fontSize || 24;
    ctx.font = `${tp.fontWeight || 400} ${tp.fontStyle === "italic" ? "italic " : ""}${fontSizeForCanvas}px '${tp.fontFamily || "Arial"}', sans-serif`;
    ctx.fillStyle = tp.color || "#000000";
    ctx.textAlign = (tp.textAlign || "left") as CanvasTextAlign;
    ctx.textBaseline = "middle";

    const textX = tp.textAlign === "center" ? 0 : tp.textAlign === "right" ? tp.width / 2 - 8 : -tp.width / 2 + 8;
    ctx.fillText(displayText, textX, 0, tp.width - 16);

    ctx.font = "bold 9px sans-serif";
    ctx.fillStyle = isSelected2 ? "#065f46" : "#6b7280";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Aa", -tp.width / 2 + 4, -tp.height / 2 + 4);

    ctx.restore();

    if (isSelected2 && !readOnly) {
      drawHandles(ctx, tp);
    }
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
        emitChange(dataUrl, backgroundZIndex, placeholders, textPlaceholders);
      };
      reader.readAsDataURL(file);
    }
  }

  function removeBackground() {
    setBackgroundImage("");
    emitChange("", backgroundZIndex, placeholders, textPlaceholders);
  }

  function updateBackgroundZIndex(z: number) {
    setBackgroundZIndex(z);
    emitChange(backgroundImage, z, placeholders, textPlaceholders);
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
          emitChange(backgroundImage, backgroundZIndex, updated, textPlaceholders);
        } else {
          const updated = textPlaceholders.map((p) => (p.id === rotatingId ? { ...p, rotation: Math.round(angle) } : p));
          setTextPlaceholders(updated);
          emitChange(backgroundImage, backgroundZIndex, placeholders, updated);
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
          emitChange(backgroundImage, backgroundZIndex, updated, textPlaceholders);
        } else {
          const updated = textPlaceholders.map((p) => (p.id === resizingId ? { ...p, x: newX, y: newY, width: newWidth, height: newHeight } : p));
          setTextPlaceholders(updated);
          emitChange(backgroundImage, backgroundZIndex, placeholders, updated);
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
          emitChange(backgroundImage, backgroundZIndex, updated, textPlaceholders);
        } else {
          const updated = textPlaceholders.map((p) => (p.id === draggingId ? { ...p, x: newX, y: newY } : p));
          setTextPlaceholders(updated);
          emitChange(backgroundImage, backgroundZIndex, placeholders, updated);
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
      zIndex: DEFAULT_IMAGE_Z,
    };
    const updated = [...placeholders, newPlaceholder];
    setPlaceholders(updated);
    setSelected({ type: "image", id: newPlaceholder.id });
    emitChange(backgroundImage, backgroundZIndex, updated, textPlaceholders);
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
      zIndex: DEFAULT_TEXT_Z,
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
    emitChange(backgroundImage, backgroundZIndex, placeholders, updated);
  }

  function deleteItem(type: "image" | "text", id: string) {
    if (type === "image") {
      const updated = placeholders.filter((p) => p.id !== id);
      setPlaceholders(updated);
      if (selected?.id === id) setSelected(null);
      emitChange(backgroundImage, backgroundZIndex, updated, textPlaceholders);
    } else {
      const updated = textPlaceholders.filter((p) => p.id !== id);
      setTextPlaceholders(updated);
      if (selected?.id === id) setSelected(null);
      emitChange(backgroundImage, backgroundZIndex, placeholders, updated);
    }
  }

  function updateImagePlaceholder(id: string, field: string, value: any) {
    const updated = placeholders.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    setPlaceholders(updated);
    emitChange(backgroundImage, backgroundZIndex, updated, textPlaceholders);
  }

  function updateTextPlaceholder(id: string, field: string, value: any) {
    const updated = textPlaceholders.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    setTextPlaceholders(updated);
    emitChange(backgroundImage, backgroundZIndex, placeholders, updated);
  }

  function handleFontChange(tpId: string, selectedValue: string) {
    // Look up by fileUrl, not family — family is no longer unique on its
    // own now that a family can have several weight/style variants.
    const customFont = availableFonts.find((f) => f.fileUrl === selectedValue);

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
      emitChange(backgroundImage, backgroundZIndex, placeholders, updated);
    } else {
      // System font — selectedValue is the plain family name.
      const updated = textPlaceholders.map((p) =>
        p.id === tpId ? { ...p, fontFamily: selectedValue, fontUrl: null, fontFormat: null } : p
      );
      setTextPlaceholders(updated);
      emitChange(backgroundImage, backgroundZIndex, placeholders, updated);
    }
  }

  const selectedImagePlaceholder = selected?.type === "image" ? placeholders.find((p) => p.id === selected.id) : null;
  const selectedTextPlaceholder = selected?.type === "text" ? textPlaceholders.find((p) => p.id === selected.id) : null;

  const allItems = [
    ...placeholders.map((p) => ({ ...p, _type: "image" as const })),
    ...textPlaceholders.map((p) => ({ ...p, _type: "text" as const })),
  ];

  const inputCls =
    "bg-[var(--bw-input-bg)] border border-[var(--bw-border)] rounded-[var(--bw-radius-md)] px-2.5 py-1.5 text-xs text-[var(--bw-ink)] outline-none w-full transition-colors focus:border-[var(--bw-ink)]";
  const labelSmall = "block text-[9px] font-bold uppercase tracking-widest mb-1";
  const sectionHeaderCls =
    "text-[10px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5";

  return (
    <div className="space-y-6">
      {fontFaceCss && <style>{fontFaceCss}</style>}

      {/* Background Upload */}
      {!readOnly && (
        <div
          className="rounded-[var(--bw-radius-lg)] p-4 border"
          style={{ background: "var(--bw-bg)", borderColor: "var(--bw-border)" }}
        >
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {backgroundImage ? (
                <img
                  src={backgroundImage}
                  alt="Background preview"
                  className="w-12 h-16 object-cover rounded border"
                  style={{ borderColor: "var(--bw-border)" }}
                />
              ) : (
                <div
                  className="w-12 h-16 rounded border-2 border-dashed flex items-center justify-center text-lg"
                  style={{ borderColor: "var(--bw-border)", color: "var(--bw-ghost)" }}
                >
                  🖼️
                </div>
              )}
              <div>
                <p className="text-sm font-semibold">Background Image</p>
                <p className="text-xs" style={{ color: backgroundImage ? "var(--bw-green)" : "var(--bw-muted)" }}>
                  {backgroundImage ? "✓ Loaded" : "No background uploaded yet"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 text-xs font-semibold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer"
                style={{ background: "var(--bw-ink)", color: "var(--bw-bg)" }}
              >
                📁 {backgroundImage ? "Replace Image" : "Upload PNG"}
              </button>
              {backgroundImage && (
                <button
                  onClick={removeBackground}
                  className="px-3 py-2 text-xs font-semibold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer"
                  style={{ background: "rgba(220,38,38,0.12)", color: "rgb(220,38,38)" }}
                >
                  🗑️ Remove
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleBackgroundUpload} className="hidden" />
            </div>
          </div>

          {/* Background layer control — lets the frame sit in front of or
              behind image/text placeholders instead of being locked to
              the middle. */}
          {backgroundImage && (
            <div
              className="mt-3 flex items-center gap-2 pt-3 border-t flex-wrap"
              style={{ borderColor: "var(--bw-divider)" }}
            >
              <span className="text-xs font-semibold whitespace-nowrap">Layer position:</span>
              <input
                type="number"
                value={backgroundZIndex}
                onChange={(e) => updateBackgroundZIndex(parseInt(e.target.value, 10) || 0)}
                className={inputCls}
                style={{ width: 70 }}
              />
              <span className="text-[10px]" style={{ color: "var(--bw-ghost)" }}>
                Higher number = closer to front. Image zones default to {DEFAULT_IMAGE_Z}, text zones to {DEFAULT_TEXT_Z}.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Canvas & Properties Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Canvas Area */}
        <div className="xl:col-span-3">
          {!readOnly && (
            <div className="flex gap-3 mb-4">
              <button
                onClick={addPlaceholder}
                className="flex-1 px-4 py-3 text-sm font-bold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{ background: "var(--bw-green)", color: "var(--bw-bg)" }}
              >
                <span className="text-base">🖼️</span> Add Image Zone
              </button>
              <button
                onClick={addTextPlaceholder}
                className="flex-1 px-4 py-3 text-sm font-bold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer flex items-center justify-center gap-2"
                style={{ background: "#8b5cf6", color: "#fff" }}
              >
                <span className="text-base">Aa</span> Add Text Zone
              </button>
            </div>
          )}

          <div
            ref={containerRef}
            className="rounded-[var(--bw-radius-lg)] p-6"
            style={{
              background: "var(--bw-bg)",
              border: "1px solid var(--bw-border)",
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-start",
              minHeight: "700px",
            }}
          >
            <div style={{ transform: `scale(${canvasScale})`, transformOrigin: "top center", boxShadow: "0 12px 48px rgba(0,0,0,0.14)" }}>
              <canvas
                ref={canvasRef}
                width={A4_WIDTH_PX}
                height={A4_HEIGHT_PX}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                style={{ display: "block", backgroundColor: "#ffffff", cursor: readOnly ? "default" : "crosshair", border: "1px solid #e5e7eb", borderRadius: 4 }}
              />
            </div>
          </div>

          {!readOnly && (
            <p className="text-xs text-center mt-3" style={{ color: "var(--bw-ghost)" }}>
              Drag a zone to move it · drag a corner to resize · drag the pink dot to rotate
            </p>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="xl:col-span-1 space-y-4">
          {/* Properties Panel */}
          <div className="rounded-[var(--bw-radius-lg)] p-4 border" style={{ background: "var(--bw-surface)", borderColor: "var(--bw-border)" }}>
            <h4 className="text-sm font-bold mb-4" style={{ fontFamily: "var(--bw-font-display)" }}>
              Properties
            </h4>

            {!selected ? (
              <div className="text-center py-8 px-2">
                <div className="text-3xl mb-2 opacity-40">👆</div>
                <p className="text-xs" style={{ color: "var(--bw-muted)" }}>
                  Select a zone on the canvas — or from the list below — to edit its properties
                </p>
              </div>
            ) : selectedImagePlaceholder ? (
              /* ── Image Placeholder Properties ── */
              <div className="space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 rounded-[var(--bw-radius-md)] text-center" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>
                  🖼️ Image Zone
                </div>

                <div>
                  <p className={sectionHeaderCls} style={{ color: "var(--bw-ghost)" }}>Basic Info</p>
                  <div className="space-y-2">
                    <div>
                      <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Key</label>
                      <input type="text" value={selectedImagePlaceholder.key} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "key", e.target.value)} className={inputCls} disabled={readOnly} />
                    </div>
                    <div>
                      <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Label</label>
                      <input type="text" value={selectedImagePlaceholder.label} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "label", e.target.value)} className={inputCls} disabled={readOnly} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs pt-1">
                      <input type="checkbox" checked={selectedImagePlaceholder.required} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "required", e.target.checked)} className="w-3.5 h-3.5 rounded cursor-pointer" disabled={readOnly} />
                      <span>Required</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <p className={sectionHeaderCls} style={{ color: "var(--bw-ghost)" }}>Position &amp; Size</p>
                  <div className="space-y-2">
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
                        <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>Width</label>
                        <input type="number" value={Math.round(selectedImagePlaceholder.width)} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "width", Math.max(30, parseInt(e.target.value, 10)))} className={inputCls} disabled={readOnly} />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>Height</label>
                        <input type="number" value={Math.round(selectedImagePlaceholder.height)} onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "height", Math.max(30, parseInt(e.target.value, 10)))} className={inputCls} disabled={readOnly} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <p className={sectionHeaderCls} style={{ color: "var(--bw-ghost)" }}>Rotation &amp; Fit</p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-bold flex justify-between mb-1.5" style={{ color: "var(--bw-ghost)" }}>
                        <span>Rotate</span><span>{selectedImagePlaceholder.rotation}°</span>
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
                  </div>
                </div>

                {/* Layer control */}
                <div className="pt-3 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <p className={sectionHeaderCls} style={{ color: "var(--bw-ghost)" }}>
                    Layer — z:{selectedImagePlaceholder.zIndex}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={selectedImagePlaceholder.zIndex}
                      onChange={(e) => updateImagePlaceholder(selectedImagePlaceholder.id, "zIndex", parseInt(e.target.value, 10) || 0)}
                      className={inputCls}
                      disabled={readOnly}
                    />
                    {!readOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateImagePlaceholder(selectedImagePlaceholder.id, "zIndex", selectedImagePlaceholder.zIndex + 1)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border cursor-pointer"
                          style={{ borderColor: "var(--bw-border)" }}
                          title="Bring forward"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => updateImagePlaceholder(selectedImagePlaceholder.id, "zIndex", selectedImagePlaceholder.zIndex - 1)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border cursor-pointer"
                          style={{ borderColor: "var(--bw-border)" }}
                          title="Send backward"
                        >
                          ▼
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: "var(--bw-ghost)" }}>
                    Higher renders in front. Background is z:{backgroundZIndex}.
                  </p>
                </div>

                {!readOnly && (
                  <button onClick={() => deleteItem("image", selectedImagePlaceholder.id)} className="w-full px-3 py-2 text-xs font-semibold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer" style={{ background: "rgba(220,38,38,0.15)", color: "rgb(220,38,38)" }}>
                    🗑️ Delete Zone
                  </button>
                )}
              </div>
            ) : selectedTextPlaceholder ? (
              /* ── Text Placeholder Properties ── */
              <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
                <div className="text-[10px] font-bold uppercase tracking-widest px-2 py-1.5 rounded-[var(--bw-radius-md)] text-center" style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                  Aa Text Zone
                </div>

                <div>
                  <p className={sectionHeaderCls} style={{ color: "var(--bw-ghost)" }}>Basic Info</p>
                  <div className="space-y-2">
                    <div>
                      <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Key</label>
                      <input type="text" value={selectedTextPlaceholder.key} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "key", e.target.value)} className={inputCls} disabled={readOnly} />
                    </div>
                    <div>
                      <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Label</label>
                      <input type="text" value={selectedTextPlaceholder.label} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "label", e.target.value)} className={inputCls} disabled={readOnly} />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs pt-1">
                      <input type="checkbox" checked={selectedTextPlaceholder.required} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "required", e.target.checked)} className="w-3.5 h-3.5 rounded cursor-pointer" disabled={readOnly} />
                      <span>Required</span>
                    </label>
                  </div>
                </div>

                {/* Position & Size */}
                <div className="pt-3 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <p className={sectionHeaderCls} style={{ color: "var(--bw-ghost)" }}>Position &amp; Size</p>
                  <div className="space-y-2">
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
                        <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>Width</label>
                        <input type="number" value={Math.round(selectedTextPlaceholder.width)} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "width", Math.max(30, parseInt(e.target.value, 10)))} className={inputCls} disabled={readOnly} />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold block mb-1" style={{ color: "var(--bw-ghost)" }}>Height</label>
                        <input type="number" value={Math.round(selectedTextPlaceholder.height)} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "height", Math.max(30, parseInt(e.target.value, 10)))} className={inputCls} disabled={readOnly} />
                      </div>
                    </div>
                    <p className="text-[10px]" style={{ color: "var(--bw-ghost)" }}>
                      This box is just a placement guide — font size below is never capped by its height.
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <p className={sectionHeaderCls} style={{ color: "var(--bw-ghost)" }}>Rotation</p>
                  <label className="text-[9px] font-bold flex justify-between mb-1.5" style={{ color: "var(--bw-ghost)" }}>
                    <span>Rotate</span><span>{selectedTextPlaceholder.rotation}°</span>
                  </label>
                  <input type="range" min="0" max="360" value={selectedTextPlaceholder.rotation} onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "rotation", parseInt(e.target.value, 10))} className="w-full" disabled={readOnly} />
                </div>

                {/* Layer control */}
                <div className="pt-3 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <p className={sectionHeaderCls} style={{ color: "var(--bw-ghost)" }}>
                    Layer — z:{selectedTextPlaceholder.zIndex}
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={selectedTextPlaceholder.zIndex}
                      onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "zIndex", parseInt(e.target.value, 10) || 0)}
                      className={inputCls}
                      disabled={readOnly}
                    />
                    {!readOnly && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateTextPlaceholder(selectedTextPlaceholder.id, "zIndex", selectedTextPlaceholder.zIndex + 1)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border cursor-pointer"
                          style={{ borderColor: "var(--bw-border)" }}
                          title="Bring forward"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => updateTextPlaceholder(selectedTextPlaceholder.id, "zIndex", selectedTextPlaceholder.zIndex - 1)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-[var(--bw-radius-md)] border cursor-pointer"
                          style={{ borderColor: "var(--bw-border)" }}
                          title="Send backward"
                        >
                          ▼
                        </button>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: "var(--bw-ghost)" }}>
                    Higher renders in front. Background is z:{backgroundZIndex}.
                  </p>
                </div>

                {/* Typography */}
                <div className="pt-3 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <p className={sectionHeaderCls} style={{ color: "var(--bw-ghost)" }}>Typography</p>
                  <div className="space-y-2">
                    <div>
                      <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Font</label>
                      <select
                        value={selectedTextPlaceholder.fontUrl || selectedTextPlaceholder.fontFamily}
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
                              <option key={f._id} value={f.fileUrl}>
                                {f.name} · {f.weight}{f.style === "italic" ? " italic" : ""}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelSmall} style={{ color: "var(--bw-ghost)" }}>Size (px)</label>
                        <input
                          type="number"
                          value={selectedTextPlaceholder.fontSize}
                          onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "fontSize", Math.max(8, parseInt(e.target.value, 10) || 24))}
                          className={inputCls}
                          disabled={readOnly}
                          min={8}
                          placeholder="No limit"
                        />
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
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="color"
                            value={selectedTextPlaceholder.color}
                            onChange={(e) => updateTextPlaceholder(selectedTextPlaceholder.id, "color", e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-none p-0"
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
                  </div>
                </div>

                {/* Content */}
                <div className="pt-3 border-t" style={{ borderColor: "var(--bw-divider)" }}>
                  <p className={sectionHeaderCls} style={{ color: "var(--bw-ghost)" }}>Content</p>
                  <div className="space-y-2">
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
                  </div>
                </div>

                {!readOnly && (
                  <button onClick={() => deleteItem("text", selectedTextPlaceholder.id)} className="w-full px-3 py-2 text-xs font-semibold rounded-[var(--bw-radius-md)] border-none transition-all cursor-pointer" style={{ background: "rgba(220,38,38,0.15)", color: "rgb(220,38,38)" }}>
                    🗑️ Delete Zone
                  </button>
                )}
              </div>
            ) : null}
          </div>

          {/* Zones List */}
          <div className="rounded-[var(--bw-radius-lg)] p-4 border" style={{ background: "var(--bw-surface)", borderColor: "var(--bw-border)" }}>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold" style={{ fontFamily: "var(--bw-font-display)" }}>
                Zones ({allItems.length})
              </h4>
              {allItems.length > 0 && (
                <span className="text-[10px]" style={{ color: "var(--bw-ghost)" }}>
                  {placeholders.length} image · {textPlaceholders.length} text
                </span>
              )}
            </div>

            {allItems.length === 0 ? (
              <div className="text-center py-6 px-2">
                <div className="text-2xl mb-2 opacity-40">📭</div>
                <p className="text-xs" style={{ color: "var(--bw-muted)" }}>
                  No zones yet — use the buttons above the canvas to add an image or text zone
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
                {[...allItems]
                  .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
                  .map((item) => {
                    const isActive = selected?.id === item.id && selected?.type === item._type;
                    return (
                      <div
                        key={`${item._type}-${item.id}`}
                        className="w-full rounded-[var(--bw-radius-md)] border transition-all text-xs flex items-center gap-2 pr-1.5"
                        style={{
                          background: isActive ? "var(--bw-bg)" : "transparent",
                          borderColor: isActive ? "var(--bw-ink)" : "var(--bw-border)",
                        }}
                      >
                        <button
                          onClick={() => setSelected({ type: item._type, id: item.id })}
                          className="flex-1 text-left p-2.5 cursor-pointer flex items-center gap-2 min-w-0"
                        >
                          <span
                            className="text-[10px] font-bold px-1.5 py-1 rounded shrink-0"
                            style={{
                              background: item._type === "image" ? "rgba(59,130,246,0.1)" : "rgba(139,92,246,0.1)",
                              color: item._type === "image" ? "#3b82f6" : "#8b5cf6",
                            }}
                          >
                            {item._type === "image" ? "🖼️" : "Aa"}
                          </span>
                          <span className="min-w-0">
                            <p className="font-semibold truncate">{item.label}</p>
                            <code className="text-[10px] block truncate" style={{ color: "var(--bw-muted)", fontFamily: "var(--bw-font-mono)" }}>
                              {item.key} · z:{item.zIndex ?? 0}
                            </code>
                          </span>
                        </button>
                        {!readOnly && (
                          <button
                            onClick={() => deleteItem(item._type, item.id)}
                            className="shrink-0 w-6 h-6 rounded-[var(--bw-radius-md)] flex items-center justify-center cursor-pointer"
                            style={{ background: "rgba(220,38,38,0.1)", color: "rgb(220,38,38)" }}
                            title="Delete zone"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
            {allItems.length > 0 && (
              <p className="text-[10px] mt-2.5" style={{ color: "var(--bw-ghost)" }}>
                Listed front-to-back by layer. Background is currently z:{backgroundZIndex}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}