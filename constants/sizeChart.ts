// constants/sizeCharts.ts
// Single source of truth for size chart presets on the frontend.
// The backend mirrors this in /constants/sizeCharts.js — keep them in sync.

export type SizeChartRow = { label: string; values: (number | string)[] };
export type SizeChart = { unit: "inches" | "cm"; columns: string[]; rows: SizeChartRow[] };

export const SIZE_CHART_PRESETS: Record<string, SizeChart> = {
  default: {
    unit: "inches",
    columns: ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"],
    rows: [
      { label: "Chest",         values: [16, 17, 18, 19, 20, 21, 22, 23, 24] },
      { label: "Length",        values: [26, 27, 27.5, 28, 28.5, 29, 29.5, 30, 30.5] },
      { label: "Sleeve Length", values: [7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5] },
    ],
  },
  oversized: {
    unit: "inches",
    columns: ["S", "M", "L", "XL", "2XL", "3XL"],
    rows: [
      { label: "Chest",         values: [20, 21, 22, 23, 24, 25] },
      { label: "Length",        values: [28, 29, 29.5, 30, 30.5, 31] },
      { label: "Sleeve Length", values: [8.5, 9, 9.5, 10, 10.5, 11] },
    ],
  },
  hoodie: {
    unit: "inches",
    columns: ["S", "M", "L", "XL", "2XL", "3XL"],
    rows: [
      { label: "Chest",         values: [19, 20, 21, 22, 23, 24] },
      { label: "Length",        values: [26, 27, 28, 29, 30, 31] },
      { label: "Sleeve Length", values: [23, 24, 24.5, 25, 25.5, 26] },
      { label: "Shoulder",      values: [17, 18, 19, 20, 21, 22] },
    ],
  },
};

/**
 * Builds a chart for the given sizes from a preset.
 * If a size isn't in the preset columns, falls back to the first value.
 */
export function buildDefaultChart(sizes: string[], presetKey = "default"): SizeChart {
  const preset = SIZE_CHART_PRESETS[presetKey] ?? SIZE_CHART_PRESETS.default;
  return {
    unit: preset.unit,
    columns: sizes,
    rows: preset.rows.map((row) => ({
      label: row.label,
      values: sizes.map((size) => {
        const i = preset.columns.indexOf(size);
        return i >= 0 ? row.values[i] : row.values[0];
      }),
    })),
  };
}

/**
 * Syncs an existing chart's rows when the selected sizes change.
 * Keeps existing user-entered values where possible; fills new sizes from preset.
 */
export function syncChartToSizes(prev: SizeChart, sizes: string[], presetKey = "default"): SizeChart {
  const preset = SIZE_CHART_PRESETS[presetKey] ?? SIZE_CHART_PRESETS.default;
  const newRows = prev.rows.map((row) => {
    const presetRow = preset.rows.find((r) => r.label === row.label);
    return {
      ...row,
      values: sizes.map((size) => {
        const prevIdx = prev.columns.indexOf(size);
        if (prevIdx >= 0) return row.values[prevIdx]; // keep existing value
        const presetIdx = preset.columns.indexOf(size);
        return presetIdx >= 0 ? (presetRow?.values[presetIdx] ?? "") : "";
      }),
    };
  });
  return { ...prev, columns: sizes, rows: newRows };
}

export function chartToJson(chart: SizeChart): string {
  return JSON.stringify({
    unit: chart.unit,
    columns: chart.columns,
    rows: chart.rows.map((r) => ({
      label: r.label,
      values: r.values.map((v) => (v === "" ? 0 : Number(v))),
    })),
  }, null, 2);
}