// Figma plugin main code: export selection to OneFlow-compatible JSON
var figMap = new Map();

async function exportNode(node) {
  try {
    figMap.set(node.id, node);
  } catch (e) {}
  const base = { id: node.id, properties: {} };
  // helper: find first visible solid fill
  function getFirstSolidFill(n) {
    try {
      var fills = n.fills || [];
      for (var i = 0; i < fills.length; i++) {
        var f = fills[i];
        if (!f) continue;
        if (f.visible === false) continue;
        if (f.type === "SOLID" && f.color) return f;
      }
    } catch (e) {}
    return undefined;
  }

  function normalizeSize(val) {
    if (val == null) return undefined;
    if (typeof val === "number") return val + "px";
    if (typeof val === "string") {
      var s = val.trim();
      if (/^\d+(?:\.\d+)?$/.test(s)) return s + "px";
      if (/^\d+(?:\.\d+)?(?:px|%|em|rem|vh|vw)$/.test(s)) return s;
      return s;
    }
    return String(val);
  }

  // helper: extract common style properties (borderRadius, boxShadow, border)
  function extractStyle(n, props) {
    try {
      if (typeof n.cornerRadius === "number")
        props.borderRadius = n.cornerRadius + "px";
      else if (Array.isArray(n.rectangleCornerRadii)) {
        props.borderRadius = n.rectangleCornerRadii
          .map(function (v) {
            return v + "px";
          })
          .join(" ");
      }
    } catch (e) {}

    try {
      if (Array.isArray(n.strokes) && n.strokes.length && n.strokeWeight) {
        var s = n.strokes[0];
        var strokeColor = normalizeColor(s);
        if (strokeColor) props.borderColor = strokeColor;
        if (n.strokeWeight) props.borderWidth = normalizeSize(n.strokeWeight);
      }
    } catch (e) {}

    try {
      if (Array.isArray(n.effects)) {
        var shadows = n.effects.filter(function (e) {
          return e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW";
        });
        if (shadows.length) {
          var parts = [];
          for (var i = 0; i < shadows.length; i++) {
            var sh = shadows[i];
            var col = normalizeColor(sh.color || sh.color);
            var ox = (sh.offset && sh.offset.x) || 0;
            var oy = (sh.offset && sh.offset.y) || 0;
            var blur = sh.radius || 0;
            var spread = sh.spread || 0;
            var inset = sh.type === "INNER_SHADOW" ? "inset " : "";
            var colorStr = col || "rgba(0,0,0,0.2)";
            parts.push(
              inset +
                normalizeSize(ox) +
                " " +
                normalizeSize(oy) +
                " " +
                normalizeSize(blur) +
                " " +
                normalizeSize(spread) +
                " " +
                colorStr
            );
          }
          props.boxShadow = parts.join(", ");
        }
      }
    } catch (e) {}
  }

  // Map types
  if (node.type === "TEXT") {
    try {
      const len = (node.characters || "").length;
      if (node.getRangeAllFontNames) {
        const fonts = node.getRangeAllFontNames(0, len) || [];
        await Promise.all(fonts.map((f) => figma.loadFontAsync(f)));
      }
    } catch (e) {
      // ignore font load errors
    }
    base.type = "text";
    base.properties.text = node.characters || "";
    if (node.fontSize) base.properties.fontSize = normalizeSize(node.fontSize);
    if (node.fills && node.fills[0]) {
      const c = normalizeColor(node.fills[0]);
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
    if (node.layoutMode === "HORIZONTAL") base.type = "row";
    else if (node.layoutMode === "VERTICAL") base.type = "column";
    else base.type = "flex";

    const props = base.properties;
    if (node.paddingTop != null)
      props.padding = `${normalizeSize(node.paddingTop)} ${normalizeSize(
        node.paddingRight
      )}`;
    if (node.fills && node.fills[0]) {
      const c = normalizeColor(node.fills[0]);
      if (c) props.backgroundColor = c;
    }
    extractStyle(node, props);

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
    const fills = node.fills || [];
    const imageFill = fills.find((f) => f.type === "IMAGE");
    if (imageFill) {
      try {
        const exported = await node.exportAsync({ format: "PNG" });
        const b64 = toBase64(exported);
        return {
          id: node.id,
          type: "image",
          properties: { src: `data:image/png;base64,${b64}` },
        };
      } catch (e) {
        // fallthrough
      }
    }
    const c = normalizeColor(fills[0]);
    var props = c ? { backgroundColor: c } : {};
    extractStyle(node, props);
    return { id: node.id, type: "box", properties: props };
  }

  if (node.type === "POLYGON" || node.type === "STAR" || node.type === "LINE") {
    try {
      const exported = await node.exportAsync({ format: "PNG" });
      const b64 = toBase64(exported);
      return {
        id: node.id,
        type: "image",
        properties: { src: `data:image/png;base64,${b64}` },
      };
    } catch (e) {
      // ignore
    }
  }

  if (node.children && node.children.length) {
    const children = [];
    for (const child of node.children) children.push(await exportNode(child));
    return { id: node.id, type: "flex", properties: {}, children };
  }

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
  // grouping heuristics
  function groupAbsoluteInTree(arr) {
    for (const node of arr) {
      if (node.children && node.children.length) {
        groupChildren(node);
        groupAbsoluteInTree(node.children);
      }
    }
  }

  function groupChildren(parent) {
    // skip grouping if this parent was generated by the algorithm
    if (parent && parent.properties && parent.properties.__generated) return;
    const children = parent.children || [];
    const entries = children.map((c, idx) => ({
      comp: c,
      idx: idx,
      fig: figMap.get(c.id),
    }));
    const absolute = entries.filter((e) => e.fig && e.fig.absoluteBoundingBox);
    if (absolute.length < 2) return;
    const items = absolute.map((e) => {
      const bb = e.fig.absoluteBoundingBox;
      const cx = bb.x + bb.width / 2;
      const cy = bb.y + bb.height / 2;
      return Object.assign(Object.assign({}, e), {
        cx: cx,
        cy: cy,
        w: bb.width,
        h: bb.height,
      });
    });
    items.sort((a, b) => a.cy - b.cy);
    const rows = [];
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
    const cols = Math.max.apply(
      null,
      rows.map((r) => r.length)
    );
    if (rows.length >= 2 && cols >= 2) {
      const colWidths = [];
      for (const r of rows) {
        r.sort((a, b) => a.cx - b.cx);
        r.forEach((it, i) => {
          colWidths[i] = (colWidths[i] || 0) + it.w;
        });
      }
      const avgWidths = colWidths.map((s) => Math.round(s / rows.length));
      const minCol = Math.max(
        48,
        Math.round(avgWidths.reduce((a, b) => a + b, 0) / avgWidths.length)
      );
      const container = {
        id: parent.id + "-grid-" + Math.random().toString(36).slice(2, 8),
        type: "grid",
        properties: {
          __generated: true,
          minColumnWidth: minCol + "px",
          gap: "12px",
        },
        children: [],
      };
      for (const r of rows) {
        r.sort((a, b) => a.cx - b.cx);
        for (const it of r) container.children.push(it.comp);
      }
      const groupedIds = new Set(container.children.map((c) => c.id));
      const remaining = children.filter((c) => !groupedIds.has(c.id));
      const minIdx = Math.min.apply(
        null,
        entries.filter((e) => groupedIds.has(e.comp.id)).map((e) => e.idx)
      );
      remaining.splice(minIdx, 0, container);
      parent.children = remaining;
      return;
    }
    if (rows.length === 1) {
      const row = rows[0].sort((a, b) => a.cx - b.cx);
      const container = {
        id: parent.id + "-row-" + Math.random().toString(36).slice(2, 8),
        type: "row",
        properties: { __generated: true, gap: "12px", alignItems: "center" },
        children: row.map((it) => it.comp),
      };
      const groupedIds = new Set(container.children.map((c) => c.id));
      const remaining = children.filter((c) => !groupedIds.has(c.id));
      const minIdx = Math.min.apply(
        null,
        entries.filter((e) => groupedIds.has(e.comp.id)).map((e) => e.idx)
      );
      remaining.splice(minIdx, 0, container);
      parent.children = remaining;
      return;
    }
    if (cols === 1) {
      const colItems = items.sort((a, b) => a.cy - b.cy);
      const container = {
        id: parent.id + "-col-" + Math.random().toString(36).slice(2, 8),
        type: "column",
        properties: { __generated: true, gap: "8px" },
        children: colItems.map((it) => it.comp),
      };
      const groupedIds = new Set(container.children.map((c) => c.id));
      const remaining = children.filter((c) => !groupedIds.has(c.id));
      const minIdx = Math.min.apply(
        null,
        entries.filter((e) => groupedIds.has(e.comp.id)).map((e) => e.idx)
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
    } catch (e2) {
      /* ignore */
    }
    // fallback: leave ungrouped
  }

  return out;
}

figma.showUI(__html__, { width: 340, height: 140 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "export") {
    try {
      const result = await exportSelection();
      var payload;
      try {
        payload = JSON.stringify(result, null, 2);
      } catch (e) {
        payload = "<<stringify failed: " + String(e) + ">>";
      }
      try {
        figma.ui.postMessage({ type: "result", data: payload });
      } catch (e) {
        try {
          figma.ui.postMessage({
            type: "result",
            data: String(payload).slice(0, 100000),
          });
        } catch (e2) {
          figma.ui.postMessage({ type: "result", data: "" });
        }
      }
    } catch (err) {
      var msgText = "Unknown error";
      try {
        msgText = (err && err.message) || String(err);
      } catch (e) {
        msgText = "Unknown error during error serialization";
      }
      try {
        figma.ui.postMessage({ type: "error", message: msgText });
      } catch (e) {
        try {
          figma.ui.postMessage({ type: "error", message: "Plugin error" });
        } catch (e2) {}
      }
    }
  }
};
