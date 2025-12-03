/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Edge, Node } from "reactflow";

type Flags = Record<string, any>;

export function evaluateExpressionFromGraph(
  nodes: Node<any>[],
  edges: Edge<any>[],
  flags: Flags,
  debug = false
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
    if (debug) {
      try {
        console.groupCollapsed(`eval node ${id} (${node.type})`);
        console.log("node.data=", node.data, "incoming=", ins.length);
      } catch {
        /* ignore */
      }
    }
    switch (node.type) {
      case "flagNode": {
        const key = node.data?.flagKey;
        // Preserve flag value type (do not coerce to boolean or string)
        result = flags ? flags[key] : undefined;
        break;
      }
      case "constantNode": {
        if (ins.length > 0) {
          // evaluate first incoming source (can be extended)
          result = evalNode(ins[0].source);
        } else {
          // keep constant value as-is (strings remain strings, booleans remain booleans)
          result = node.data?.value;
        }
        break;
      }
      case "comparisonNode": {
        const vals = ins.map((e) => evalNode(e.source));
        const left = vals[0] !== undefined ? vals[0] : node.data?.left;

        // If the comparison has no second incoming operand, allow a downstream
        // constant (connected via an outgoing edge) to supply the right value.
        let fallbackRight: any = undefined;
        const outs = outgoing.get(id) || [];
        for (const oe of outs) {
          const targetNode = nodesById.get(oe.target);
          if (!targetNode) continue;
          if (targetNode.type === "constantNode") {
            // use literal constant value (do not recurse into its incoming edges)
            fallbackRight = targetNode.data?.value;
            break;
          }
        }

        const right =
          vals[1] !== undefined
            ? vals[1]
            : fallbackRight !== undefined
            ? fallbackRight
            : node.data?.right ?? node.data?.value;

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
    if (debug) {
      try {
        console.log("-> result=", result);
        console.groupEnd();
      } catch {
        /* ignore */
      }
    }
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
  const final = Boolean(evalNode(rootCandidates[0].id));
  if (debug) {
    try {
      console.log("final result for root", rootCandidates[0].id, final);
    } catch {
      /* ignore */
    }
  }
  return final;
}

const STORAGE_KEY = "of_expressions";

export function evaluateExpressionFromPayload(
  payloadOrName: string,
  flags: Flags,
  debug = false
): boolean {
  if (!payloadOrName) return false;

  // Try parsing as a JSON payload first
  try {
    const parsed = JSON.parse(payloadOrName);
    if (parsed && (parsed.nodes || parsed.edges)) {
      return evaluateExpressionFromGraph(
        parsed.nodes || [],
        parsed.edges || [],
        flags || {},
        debug
      );
    }
  } catch {
    // not JSON — fallthrough to treat as saved-expression name
  }

  // Treat as saved expression name: look up in localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || "[]";
    const items = JSON.parse(raw) as Array<{ name: string; payload: string }>;
    const found = items.find((it) => it.name === payloadOrName);
    if (found && found.payload) {
      try {
        const parsed = JSON.parse(found.payload);
        return evaluateExpressionFromGraph(
          parsed.nodes || [],
          parsed.edges || [],
          flags || {},
          debug
        );
      } catch {
        return false;
      }
    }
  } catch {
    // ignore
  }

  return false;
}
