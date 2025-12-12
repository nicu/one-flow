// Figma plugin main code: export selection to OneFlow-compatible JSON
const figMap = new Map<string, any>();

function normalizeColor(fill) {
  if (!fill || fill.type !== "SOLID" || !fill.color) return undefined;
  const c = fill.color;
  const r = Math.round((c.r || 0) * 255);
  const g = Math.round((c.g || 0) * 255);
  const b = Math.round((c.b || 0) * 255);
  const a = typeof fill.opacity === "number" ? fill.opacity : 1;
  if (a === 1)
    return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
  return `rgba(${r},${g},${b},${a})`;
}

async function exportNode(node) {
  // record figma node for layout heuristics later
  try {
    figMap.set(node.id, node);
  } catch {}
  const base = { id: node.id, properties: {} };
  // helper: find first visible solid fill
  function getFirstSolidFill(n: any) {
    try {
      const fills = n.fills || [];
      for (const f of fills) {
        if (!f) continue;
        if (f.visible === false) continue;
        if (f.type === "SOLID" && f.color) return f;
      }
    } catch {}
    return undefined;
  }

  function normalizeSize(val: any) {
    if (val == null) return undefined;
    if (typeof val === "number") return `${val}px`;
    if (typeof val === "string") {
      const s = val.trim();
      if (/^\d+(?:\.\d+)?$/.test(s)) return `${s}px`;
      if (/^\d+(?:\.\d+)?(?:px|%|em|rem|vh|vw)$/.test(s)) return s;
      return s;
    }
    return String(val);
  }

  // helper: extract common style properties (borderRadius, boxShadow, border)
  function extractStyle(n: any, props: any) {
    try {
      if (typeof n.cornerRadius === "number")
        props.borderRadius = `${n.cornerRadius}px`;
      else if (Array.isArray(n.rectangleCornerRadii)) {
        const r = n.rectangleCornerRadii.map((v: number) => `${v}px`).join(" ");
        props.borderRadius = r;
      } else if (Array.isArray((n as any).cornerRadii)) {
        props.borderRadius = (n as any).cornerRadii
          .map((v: number) => `${v}px`)
          .join(" ");
      }
      // Fallback for individual corner properties
      else if (
        (n as any).topLeftRadius ||
        (n as any).topRightRadius ||
        (n as any).bottomLeftRadius ||
        (n as any).bottomRightRadius
      ) {
        const tl = (n as any).topLeftRadius || 0;
        const tr = (n as any).topRightRadius || 0;
        const br = (n as any).bottomRightRadius || 0;
        const bl = (n as any).bottomLeftRadius || 0;
        props.borderRadius = `${tl}px ${tr}px ${br}px ${bl}px`;
      }
    } catch {}

    try {
      if (Array.isArray(n.strokes) && n.strokes.length && n.strokeWeight) {
        const s = n.strokes[0];
        const strokeColor = normalizeColor(s);
        if (strokeColor) props.borderColor = strokeColor;
        if (n.strokeWeight) props.borderWidth = normalizeSize(n.strokeWeight);
      }
    } catch {}

    try {
      if (Array.isArray(n.effects)) {
        const shadows = n.effects.filter(
          (e: any) => e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW"
        );
        if (shadows.length) {
          // map to single boxShadow CSS string (first shadow preferred)
          const parts: string[] = [];
          for (const sh of shadows) {
            const col = normalizeColor(sh.color || sh.color);
            const ox = (sh.offset && sh.offset.x) || 0;
            const oy = (sh.offset && sh.offset.y) || 0;
            const blur = sh.radius || 0;
            const spread = sh.spread || 0;
            const inset = sh.type === "INNER_SHADOW" ? "inset " : "";
            const colorStr = col || "rgba(0,0,0,0.2)";
            parts.push(
              `${inset}${normalizeSize(ox)} ${normalizeSize(
                oy
              )} ${normalizeSize(blur)} ${normalizeSize(spread)} ${colorStr}`
            );
          }
          props.boxShadow = parts.join(", ");
        }
      }
    } catch {}
  }
  // Map types
  if (node.type === "TEXT") {
    await Promise.all(
      (node.getRangeAllFontNames?.(0, node.characters.length) || []).map((f) =>
        figma.loadFontAsync(f)
      )
    );
    base.type = "text";
    base.properties.text = node.characters || "";
    if (node.fontSize) base.properties.fontSize = normalizeSize(node.fontSize);
    if (node.fills && node.fills[0]) {
      const sf = getFirstSolidFill(node);
      const c = normalizeColor(sf || node.fills[0]);
      if (c) base.properties.color = c;
    }
    extractStyle(node, base.properties);
    return base;
  }

  if (
    node.type === "FRAME" ||
    node.type === "GROUP" ||
    node.type === "COMPONENT" ||
    node.type === "INSTANCE"
  ) {
    // auto-layout heuristic
    if ((node as any).layoutMode === "HORIZONTAL") base.type = "row";
    else if ((node as any).layoutMode === "VERTICAL") base.type = "column";
    else base.type = "flex";

    const props = base.properties;
    if (node.paddingTop != null)
      props.padding = `${normalizeSize(node.paddingTop)} ${normalizeSize(
        node.paddingRight
      )}`;
    if (node.fills && node.fills[0]) {
      const sf = getFirstSolidFill(node);
      const c = normalizeColor(sf || node.fills[0]);
      if (c) props.backgroundColor = c;
    }
    extractStyle(node, props);

    // children
    const children = [];
    for (const child of node.children || []) {
      children.push(await exportNode(child));
    }
    if (children.length) base.children = children;
    return base;
  }

  if (
    node.type === "RECTANGLE" ||
    node.type === "ELLIPSE" ||
    node.type === "VECTOR"
  ) {
    // if has an image fill, export image; otherwise map to simple box
    const fills = node.fills || [];
    const imageFill = fills.find((f) => f.type === "IMAGE");
    if (imageFill) {
      const exported = await node.exportAsync({ format: "PNG" });
      const b64 = toBase64(exported);
      return {
        id: node.id,
        type: "image",
        properties: { src: `data:image/png;base64,${b64}` },
      };
    }
    // fallback to simple box with color
    const sf = getFirstSolidFill(node);
    const c = normalizeColor(sf || fills[0]);
    const props: any = c ? { backgroundColor: c } : {};
    extractStyle(node, props);
    return {
      id: node.id,
      type: "box",
      properties: props,
    };
  }

  if (
    node.type === "VECTOR" ||
    node.type === "POLYGON" ||
    node.type === "STAR" ||
    node.type === "LINE"
  ) {
    const exported = await node.exportAsync({ format: "PNG" });
    const b64 = toBase64(exported);
    return {
      id: node.id,
      type: "image",
      properties: { src: `data:image/png;base64,${b64}` },
    };
  }

  // default: try to export children if any
  if ((node as any).children && node.children.length) {
    const children = [];
    for (const child of node.children) children.push(await exportNode(child));
    return { id: node.id, type: "flex", properties: {}, children };
  }

  // unknown node, attempt to export as image
  try {
    const exported = await node.exportAsync({ format: "PNG" });
    const b64 = toBase64(exported);
    return {
      id: node.id,
      type: "image",
      properties: { src: `data:image/png;base64,${b64}` },
    };
  } catch (e) {
    return { id: node.id, type: "text", properties: { text: node.name || "" } };
  }
}

