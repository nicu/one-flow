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
  } catch (e) {}
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
    } catch (e) {}
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
    } catch (e) {}

    // Runtime importer (copied from compiled JS for parity)
    var figMap = new Map();

    async function exportNode(node) {
      try {
        figMap.set(node.id, node);
      } catch (e) {}
      const base = { id: node.id, properties: {} };
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

      function extractStyle(n, props) {
        try {
          if (typeof n.cornerRadius === "number") props.borderRadius = n.cornerRadius + "px";
          else if (Array.isArray(n.rectangleCornerRadii)) {
            props.borderRadius = n.rectangleCornerRadii.map(function (v) { return v + "px"; }).join(" ");
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
            var shadows = n.effects.filter(function (e) { return e.type === "DROP_SHADOW" || e.type === "INNER_SHADOW"; });
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
                parts.push(inset + normalizeSize(ox) + " " + normalizeSize(oy) + " " + normalizeSize(blur) + " " + normalizeSize(spread) + " " + colorStr);
              }
              props.boxShadow = parts.join(", ");
            }
          }
        } catch (e) {}
      }

      if (node.type === "TEXT") {
        try {
          const len = (node.characters || "").length;
          if (node.getRangeAllFontNames) {
            const fonts = node.getRangeAllFontNames(0, len) || [];
            await Promise.all(fonts.map((f) => figma.loadFontAsync(f)));
          }
        } catch (e) {}
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

      if (node.type === "FRAME" || node.type === "GROUP" || node.type === "COMPONENT" || node.type === "INSTANCE") {
        if (node.layoutMode === "HORIZONTAL") base.type = "row";
        else if (node.layoutMode === "VERTICAL") base.type = "column";
        else base.type = "flex";
        const props = base.properties;
        if (node.paddingTop != null) props.padding = normalizeSize(node.paddingTop) + " " + normalizeSize(node.paddingRight);
        if (node.fills && node.fills[0]) {
          const c = normalizeColor(node.fills[0]);
          if (c) props.backgroundColor = c;
        }
        extractStyle(node, props);
        const children = [];
        for (const child of node.children || []) children.push(await exportNode(child));
        if (children.length) base.children = children;
        return base;
      }

      if (node.type === "RECTANGLE" || node.type === "ELLIPSE" || node.type === "VECTOR") {
        const fills = node.fills || [];
        const imageFill = fills.find((f) => f.type === "IMAGE");
        if (imageFill) {
          try {
            const exported = await node.exportAsync({ format: "PNG" });
            const b64 = toBase64(exported);
            return { id: node.id, type: "image", properties: { src: "data:image/png;base64," + b64 } };
          } catch (e) {}
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
          return { id: node.id, type: "image", properties: { src: "data:image/png;base64," + b64 } };
        } catch (e) {}
      }

      if (node.children && node.children.length) {
        const children = [];
        for (const child of node.children) children.push(await exportNode(child));
        return { id: node.id, type: "flex", properties: {}, children };
      }

      try {
        const exported = await node.exportAsync({ format: "PNG" });
        const b64 = toBase64(exported);
        return { id: node.id, type: "image", properties: { src: "data:image/png;base64," + b64 } };
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
      if (a === 1) return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
      return "rgba(" + r + "," + g + "," + b + "," + a + ")";
    }

    function toBase64(bytes) {
      var binary = "";
      var len = bytes.length;
      for (var i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
      return btoa(binary);
    }

    async function exportSelection() {
      const selection = figma.currentPage.selection;
      const nodes = selection.length ? selection : figma.currentPage.children;
      const out = [];
      for (const n of nodes) {
        try {
          out.push(await exportNode(n));
        } catch (e) {}
      }
      function groupAbsoluteInTree(arr) {
        for (const node of arr) {
          if (node.children && node.children.length) {
            groupChildren(node);
            groupAbsoluteInTree(node.children);
          }
        }
      }
      function groupChildren(parent) {
        if (parent && parent.properties && parent.properties.__generated) return;
        const children = parent.children || [];
        const entries = children.map(function (c, idx) { return { comp: c, idx: idx, fig: figMap.get(c.id) }; });
        const absolute = entries.filter(function (e) { return e.fig && e.fig.absoluteBoundingBox; });
        if (absolute.length < 2) return;
        const items = absolute.map(function (e) {
          var bb = e.fig.absoluteBoundingBox;
          var cx = bb.x + bb.width / 2;
          var cy = bb.y + bb.height / 2;
          return Object.assign(Object.assign({}, e), { cx: cx, cy: cy, w: bb.width, h: bb.height });
        });
        items.sort(function (a, b) { return a.cy - b.cy; });
        var rows = [];
        var rowTol = 24;
        for (var _i = 0; _i < items.length; _i++) {
          var it = items[_i];
          var last = rows[rows.length - 1];
          if (!last) {
            rows.push([it]);
            continue;
          }
          var avgY = last.reduce(function (s, x) { return s + x.cy; }, 0) / last.length;
          if (Math.abs(it.cy - avgY) <= rowTol) last.push(it);
          else rows.push([it]);
        }
        var cols = Math.max.apply(null, rows.map(function (r) { return r.length; }));
        if (rows.length >= 2 && cols >= 2) {
          var colWidths = [];
          for (var _a = 0; _a < rows.length; _a++) {
            var r = rows[_a];
            r.sort(function (a, b) { return a.cx - b.cx; });
            r.forEach(function (it, i) { colWidths[i] = (colWidths[i] || 0) + it.w; });
          }
          var avgWidths = colWidths.map(function (s) { return Math.round(s / rows.length); });
          var minCol = Math.max(48, Math.round(avgWidths.reduce(function (a, b) { return a + b; }, 0) / avgWidths.length));
          var container = { id: parent.id + "-grid-" + Math.random().toString(36).slice(2, 8), type: "grid", properties: { __generated: true, minColumnWidth: minCol + "px", gap: "12px" }, children: [] };
          for (var _b = 0; _b < rows.length; _b++) {
            var r2 = rows[_b];
            r2.sort(function (a, b) { return a.cx - b.cx; });
            for (var _c = 0; _c < r2.length; _c++) container.children.push(r2[_c].comp);
          }
          var groupedIds = new Set(container.children.map(function (c) { return c.id; }));
          var remaining = children.filter(function (c) { return !groupedIds.has(c.id); });
          var minIdx = Math.min.apply(null, entries.filter(function (e) { return groupedIds.has(e.comp.id); }).map(function (e) { return e.idx; }));
          remaining.splice(minIdx, 0, container);
          parent.children = remaining;
          return;
        }
        if (rows.length === 1) {
          var row = rows[0].sort(function (a, b) { return a.cx - b.cx; });
          var container = { id: parent.id + "-row-" + Math.random().toString(36).slice(2, 8), type: "row", properties: { __generated: true, gap: "12px", alignItems: "center" }, children: row.map(function (it) { return it.comp; }) };
          var groupedIds = new Set(container.children.map(function (c) { return c.id; }));
          var remaining = children.filter(function (c) { return !groupedIds.has(c.id); });
          var minIdx = Math.min.apply(null, entries.filter(function (e) { return groupedIds.has(e.comp.id); }).map(function (e) { return e.idx; }));
          remaining.splice(minIdx, 0, container);
          parent.children = remaining;
          return;
        }
        if (cols === 1) {
          var colItems = items.sort(function (a, b) { return a.cy - b.cy; });
          var container = { id: parent.id + "-col-" + Math.random().toString(36).slice(2, 8), type: "column", properties: { __generated: true, gap: "8px" }, children: colItems.map(function (it) { return it.comp; }) };
          var groupedIds = new Set(container.children.map(function (c) { return c.id; }));
          var remaining = children.filter(function (c) { return !groupedIds.has(c.id); });
          var minIdx = Math.min.apply(null, entries.filter(function (e) { return groupedIds.has(e.comp.id); }).map(function (e) { return e.idx; }));
          remaining.splice(minIdx, 0, container);
          parent.children = remaining;
          return;
        }
      }
      try { groupAbsoluteInTree(out); } catch (e) { try { figma.ui.postMessage({ type: "debug", message: "grouping_failed: " + String(e) }); } catch (e2) { } }
      return out;
    }

    figma.showUI(__html__, { width: 480, height: 640 });

    figma.ui.onmessage = async (msg) => {
      if (msg.type === "export") {
        try {
          const result = await exportSelection();
          var payload;
          try { payload = JSON.stringify(result, null, 2); } catch (e) { payload = "<<stringify failed: " + String(e) + ">>"; }
          try { figma.ui.postMessage({ type: "result", data: payload }); } catch (e) { try { figma.ui.postMessage({ type: "result", data: String(payload).slice(0, 100000) }); } catch (e2) { figma.ui.postMessage({ type: "result", data: "" }); } }
        } catch (err) { var msgText = "Unknown error"; try { msgText = (err && err.message) || String(err); } catch (e) { msgText = "Unknown error during error serialization"; } try { figma.ui.postMessage({ type: "error", message: msgText }); } catch (e) { try { figma.ui.postMessage({ type: "error", message: "Plugin error" }); } catch (e2) {} } }
      }
      if (msg.type === "import") {
        try {
          figma.ui.postMessage({ type: "progress", message: "Import handler invoked" });
          var payload = typeof msg.data === "string" ? msg.data : JSON.stringify(msg.data);
          var components;
          try { components = JSON.parse(payload); } catch (pe) { figma.ui.postMessage({ type: "error", message: "JSON parse error: " + String(pe) }); return; }
          try {
            var counts = { total: 0, text: 0, image: 0, button: 0, input: 0 };
            function walk(n) { if (!n) return; if (Array.isArray(n)) return n.forEach(walk); counts.total++; if (n.type === "text") counts.text++; if (n.type === "image") counts.image++; if (n.type === "button") counts.button++; if (n.type === "input") counts.input++; if (n.children) walk(n.children); }
            walk(components);
            figma.ui.postMessage({ type: "progress", message: "Parsed JSON — nodes:" + counts.total + " text:" + counts.text + " image:" + counts.image });
          } catch (e) { figma.ui.postMessage({ type: "debug", message: "counting_failed: " + String(e) }); }
          try { try { await figma.loadFontAsync({ family: "Inter", style: "Regular" }); } catch (fe) {} try { await figma.loadFontAsync({ family: "Inter", style: "Bold" }); } catch (fe) {} } catch (fe2) {}
          function parsePx(v) { if (v == null) return undefined; if (typeof v === "number") return v; var s = String(v).trim(); var m = s.match(/^([0-9.]+)px$/); if (m) return parseFloat(m[1]); var n = parseFloat(s); if (!Number.isNaN(n)) return n; return undefined; }
          function dataUrlToUint8(url) { try { var idx = url.indexOf(','); if (idx === -1) return null; var header = url.slice(0, idx); var body = url.slice(idx + 1); if (header.indexOf('base64') !== -1) { var bin = atob(body); var arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; ++i) arr[i] = bin.charCodeAt(i); return arr; } var enc = encodeURIComponent(body); var bytes = new Uint8Array(enc.length); for (var j = 0; j < enc.length; ++j) bytes[j] = enc.charCodeAt(j); return bytes; } catch (e) { return null; } }
          async function createNodeSimple(comp) {
            if (!comp || typeof comp !== "object") return null;
            var type = comp.type || "box";
            function applyAbsoluteHints(node, comp) { try { var abs = comp && comp.absolute; if (abs) { if (typeof abs.x === "number") try { node.x = abs.x; } catch (e) {} if (typeof abs.y === "number") try { node.y = abs.y; } catch (e) {} if (typeof abs.width === "number" && typeof node.resize === "function") try { node.resize(abs.width, node.height || abs.height || node.width || 100); } catch (e) {} if (typeof abs.height === "number" && typeof node.resize === "function") try { node.resize(node.width || abs.width || 100, abs.height); } catch (e) {} } } catch (e) {} }
            if (type === "text") { var t = figma.createText(); try { t.characters = comp.properties && comp.properties.text ? String(comp.properties.text) : ""; } catch (e2) { t.characters = ""; } var fs = parsePx(comp.properties && comp.properties.fontSize); if (fs) try { t.fontSize = fs; } catch (e3) {} if (comp.properties && comp.properties.color) { try { var cc = parseColorString(comp.properties.color); if (cc) t.fills = [{ type: "SOLID", color: { r: cc.r, g: cc.g, b: cc.b }, opacity: cc.a }]; } catch (e) {} } applyAbsoluteHints(t, comp); return t; }
            if (type === "image") { var rect = figma.createRectangle(); var src = comp.properties && comp.properties.src ? String(comp.properties.src) : ""; var appliedImage = false; if (src && src.indexOf("data:") === 0) { try { var b = dataUrlToUint8(src); if (b) { var img = figma.createImage(b); rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: img.hash }]; appliedImage = true; } } catch (eImg) {} } else if (src && (src.indexOf("http://") === 0 || src.indexOf("https://") === 0)) { try { const resp = await fetch(src); const buf = await resp.arrayBuffer(); const bytes = new Uint8Array(buf); try { var img2 = figma.createImage(bytes); rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: img2.hash }]; appliedImage = true; } catch (eImg2) {} } catch (eFetch) {} } var w = parsePx(comp.properties && comp.properties.width); var h = parsePx(comp.properties && comp.properties.height); if (w && h) try { rect.resize(w,h); } catch (e4) {} try { var br = comp.properties && comp.properties.borderRadius; if (br) { var px = parsePx(br); if (px) try { rect.cornerRadius = px; } catch (e) {} } } catch (e) {} try { if (!appliedImage && comp.properties && comp.properties.backgroundColor) { var cb = comp.properties.backgroundColor; var c = parseColorString(cb); if (c) rect.fills = [{ type: "SOLID", color: { r: c.r, g: c.g, b: c.b }, opacity: c.a }]; } } catch (e) {} applyAbsoluteHints(rect, comp); return rect; }
            if (type === "box") { var r = figma.createRectangle(); try { if (comp.properties && comp.properties.backgroundColor) { var cb2 = comp.properties.backgroundColor; var c2 = parseColorString(cb2); if (c2) r.fills = [{ type: "SOLID", color: { r: c2.r, g: c2.g, b: c2.b }, opacity: c2.a }]; } } catch (e) {} var br = comp.properties && comp.properties.borderRadius; if (br) { var px = parsePx(br); if (px) try { r.cornerRadius = px; } catch (e5) {} } var ww = parsePx(comp.properties && comp.properties.width); var hh = parsePx(comp.properties && comp.properties.height); if (ww && hh) try { r.resize(ww, hh); } catch (e6) {} applyAbsoluteHints(r, comp); return r; }
            if (type === "row" || type === "column" || type === "flex" || type === "grid") { var f = figma.createFrame(); if (type === "row") f.layoutMode = "HORIZONTAL"; else if (type === "column") f.layoutMode = "VERTICAL"; else f.layoutMode = "NONE"; try { if (comp.properties && comp.properties.backgroundColor) { var cb3 = comp.properties.backgroundColor; var c3 = parseColorString(cb3); if (c3) f.fills = [{ type: "SOLID", color: { r: c3.r, g: c3.g, b: c3.b }, opacity: c3.a }]; } else { f.fills = []; } } catch (e) {} var children = comp.children || []; var gapVal = parsePx(comp.properties && comp.properties.gap) || 8; var cursorX = 0; var cursorY = 0; var maxRowHeight = 0; var maxColWidth = 0; for (var i = 0; i < children.length; i++) { try { var childComp = children[i]; var created = await createNodeSimple(childComp); if (!created) continue; f.appendChild(created); var childHasAbs = childComp && childComp.absolute; if (childHasAbs) continue; try { if (type === "row") { try { created.x = cursorX; } catch (e) {} try { created.y = 0; } catch (e) {} var cw = (childComp && childComp.absolute && childComp.absolute.width) || parsePx(childComp && childComp.properties && childComp.properties.width) || created.width || 100; var chh = (childComp && childComp.absolute && childComp.absolute.height) || parsePx(childComp && childComp.properties && childComp.properties.height) || created.height || 40; cursorX += (cw || 100) + gapVal; if (chh && chh > maxRowHeight) maxRowHeight = chh; } else if (type === "column") { try { created.x = 0; } catch (e) {} try { created.y = cursorY; } catch (e) {} var chw = (childComp && childComp.absolute && childComp.absolute.width) || parsePx(childComp && childComp.properties && childComp.properties.width) || created.width || 100; var chh2 = (childComp && childComp.absolute && childComp.absolute.height) || parsePx(childComp && childComp.properties && childComp.properties.height) || created.height || 40; cursorY += (chh2 || 40) + gapVal; if (chw && chw > maxColWidth) maxColWidth = chw; } else { try { created.x = 0; } catch (e) {} try { created.y = cursorY; } catch (e) {} var chh3 = (childComp && childComp.absolute && childComp.absolute.height) || parsePx(childComp && childComp.properties && childComp.properties.height) || created.height || 40; cursorY += (chh3 || 40) + gapVal; var chw2 = (childComp && childComp.absolute && childComp.absolute.width) || parsePx(childComp && childComp.properties && childComp.properties.width) || created.width || 100; if (chw2 && chw2 > maxColWidth) maxColWidth = chw2; } } catch (e) {} } catch (ce) { figma.ui.postMessage({ type: "debug", message: "createNodeSimple child failed: " + String(ce) }); } } try { var fw = parsePx(comp.properties && comp.properties.width); var fh = parsePx(comp.properties && comp.properties.height); if (fw || fh) { try { f.resize(fw || Math.max(cursorX - gapVal, 100), fh || Math.max(cursorY - gapVal, 100)); } catch (e) {} } else { if (type === "row") { try { f.resize(Math.max(cursorX - gapVal, 100), Math.max(maxRowHeight, 40)); } catch (e) {} } else { try { f.resize(Math.max(maxColWidth, 100), Math.max(cursorY - gapVal, 40)); } catch (e) {} } } } catch (e) {} return f; }
            var t2 = figma.createText(); try { t2.characters = comp.properties && comp.properties.text ? String(comp.properties.text) : String(comp.type || ""); } catch (e7) { t2.characters = ""; } return t2;
          }
          figma.ui.postMessage({ type: "progress", message: "Creating nodes..." });
          var root = figma.createFrame(); root.name = "Imported from OneFlow"; try { root.x = figma.viewport.center.x - 300; root.y = figma.viewport.center.y - 200; } catch (e8) {}
          root.fills = [];
          if (Array.isArray(components)) {
            for (var idx = 0; idx < components.length; idx++) {
              try { var node = await createNodeSimple(components[idx]); if (node) root.appendChild(node); figma.ui.postMessage({ type: "progress", message: "Created " + (idx+1) + "/" + components.length }); } catch (err2) { figma.ui.postMessage({ type: "debug", message: "create failed idx " + idx + ": " + String(err2) }); }
            }
          } else if (typeof components === "object") { try { var nodeRoot = await createNodeSimple(components); if (nodeRoot) root.appendChild(nodeRoot); } catch (err3) { figma.ui.postMessage({ type: "debug", message: "create failed root: " + String(err3) }); } }
          try { figma.currentPage.appendChild(root); try { figma.currentPage.selection = [root]; } catch (selErr) {} try { figma.viewport.scrollAndZoomIntoView([root]); } catch (vzErr) {} } catch (e9) { figma.ui.postMessage({ type: "debug", message: "append failed: " + String(e9) }); }
          figma.ui.postMessage({ type: "import-complete", id: root.id, data: "Import complete" });
        } catch (e) { figma.ui.postMessage({ type: "error", message: String(e) }); }
      }
    };
      // pre-load fonts once if the JSON contains text nodes to avoid repetitive loads
      function containsTextNodes(obj) {
        if (!obj) return false;
        if (Array.isArray(obj)) return obj.some((c) => containsTextNodes(c));
        if (typeof obj !== "object") return false;
        if (String(obj.type) === "text") return true;
        const children = obj.children || [];
        if (Array.isArray(children) && children.length)
          return containsTextNodes(children);
        return false;
      }

      if (containsTextNodes(components)) {
        try {
          await figma.loadFontAsync({ family: "Roboto", style: "Regular" });
        } catch (e) {}
        try {
          await figma.loadFontAsync({ family: "Roboto", style: "Bold" });
        } catch (e) {}
      }

      figma.ui.postMessage({ type: "progress", message: "Creating nodes..." });

      const root = figma.createFrame();
      root.name = "Imported from OneFlow";
      root.x = figma.viewport.center.x - 300;
      root.y = figma.viewport.center.y - 200;
      root.fills = [];
      if (Array.isArray(components)) {
        for (let i = 0; i < components.length; i++) {
          const c = components[i];
          try {
            const n = await createNode(c);
            if (n) root.appendChild(n);
            figma.ui.postMessage({
              type: "progress",
              message: `Created ${i + 1}/${components.length}`,
            });
          } catch (e) {
            figma.ui.postMessage({
              type: "debug",
              message: `createNode failed for index ${i}: ${String(e)}`,
            });
          }
        }
      } else if (typeof components === "object") {
        try {
          const n = await createNode(components);
          if (n) root.appendChild(n);
        } catch (e) {
          figma.ui.postMessage({
            type: "debug",
            message: `createNode failed for root object: ${String(e)}`,
          });
        }
      }
      try {
        figma.currentPage.appendChild(root);
        try { figma.currentPage.selection = [root]; } catch (e) {}
        try { figma.viewport.scrollAndZoomIntoView([root]); } catch (e) {}
      } catch (e) {
        figma.ui.postMessage({ type: "debug", message: "append failed: " + String(e) });
      }
      figma.ui.postMessage({ type: "import-complete", id: root.id, data: "Import complete" });
    } catch (err) {
      let msgText = "Import error";
      try {
        msgText = (err && (err as any).message) || String(err);
      } catch (e) {}
      figma.ui.postMessage({ type: "error", message: msgText });
    }
  }
};
