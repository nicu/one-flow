import React, { useState } from "react";

type SmartImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  query?: string;
  widthHint?: number;
};

export const SmartImage: React.FC<SmartImageProps> = ({
  src,
  query,
  widthHint,
  onError,
  ...rest
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(
    typeof src === "string" ? src : undefined
  );
  const [triedFallback, setTriedFallback] = useState(false);

  async function fetchFallbackImg(keyword?: string, w?: number) {
    try {
      const q = encodeURIComponent(keyword || "random");
      const url = `/api/unsplash/random?q=${q}${w ? `&w=${w}` : ""}`;
      const resp = await fetch(url);
      if (!resp.ok) return;
      const data = await resp.json();
      if (data?.url) setCurrentSrc(data.url);
    } catch (err) {
      // ignore
    }
  }

  async function handleError(e: React.SyntheticEvent<HTMLImageElement, Event>) {
    if (onError) {
      try {
        (onError as any)(e);
      } catch {}
    }

    if (triedFallback) {
      // final fallback to placehold
      const w = widthHint || 800;
      const h = Math.round((w * 9) / 16);
      setCurrentSrc(
        `https://placehold.co/${w}x${h}/000000/FFFFFF?text=Image+Unavailable`
      );
      return;
    }

    setTriedFallback(true);

    // If original src is a source.unsplash.com link, try our API with the query
    if (typeof src === "string" && src.includes("source.unsplash.com")) {
      const queryPart = src.split("?")[1] || "";
      let qParam = queryPart;
      // If query has key=value, try to grab last part
      if (queryPart.includes("="))
        qParam = queryPart.split("=").pop() || queryPart;
      await fetchFallbackImg(query || qParam || "random", widthHint);
      return;
    }

    // Otherwise, try our API with provided query or 'random'
    await fetchFallbackImg(query || "random", widthHint);
  }

  return <img src={currentSrc} onError={handleError} {...(rest as any)} />;
};

export default SmartImage;
