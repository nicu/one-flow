import React, { useEffect, useId, useRef, useState, useMemo } from "react";
import { faker } from "@faker-js/faker";
import "./LazyUserList.css";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
// Avatar not used
import Typography from "@mui/material/Typography";
import type { ComponentProperties } from "../types";
import { useDataContext } from "../contexts/DataContext";
import { getSavedImage } from "../utils/getSavedImage";

interface LazyUserListProps {
  properties?: ComponentProperties;
  componentId?: string;
}

// A compact user card used by the list
const UserCard: React.FC<{
  item: any | null;
  visible: boolean;
  imageClass?: string;
  itemClass?: string;
}> = ({ item, visible, imageClass, itemClass }) => {
  // no local imageLoaded tracking needed

  return (
    <Card
      className={itemClass}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        p: 1,
        backgroundColor: "transparent",
      }}
    >
      {visible && item ? (
        <Box sx={{ width: 64, height: 64, flex: "0 0 64px" }}>
          <img
            src={item.avatar}
            alt={item.name}
            className={imageClass}
            style={{
              width: 64,
              height: 64,
              borderRadius: 8,
              objectFit: "cover",
              display: "block",
            }}
          />
        </Box>
      ) : (
        <Box
          sx={{ width: 64, height: 64, background: "#e5e7eb", borderRadius: 1 }}
        />
      )}

      <CardContent sx={{ py: 0, px: 0 }}>
        {visible && item ? (
          <>
            <Typography sx={{ fontWeight: 600 }}>{item.name}</Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              {item.location}
            </Typography>
          </>
        ) : (
          <Box
            sx={{
              width: 160,
              height: 24,
              background: "#e5e7eb",
              borderRadius: 0.5,
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

// positionMap removed (unused)

const LazyUserList: React.FC<LazyUserListProps> = ({ properties = {}, componentId }) => {
  const dataContext = useDataContext();
  const id = useId();

  // derive stable, numeric effective count from properties once
  // default to 12 to match the properties panel default when added to canvas
  const effectiveCount = Number((properties as any).count ?? 12);
  const binding = (properties as any).dataBinding as any;
  const itemsProp = (properties as any).items;

  // Determine items similar to ImageGrid: prefer data binding, then explicit items
  const [items, setItems] = useState<any[]>([]);

  // Determine a stable numeric seed: prefer explicit `properties.seed`, then
  // `componentId`, otherwise fall back to 0. This ensures faker produces the
  // same data on re-renders and interactions.
  const seed = useMemo(() => {
    const s = (properties as any).seed;
    if (s != null) {
      const n = Number(s);
      if (Number.isFinite(n)) return Math.abs(Math.floor(n));
      // try to parse numeric-looking string
      const parsed = parseInt(String(s).replace(/[^0-9-]/g, ""), 10);
      if (Number.isFinite(parsed)) return Math.abs(parsed);
    }
    if (componentId) {
      // simple hash to produce a deterministic integer from the id string
      let h = 0;
      for (let i = 0; i < componentId.length; i++) {
        h = (h << 5) - h + componentId.charCodeAt(i);
        h |= 0;
      }
      return Math.abs(h);
    }
    return 0;
  }, [properties, componentId]);

  // Memoize generated fake items for the current `effectiveCount` and `seed`
  // so we only create them when the count or seed changes.
  const generatedItems = React.useMemo(() => {
    try {
      faker.seed(seed);
    } catch (e) {}
    const arr = new Array(effectiveCount).fill(null).map((_, idx) => ({
      id: faker.string.uuid(),
      name: `${faker.person.firstName()} ${faker.person.lastName()}`,
      location: `${faker.location.city() || "Unknown"}, ${faker.location.country() || ""}`,
      avatar: getSavedImage(idx, 150),
    }));
    return arr;
  }, [effectiveCount, seed]);

  useEffect(() => {
    const collectionId = binding?.collectionId;
    const unwrapResults = binding?.unwrapResults;
    const count = effectiveCount;

    // If bound to a data collection, read from dataContext and limit to `count`
    if (collectionId && dataContext) {
      const dsItems = dataContext.dataStore.data[collectionId] || [];
      const shouldUnwrap = unwrapResults !== false;
      let resolved: any = dsItems;
      if (
        shouldUnwrap &&
        Array.isArray(resolved) &&
        resolved.length === 1 &&
        resolved[0] != null &&
        Array.isArray(resolved[0].results)
      ) {
        resolved = resolved[0].results;
      }
      const limited = Array.isArray(resolved)
        ? resolved.slice(0, count)
        : resolved;
      setItems((prev) => {
        if (
          Array.isArray(prev) &&
          Array.isArray(limited) &&
          prev.length === limited.length &&
          prev.every((p, i) => p?.id === limited[i]?.id)
        ) {
          return prev;
        }
        return limited || [];
      });
      return;
    }

    // If explicit items provided via props, use them (slice to `count`)
    if (itemsProp) {
      const limited = Array.isArray(itemsProp)
        ? itemsProp.slice(0, count)
        : itemsProp;
      setItems((prev) => {
        if (Array.isArray(prev) && Array.isArray(limited)) {
          if (
            prev.length === limited.length &&
            prev.every((p, i) => p?.id === limited[i]?.id)
          ) {
            return prev;
          }
        }
        return (limited || []).slice(0, count);
      });
      return;
    }

    // Fallback: use memoized generated items (created on mount or when count changes)
    setItems((prev) => {
      if (
        Array.isArray(prev) &&
        prev.length === generatedItems.length &&
        prev.every((p, i) => p?.id === generatedItems[i]?.id)
      )
        return prev;
      return generatedItems.slice(0, count);
    });
  }, [
    dataContext,
    itemsProp,
    binding?.collectionId,
    binding?.unwrapResults,
    effectiveCount,
    generatedItems,
  ]);

  // lazy visibility tracking
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [visibleSet, setVisibleSet] = useState<Record<number, boolean>>({});
  const exitLockRef = useRef<Record<number, number>>({});
  // simple in-memory cache to keep preloaded Image objects / flags
  const imageCacheRef = useRef<Record<string, boolean | HTMLImageElement>>({});

  useEffect(() => {
    const threshold = Number((properties as any).intersectionThreshold ?? 0.1);
    const rootMargin = (properties as any).intersectionRootMargin ?? "0px";
    const obs = new IntersectionObserver(
      (entries) => {
        const toSet: Record<number, boolean> = {};
        entries.forEach((e) => {
          const idx = Number((e.target as HTMLElement).dataset.index);
          if (!Number.isFinite(idx)) return;
          const isIntersecting = Boolean(e.isIntersecting);
          // if this index is locked due to a recent exit, ignore new enters
          if (isIntersecting) {
            const lockUntil = exitLockRef.current[idx] || 0;
            if (lockUntil > Date.now()) return;
          } else {
            // leaving: set a short lock so we don't immediately re-enter
            const exitMs =
              Number((properties as any).exitDuration ?? 300) + 100;
            exitLockRef.current[idx] = Date.now() + exitMs;
          }
          toSet[idx] = isIntersecting;
        });
        if (Object.keys(toSet).length > 0) {
          setVisibleSet((prev) => ({ ...prev, ...toSet }));
        }
      },
      { root: null, rootMargin, threshold }
    );

    // observe only the currently rendered slice of items (honor effectiveCount)
    const renderCount = Math.min(effectiveCount, items.length);
    for (let i = 0; i < renderCount; i++) {
      const el = itemRefs.current[i];
      if (el) {
        try {
          obs.observe(el);
        } catch (e) {
          // ignore if already observed or detached
        }
      }
    }

    // also attempt to observe elements that appear shortly after render
    const retryTid = window.setTimeout(() => {
      for (let i = 0; i < renderCount; i++) {
        const el = itemRefs.current[i];
        if (el) {
          try {
            obs.observe(el);
          } catch (e) {}
        }
      }
      // manual visibility pass: if observer didn't fire, mark items in viewport visible
      try {
        const marginPx =
          parseInt(String(rootMargin).replace(/[^0-9-]/g, "")) || 0;
        const vis: Record<number, boolean> = {};
        for (let i = 0; i < renderCount; i++) {
          const el = itemRefs.current[i];
          if (!el) continue;
          const r = el.getBoundingClientRect();
          if (
            r.top <
              (window.innerHeight || document.documentElement.clientHeight) +
                marginPx &&
            r.bottom > -marginPx
          ) {
            vis[i] = true;
          }
        }
        if (Object.keys(vis).length)
          setVisibleSet((prev) => ({ ...prev, ...vis }));
      } catch (e) {}
    }, 50) as unknown as number;

    return () => {
      obs.disconnect();
      clearTimeout(retryTid as unknown as number);
    };
  }, [items, effectiveCount, properties]);

  // animation timers and maps
  const animTimersRef = useRef<Record<number, number>>({});
  const [animMap, setAnimMap] = useState<Record<number, string>>({});
  const [imageAnimMap, setImageAnimMap] = useState<Record<number, string>>({});
  const [renderContent, setRenderContent] = useState<Record<number, boolean>>(
    {}
  );
  const lastScrollTopRef = useRef<number>(0);
  const lastScrollDirRef = useRef<"down" | "up">("down");

  // mark first few items as visible on mount and add a single scroll listener
  useEffect(() => {
    const initial = Math.min(4, effectiveCount);
    if (initial > 0) {
      setVisibleSet((prev) => {
        // only set if we actually add new entries to avoid triggering rerenders
        const copy = { ...(prev || {}) } as Record<number, boolean>;
        let changed = false;
        for (let i = 0; i < initial; i++) {
          if (!copy[i]) {
            copy[i] = true;
            changed = true;
          }
        }
        return changed ? copy : prev;
      });
    }

    const onScroll = () => {
      const cur = window.scrollY || window.pageYOffset || 0;
      if (cur > lastScrollTopRef.current) lastScrollDirRef.current = "down";
      else if (cur < lastScrollTopRef.current) lastScrollDirRef.current = "up";
      lastScrollTopRef.current = cur;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [effectiveCount]);

  // Prefetch avatars for the current items or generated fallback so
  // subsequently created <img> elements reuse the browser cache and
  // avoid repeated network fetches when scrolling items in/out.
  useEffect(() => {
    try {
      const source = (
        Array.isArray(items) && items.length ? items : generatedItems
      ).slice(0, effectiveCount);
      source.forEach((it) => {
        const src = it?.avatar;
        if (!src) return;
        if (imageCacheRef.current[src]) return;
        const img = new Image();
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          img.decoding = "async";
        } catch (e) {}
        img.onload = () => {
          imageCacheRef.current[src] = true;
        };
        img.onerror = () => {
          imageCacheRef.current[src] = false;
        };
        imageCacheRef.current[src] = img;
        img.src = src;
      });
    } catch (e) {}
  }, [items, generatedItems, effectiveCount]);

  // Clean up any animation timers that are now out of range when count changes
  useEffect(() => {
    const max = effectiveCount;
    Object.keys(animTimersRef.current).forEach((k) => {
      const idx = Number(k);
      if (!Number.isFinite(idx)) return;
      if (idx >= max) {
        clearTimeout(animTimersRef.current[idx]);
        delete animTimersRef.current[idx];
      }
    });
  }, [effectiveCount]);

  // Manage enter/exit animation classes when visibility changes
  const prevVisibleRef = useRef<Record<number, boolean>>({});
  useEffect(() => {
    const enterDuration = Number((properties as any).enterDuration ?? 400);
    const exitDuration = Number((properties as any).exitDuration ?? 300);
    const nextAnim: Record<number, string> = {};
    const nextImageAnim: Record<number, string> = {};

    const allIdx = new Set<number>([
      ...Object.keys(visibleSet).map(Number),
      ...Object.keys(prevVisibleRef.current).map(Number),
    ]);

    const selected = ((properties as any).animation || "none") as string;

    allIdx.forEach((idx) => {
      const prev = Boolean(prevVisibleRef.current[idx]);
      const cur = Boolean(visibleSet[idx]);
      if (prev === cur) return;

      // clear any existing animation timers for this index
      if (animTimersRef.current[idx]) {
        clearTimeout(animTimersRef.current[idx]);
        delete animTimersRef.current[idx];
      }

      // Map selected animation to class suffixes for enter/exit.
      const mapEnter = (sel: string) => {
        if (!sel) return "";
        if (sel === "none") return "";
        if (sel === "debug") return "debug";
        // fade only applies on enter
        if (sel === "fade") return "fade";
        if (sel === "slide-left") return "slide-left";
        if (sel === "slide-right") return "slide-right";
        if (sel === "scale-in") return "scale-in";
        if (sel === "scale-out") return "scale-out";
        return "";
      };

      const mapExit = (sel: string) => {
        if (!sel) return "";
        if (sel === "none") return "";
        if (sel === "debug") return "debug";
        // fade has no exit animation
        if (sel === "fade") return "";
        if (sel === "slide-left") return "slide-left";
        if (sel === "slide-right") return "slide-right";
        if (sel === "scale-in") return "scale-in";
        if (sel === "scale-out") return "scale-out";
        return "";
      };

      if (cur && !prev) {
        // ENTER
        const enterAnimName = mapEnter(selected);
        // expose content immediately
        setRenderContent((m) => ({ ...(m || {}), [idx]: true }));

        if (enterAnimName) {
          nextAnim[idx] = `of-item-enter of-anim-${enterAnimName}`;
          nextImageAnim[idx] = `of-image-enter of-anim-${enterAnimName}`;
          setAnimMap((m) => ({ ...(m || {}), [idx]: nextAnim[idx] }));
          setImageAnimMap((m) => ({ ...(m || {}), [idx]: nextImageAnim[idx] }));

          // activate
          window.setTimeout(() => {
            setAnimMap((m) => ({
              ...(m || {}),
              [idx]: (m[idx] ? m[idx] + " " : "") + "of-item-enter-active",
            }));
            setImageAnimMap((m) => ({
              ...(m || {}),
              [idx]: (m[idx] ? m[idx] + " " : "") + "of-image-enter-active",
            }));
          }, 16);

          // cleanup after enter duration
          const removeTid = window.setTimeout(() => {
            setAnimMap((m) => {
              const copy = { ...(m || {}) };
              delete copy[idx];
              return copy;
            });
            setImageAnimMap((m) => {
              const copy = { ...(m || {}) };
              delete copy[idx];
              return copy;
            });
          }, enterDuration + 40) as unknown as number;
          animTimersRef.current[idx] = removeTid;
        }
      }

      if (!cur && prev) {
        // EXIT
        const exitAnimName = mapExit(selected);
        if (exitAnimName) {
          nextAnim[idx] = `of-item-exit of-anim-${exitAnimName}`;
          nextImageAnim[idx] = `of-image-exit of-anim-${exitAnimName}`;
          setAnimMap((m) => ({ ...(m || {}), [idx]: nextAnim[idx] }));
          setImageAnimMap((m) => ({ ...(m || {}), [idx]: nextImageAnim[idx] }));

          // activate exit
          window.setTimeout(() => {
            setAnimMap((m) => ({
              ...(m || {}),
              [idx]: (m[idx] ? m[idx] + " " : "") + "of-item-exit-active",
            }));
            setImageAnimMap((m) => ({
              ...(m || {}),
              [idx]: (m[idx] ? m[idx] + " " : "") + "of-image-exit-active",
            }));
          }, 16);

          // after exit animation finished, remove classes and content
          const removeTid = window.setTimeout(() => {
            setAnimMap((m) => {
              const copy = { ...(m || {}) };
              delete copy[idx];
              return copy;
            });
            setImageAnimMap((m) => {
              const copy = { ...(m || {}) };
              delete copy[idx];
              return copy;
            });
            setRenderContent((m) => {
              const copy = { ...(m || {}) } as Record<number, boolean>;
              if (copy[idx]) delete copy[idx];
              return copy;
            });
          }, exitDuration + 40) as unknown as number;
          animTimersRef.current[idx] = removeTid;
        } else {
          // no exit animation: immediately remove content
          setRenderContent((m) => {
            const copy = { ...(m || {}) } as Record<number, boolean>;
            if (copy[idx]) delete copy[idx];
            return copy;
          });
          setAnimMap((m) => {
            const copy = { ...(m || {}) } as Record<number, string>;
            if (copy[idx]) delete copy[idx];
            return copy;
          });
          setImageAnimMap((m) => {
            const copy = { ...(m || {}) } as Record<number, string>;
            if (copy[idx]) delete copy[idx];
            return copy;
          });
        }
      }
    });

    prevVisibleRef.current = { ...(visibleSet || {}) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleSet]);

  // ensure items array length is always clamped to effectiveCount
  useEffect(() => {
    setItems((prev) => {
      const arr = Array.isArray(prev) ? prev.slice(0, effectiveCount) : [];
      while (arr.length < effectiveCount) arr.push(null);
      return arr;
    });
  }, [effectiveCount]);

  const cols = (() => {
    const g = properties.gridColumns;
    if (!g) return 1;
    if (typeof g === "number") return g;
    return g.desktop || g.tablet || g.mobile || 1;
  })();

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: properties.gap || "12px",
    width: properties.width || "100%",
  };

  const itemClassName = (properties as any).itemClassName;
  const imageClassName = (properties as any).imageClassName;

  // Precompute rendered nodes to avoid IIFE in JSX
  const renderCount = Math.min(effectiveCount, items.length);
  const renderNodes = (items || [])
    .slice(0, renderCount)
    .map((it: any, idx: number) => {
      const visible = Boolean(visibleSet[idx]);
      const contentVisible = Boolean(renderContent[idx]);
      const displayItem = it ?? (visible ? generatedItems[idx] ?? null : null);
      const baseItemClass = itemClassName || "";
      const baseImageClass = imageClassName || "";
      const extraAnim = animMap[idx] || "";
      const extraImageAnim = imageAnimMap[idx] || "";

      return (
        <Box
          key={displayItem?.id || idx}
          data-index={idx}
          ref={(el: HTMLDivElement | null) => {
            itemRefs.current[idx] = el;
          }}
          sx={{ minHeight: 88 }}
          className={`${baseItemClass} ${extraAnim}`.trim()}
        >
          <UserCard
            item={displayItem}
            visible={contentVisible || visible}
            imageClass={`${baseImageClass} ${extraImageAnim}`.trim()}
            itemClass={baseItemClass}
          />
        </Box>
      );
    });
  return (
    <Box
      id={`lazy-user-list-${id}`}
      ref={containerRef}
      sx={{
        padding: properties.padding || 0,
        // expose durations as CSS variables for transitions
        ["--enter-duration" as any]: `${
          (properties as any).enterDuration ?? 400
        }ms`,
        ["--exit-duration" as any]: `${
          (properties as any).exitDuration ?? 300
        }ms`,
      }}
    >
      {(properties as any).title && (
        <Typography
          variant={(properties as any).titleVariant || "h2"}
          sx={{ mb: 1 }}
        >
          {(properties as any).title}
        </Typography>
      )}

      <Box sx={{ ...gridStyle }}>{renderNodes}</Box>
    </Box>
  );
};

export default LazyUserList;