function toBase64(bytes) {
  let binary = "";
  const len = bytes.length;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function exportSelection() {
  const selection = figma.currentPage.selection;
  const nodes = selection.length ? selection : figma.currentPage.children;
  const out = [];
  for (const n of nodes) {
    try {
      out.push(await exportNode(n));
    } catch (e) {
      // ignore node failures
    }
  }
  // group absolute-positioned children into layout containers
  function groupAbsoluteInTree(arr: any[]) {
    for (const node of arr) {
      if (node.children && node.children.length) {
        groupChildren(node);
        groupAbsoluteInTree(node.children);
      }
    }
  }

  function groupChildren(parent: any) {
    // skip grouping if this parent was generated by the algorithm
    try {
      if (parent && parent.properties && parent.properties.__generated) return;
    } catch {}
    const children = parent.children || [];
    const entries = children.map((c: any, idx: number) => ({
      comp: c,
      idx,
      fig: figMap.get(c.id),
    }));
    const absolute = entries.filter(
      (e: any) => e.fig && e.fig.absoluteBoundingBox
    );
    if (absolute.length < 2) return;

    const items = absolute.map((e: any) => {
      const bb = e.fig.absoluteBoundingBox;
      const cx = bb.x + bb.width / 2;
      const cy = bb.y + bb.height / 2;
      return { ...e, cx, cy, w: bb.width, h: bb.height };
    });

    // cluster into rows by Y
    items.sort((a: any, b: any) => a.cy - b.cy);
    const rows: any[][] = [];
    const rowTol = 24;
    for (const it of items) {
      const last = rows[rows.length - 1];
      if (!last) {
        rows.push([it]);
        continue;
      }
      const avgY = last.reduce((s, x) => s + x.cy, 0) / last.length;
      if (Math.abs(it.cy - avgY) <= rowTol) last.push(it);
      else rows.push([it]);
    }

    const cols = Math.max(...rows.map((r) => r.length));
    if (rows.length >= 2 && cols >= 2) {
      // grid
      const colWidths: number[] = [];
      for (const r of rows) {
        r.sort((a: any, b: any) => a.cx - b.cx);
        r.forEach((it: any, i: number) => {
          colWidths[i] = (colWidths[i] || 0) + it.w;
        });
      }
      const avgWidths = colWidths.map((s) => Math.round(s / rows.length));
      const minCol = Math.max(
        48,
        Math.round(avgWidths.reduce((a, b) => a + b, 0) / avgWidths.length)
      );
      const container: any = {
        id: `${parent.id}-grid-${Math.random().toString(36).slice(2, 8)}`,
        type: "grid",
        properties: {
          __generated: true,
          minColumnWidth: `${minCol}px`,
          gap: "12px",
        },
        children: [],
      };
      for (const r of rows) {
        r.sort((a: any, b: any) => a.cx - b.cx);
        for (const it of r) container.children.push(it.comp);
      }
      const groupedIds = new Set(container.children.map((c: any) => c.id));
      const remaining = children.filter((c: any) => !groupedIds.has(c.id));
      const minIdx = Math.min(
        ...Array.from(entries)
          .filter((e: any) => groupedIds.has(e.comp.id))
          .map((e: any) => e.idx)
      );
      remaining.splice(minIdx, 0, container);
      parent.children = remaining;
      return;
    }

    if (rows.length === 1) {
      const row = rows[0].sort((a: any, b: any) => a.cx - b.cx);
      const container: any = {
        id: `${parent.id}-row-${Math.random().toString(36).slice(2, 8)}`,
        type: "row",
        properties: { __generated: true, gap: "12px", alignItems: "center" },
        children: row.map((it: any) => it.comp),
      };
      const groupedIds = new Set(container.children.map((c: any) => c.id));
      const remaining = children.filter((c: any) => !groupedIds.has(c.id));
      const minIdx = Math.min(
        ...Array.from(entries)
          .filter((e: any) => groupedIds.has(e.comp.id))
          .map((e: any) => e.idx)
      );
      remaining.splice(minIdx, 0, container);
      parent.children = remaining;
      return;
    }

    if (cols === 1) {
      const colItems = items.sort((a: any, b: any) => a.cy - b.cy);
      const container: any = {
        id: `${parent.id}-col-${Math.random().toString(36).slice(2, 8)}`,
        type: "column",
        properties: { __generated: true, gap: "8px" },
        children: colItems.map((it: any) => it.comp),
      };
      const groupedIds = new Set(container.children.map((c: any) => c.id));
      const remaining = children.filter((c: any) => !groupedIds.has(c.id));
      const minIdx = Math.min(
        ...Array.from(entries)
          .filter((e: any) => groupedIds.has(e.comp.id))
          .map((e: any) => e.idx)
      );
      remaining.splice(minIdx, 0, container);
      parent.children = remaining;
      return;
    }
  }

  try {
    groupAbsoluteInTree(out);
  } catch (e) {
    try {
      figma.ui.postMessage({
        type: "debug",
        message: "grouping_failed: " + String(e),
      });
    } catch {}
    // fallback: leave ungrouped
  }

  return out;
}

figma.showUI(__html__, { width: 340, height: 140 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "export") {
    try {
      const result = await exportSelection();
      let payload: string;
      try {
        payload = JSON.stringify(result, null, 2);
      } catch (e) {
        payload = `<<stringify failed: ${String(e)}>>`;
      }
      try {
        figma.ui.postMessage({ type: "result", data: payload });
      } catch (e) {
        // ensure we only send simple strings to the UI
        figma.ui.postMessage({
          type: "result",
          data: String(payload).slice(0, 100000),
        });
      }
    } catch (err) {
      let msgText = "Unknown error";
      try {
        msgText = (err && (err as any).message) || String(err);
      } catch (e) {
        msgText = "Unknown error during error serialization";
      }
      try {
        figma.ui.postMessage({ type: "error", message: msgText });
      } catch (_) {
        // last resort: post a minimal error
        try {
          figma.ui.postMessage({ type: "error", message: "Plugin error" });
        } catch (__) {}
      }
    }
  }
};
