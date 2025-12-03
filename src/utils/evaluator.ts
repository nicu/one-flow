import type { Edge, Node } from "reactflow";

type Flags = Record<string, any>;

function parseValue(v: any) {
  if (v === true || v === false) return v;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const low = v.toLowerCase().trim();
    if (low === "true") return true;
    if (low === "false") return false;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
    return v;
  }
  return v;
}

export function evaluateExpressionFromGraph(
  nodes: Node<any>[],
  edges: Edge<any>[],
  flags: Flags
): boolean {
  const nodesById = new Map(nodes.map((n) => [n.id, n]));
  const incoming = new Map<string, Edge<any>[]>();
  const outgoing = new Map<string, Edge<any>[]>();

  edges.forEach((e) => {
    if (!incoming.has(e.target)) incoming.set(e.target, []);
    incoming.get(e.target)!.push(e);
    if (!outgoing.has(e.source)) outgoing.set(e.source, []);
    outgoing.get(e.source)!.push(e);
  });

  const cache = new Map<string, any>();
  const visiting = new Set<string>();

  function evalNode(id: string): any {
    if (cache.has(id)) return cache.get(id);
    if (visiting.has(id)) return false; // avoid cycles
    visiting.add(id);
    const node = nodesById.get(id);
    if (!node) {
      visiting.delete(id);
      return false;
    }
    const ins = incoming.get(id) || [];
    let result: any = false;

    switch (node.type) {
      case "flagNode": {
        const key = node.data?.flagKey;
        result = Boolean(flags?.[key]);
        break;
      }
      case "constantNode": {
        if (ins.length > 0) {
          // evaluate first incoming source (can be extended)
          result = evalNode(ins[0].source);
        } else {
          result = parseValue(node.data?.value);
        }
        break;
      }
      case "comparisonNode": {
        const vals = ins.map((e) => evalNode(e.source));
        const left =
          vals[0] !== undefined ? vals[0] : parseValue(node.data?.left);
        const right =
          vals[1] !== undefined
            ? vals[1]
            : parseValue(node.data?.right ?? node.data?.value);
        const op = node.data?.operator || "equals";
        switch (op) {
          case "equals":
            result = left === right;
            break;
          case "not_equals":
            result = left !== right;
            break;
          case "gt":
            result = Number(left) > Number(right);
            break;
          case "lt":
            result = Number(left) < Number(right);
            break;
          case "gte":
            result = Number(left) >= Number(right);
            break;
          case "lte":
            result = Number(left) <= Number(right);
            break;
          default:
            result = left === right;
        }
        break;
      }
      case "logicalNode": {
        const vals = ins.map((e) => Boolean(evalNode(e.source)));
        const op = (node.data?.op || "and").toLowerCase();
        if (op === "or") result = vals.some(Boolean);
        else result = vals.every(Boolean);
        break;
      }
      default: {
        // fallback: if the node has incoming edges, return first incoming evaluation
        if (ins.length > 0) result = evalNode(ins[0].source);
        else result = Boolean(node.data?.value);
      }
    }

    visiting.delete(id);
    cache.set(id, result);
    return result;
  }

  // pick root nodes (nodes without outgoing edges) and evaluate first root
  const rootCandidates = nodes.filter((n) => !outgoing.has(n.id));
  if (rootCandidates.length === 0) {
    // if no root, try nodes with type comparison or logical as potential outputs
    const fallback = nodes.find(
      (n) => n.type === "comparisonNode" || n.type === "logicalNode"
    );
    if (fallback) return Boolean(evalNode(fallback.id));
    return false;
  }

  return Boolean(evalNode(rootCandidates[0].id));
}

export function evaluateExpressionFromPayload(
  payload: string,
  flags: Flags
): boolean {
  try {
    const parsed = payload ? JSON.parse(payload) : { nodes: [], edges: [] };
    return evaluateExpressionFromGraph(
      parsed.nodes || [],
      parsed.edges || [],
      flags || {}
    );
  } catch {
    return false;
  }
}
