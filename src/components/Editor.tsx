import { useEffect, useRef, useState } from "react";
import "./Editor.css";
import { getSavedImage } from "../utils/getSavedImage";

type Layer = {
  id: string;
  name: string;
  enabled: boolean;
  animationType?: string;
  duration?: number;
};

const defaultLayers: Layer[] = [
  {
    id: "image",
    name: "Image",
    enabled: true,
    animationType: "fade",
    duration: 1200,
  },
  {
    id: "title",
    name: "Title",
    enabled: true,
    animationType: "slide",
    duration: 1000,
  },
  {
    id: "subtitle",
    name: "Subtitle",
    enabled: true,
    animationType: "slide",
    duration: 1000,
  },
  {
    id: "rating",
    name: "Rating",
    enabled: true,
    animationType: "scale",
    duration: 800,
  },
  {
    id: "desc",
    name: "Description",
    enabled: true,
    animationType: "fade",
    duration: 1200,
  },
];

export default function Editor() {
  const [layers, setLayers] = useState<Layer[]>(defaultLayers);
  const [selected, setSelected] = useState<string>(layers[0].id);
  const animMap = useRef<Map<string, Animation>>(new Map());
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const layersRef = useRef<Layer[]>(layers);
  const [time, setTime] = useState(0);
  const [timelineDuration, setTimelineDuration] = useState(1500);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const repeatState = useState(false);
  const repeat = repeatState[0];

  useEffect(() => {
    // create animations for each layer using WAAPI and element refs
    const maxD = Math.max(...layers.map((l) => l.duration ?? 1000));
    layers.forEach((l) => {
      const el = refs.current[l.id];
      if (!el) return;
      const layerDuration = l.duration ?? 1000;
      let frames: Keyframe[] = [];
      switch (l.animationType) {
        case "fade":
          frames = [
            { opacity: 0, transform: "translateY(8px)" },
            { opacity: 1, transform: "translateY(0)" },
          ];
          break;
        case "slide":
          frames = [
            { opacity: 0, transform: "translateX(-24px)" },
            { opacity: 1, transform: "translateX(0)" },
          ];
          break;
        case "scale":
          frames = [
            { transform: "scale(0.8)", opacity: 0 },
            { transform: "scale(1)", opacity: 1 },
          ];
          break;
        case "rotate":
          frames = [
            { transform: "rotate(-12deg)", opacity: 0 },
            { transform: "rotate(0deg)", opacity: 1 },
          ];
          break;
        default:
          frames = [{ opacity: 0 }, { opacity: 1 }];
      }
      const anim = el.animate(frames, {
        duration: l.duration ?? 1000,
        fill: "both",
        easing: "ease",
      });
      anim.pause();
      anim.currentTime = 0;
      // when animation finishes and we're not repeating, pause everything
      // but only if this animation corresponds to the timeline's longest duration
      anim.onfinish = () => {
        if (!repeat) {
          const currentMax = Math.max(
            ...layersRef.current.map((l) => l.duration ?? 1000)
          );
          if (layerDuration >= currentMax) {
            playingRef.current = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            animMap.current.forEach((a) => {
              try {
                a.pause();
              } catch (e) {}
            });
          }
        }
      };
      animMap.current.set(l.id, anim);
    });
    setTimelineDuration(maxD);
    return () => {
      animMap.current.forEach((a) => a.cancel());
      animMap.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure the timelineDuration always reflects the longest layer duration
  // whenever layers change (e.g. when a duration is edited).
  useEffect(() => {
    layersRef.current = layers;
    const maxD = Math.max(...layers.map((l) => l.duration ?? 1000));
    setTimelineDuration(maxD);
  }, [layers]);

  function setScrub(ms: number) {
    setTime(ms);
    animMap.current.forEach((a) => {
      try {
        a.currentTime = ms;
      } catch (e) {}
    });
    // If scrub reaches the end and we're not repeating, pause playback so
    // the animations don't immediately resume (allows safe scrubbing).
    if (!repeat && ms >= timelineDuration) {
      playingRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      animMap.current.forEach((a) => {
        try {
          a.pause();
        } catch (e) {}
      });
    }
  }

  function playAll(forward = true) {
    playingRef.current = true;
    // update iterations (loop) and direction, then play
    animMap.current.forEach((a) => {
      try {
        // update iterations if available
        const effect = a.effect as any as { updateTiming?: (t: any) => void };
        if (effect && typeof effect.updateTiming === "function") {
          effect.updateTiming({ iterations: repeat ? Infinity : 1 });
        }
      } catch (e) {}

      try {
        if (!forward) {
          // if starting from zero, jump to end so reverse plays
          if (!a.playState || a.currentTime === 0) {
            try {
              a.currentTime = timelineDuration;
            } catch (e) {}
          }
          a.playbackRate = -1;
        } else {
          a.playbackRate = 1;
        }
        a.play();
      } catch (e) {}
    });

    // simple RAF to update scrub position
    function tick() {
      const any = Array.from(animMap.current.values())[0];
      if (any) {
        const ct = Number(any.currentTime ?? 0);
        setTime(Math.min(ct, timelineDuration));
      }
      if (playingRef.current) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function pauseAll() {
    playingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    animMap.current.forEach((a) => a.pause());
  }

  function toggleLayer(id: string) {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    );
    const anim = animMap.current.get(id);
    const el = refs.current[id];
    if (anim && el) {
      if (anim.playState === "running") {
        anim.pause();
      }
      // hide or show element when toggled
      const updated = !layers.find((x) => x.id === id)!.enabled;
      el.style.display = updated ? "" : "none";
    }
  }

  function setAnimationTypeForSelected(type: string) {
    // recreate animation for selected layer
    const layer = layers.find((l) => l.id === selected)!;
    layer.animationType = type;
    setLayers([...layers]);
    const el = refs.current[layer.id];
    if (!el) return;
    const frames: Keyframe[] =
      type === "fade"
        ? [{ opacity: 0 }, { opacity: 1 }]
        : type === "slide"
        ? [
            { transform: "translateX(-24px)", opacity: 0 },
            { transform: "translateX(0)", opacity: 1 },
          ]
        : type === "scale"
        ? [
            { transform: "scale(0.8)", opacity: 0 },
            { transform: "scale(1)", opacity: 1 },
          ]
        : [
            { transform: "rotate(-12deg)", opacity: 0 },
            { transform: "rotate(0deg)", opacity: 1 },
          ];
    const old = animMap.current.get(layer.id);
    old?.cancel();
    const anim = el.animate(frames, {
      duration: layer.duration ?? 1000,
      fill: "both",
      easing: "ease",
    });
    anim.pause();
    anim.currentTime = time;
    const layerDuration = layer.duration ?? 1000;
    anim.onfinish = () => {
      if (!repeat) {
        const currentMax = Math.max(
          ...layersRef.current.map((l) => l.duration ?? 1000)
        );
        if (layerDuration >= currentMax) {
          playingRef.current = false;
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          animMap.current.forEach((a) => {
            try {
              a.pause();
            } catch (e) {}
          });
        }
      }
    };
    animMap.current.set(layer.id, anim);
  }

  function setDurationForSelected(d: number) {
    const layer = layers.find((l) => l.id === selected)!;
    layer.duration = d;
    setLayers([...layers]);
    const el = refs.current[layer.id];
    if (!el) return;
    const old = animMap.current.get(layer.id);
    old?.cancel();
    let frames: Keyframe[] = [{ opacity: 0 }, { opacity: 1 }];
    switch (layer.animationType) {
      case "fade":
        frames = [
          { opacity: 0, transform: "translateY(8px)" },
          { opacity: 1, transform: "translateY(0)" },
        ];
        break;
      case "slide":
        frames = [
          { opacity: 0, transform: "translateX(-24px)" },
          { opacity: 1, transform: "translateX(0)" },
        ];
        break;
      case "scale":
        frames = [
          { transform: "scale(0.8)", opacity: 0 },
          { transform: "scale(1)", opacity: 1 },
        ];
        break;
      case "rotate":
        frames = [
          { transform: "rotate(-12deg)", opacity: 0 },
          { transform: "rotate(0deg)", opacity: 1 },
        ];
        break;
    }
    const anim = el.animate(frames, {
      duration: d,
      fill: "both",
      easing: "ease",
    });
    anim.pause();
    anim.currentTime = time;
    const layerDuration = d;
    anim.onfinish = () => {
      if (!repeat) {
        const currentMax = Math.max(
          ...layersRef.current.map((l) => l.duration ?? 1000)
        );
        if (layerDuration >= currentMax) {
          playingRef.current = false;
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          animMap.current.forEach((a) => {
            try {
              a.pause();
            } catch (e) {}
          });
        }
      }
    };
    animMap.current.set(layer.id, anim);
  }

  return (
    <div
      className="ae-editor"
      style={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <div className="layers">
        {layers.map((l) => (
          <div
            key={l.id}
            className={`layer ${selected === l.id ? "selected" : ""}`}
            onClick={() => setSelected(l.id)}
          >
            <div>
              <strong>{l.name}</strong>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                {l.animationType} · {l.duration}ms
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLayer(l.id);
                }}
              >
                {l.enabled ? "On" : "Off"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="controls">
        <button
          className="button"
          onClick={() => playAll(false)}
          title="Play reverse"
        >
          ◀
        </button>
        <button
          className="button"
          onClick={() => playAll(true)}
          title="Play forward"
        >
          ▶
        </button>

        <button className="button" onClick={pauseAll}>
          Pause
        </button>
        <label style={{ marginLeft: 8, color: "var(--muted)" }}>
          Selected:
        </label>
        <select
          value={layers.find((x) => x.id === selected)?.animationType}
          onChange={(e) => setAnimationTypeForSelected(e.target.value)}
        >
          <option value="fade">Fade</option>
          <option value="slide">Slide</option>
          <option value="scale">Scale</option>
          <option value="rotate">Rotate</option>
        </select>
        <label style={{ color: "var(--muted)" }}>Duration</label>
        <input
          type="number"
          value={layers.find((x) => x.id === selected)?.duration}
          onChange={(e) => setDurationForSelected(Number(e.target.value))}
          style={{ width: 100 }}
        />
      </div>

      <div className="timeline">
        <input
          className="scrub"
          type="range"
          min={0}
          max={timelineDuration}
          value={time}
          onChange={(e) => setScrub(Number(e.target.value))}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "var(--muted)",
            fontSize: 12,
          }}
        >
          <div>{Math.round(time)}ms</div>
          <div>{timelineDuration}ms</div>
        </div>
      </div>

      {/* Stage rendered inside editor so component is self-contained */}
      <div className="canvas">
        <div style={{ padding: 12 }}>
          <div style={{ color: "var(--muted)" }}>Stage</div>
        </div>
        <div className="stage">
          <div className="card" id="stage-card">
            <img
              ref={(el) => {
                refs.current["image"] = el;
              }}
              id="layer-image"
              src={getSavedImage(1, 150)}
              alt="product"
            />
            <div className="meta">
              <h2
                ref={(el) => {
                  refs.current["title"] = el;
                }}
                style={{ margin: 0 }}
              >
                Product Title
              </h2>
              <div
                ref={(el) => {
                  refs.current["subtitle"] = el;
                }}
                style={{ color: "var(--muted)" }}
              >
                Subtitle goes here
              </div>
              <div
                ref={(el) => {
                  refs.current["rating"] = el;
                }}
                style={{ color: "var(--muted)" }}
              >
                ★★★★☆
              </div>
              <p
                ref={(el) => {
                  refs.current["desc"] = el;
                }}
                style={{ marginTop: 6, color: "var(--muted)", maxWidth: 320 }}
              >
                A short description of the product to show how description layer
                behaves.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
