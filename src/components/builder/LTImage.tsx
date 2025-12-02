import React from "react";
import type { ComponentProperties } from "../../types";

const LTImage: React.FC<{ properties?: ComponentProperties }> = ({
  properties,
}) => {
  const props = properties || ({} as ComponentProperties);
  const src = props.src ?? "https://picsum.photos/300/200";
  const alt = props.alt ?? "image";
  const style: React.CSSProperties = {
    width: props.width ?? "100%",
    height: props.height ?? "auto",
    objectFit: props.objectFit ?? "cover",
    borderRadius: props.borderRadius ?? "8px",
  };

  return <img src={src} alt={alt} style={style} />;
};

export default LTImage;
