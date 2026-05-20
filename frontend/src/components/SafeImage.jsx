import { useState } from "react";

function SafeImage({ src, alt, className = "", fallbackClassName = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return fallbackClassName ? <div className={fallbackClassName} /> : null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default SafeImage;
