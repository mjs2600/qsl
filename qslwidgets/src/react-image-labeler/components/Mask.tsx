import React from "react";
import { Bitmap } from "./library/types";

type MaskProps = {
  bitmap: Bitmap;
  color: "red" | "blue" | "yellow";
} & React.ComponentProps<"canvas">;

const Mask: React.FC<MaskProps> = ({ bitmap, color, ...childProps }) => {
  const canvas = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    if (bitmap && canvas.current) {
      const context = canvas.current.getContext("2d");
      if (!context) {
        throw "Failed to find canvas context.";
      }
      canvas.current.width = bitmap.dimensions.width;
      canvas.current.height = bitmap.dimensions.height;
      const pixels = context.createImageData(
        bitmap.dimensions.width,
        bitmap.dimensions.height
      );
      const colorValues =
        color === "red"
          ? [255, 0, 0, 127]
          : color === "blue"
          ? [0, 0, 255, 127]
          : [255, 255, 0, 127];
      Uint8ClampedArray.from(
        Array.from(bitmap.values)
          .map((v) => (v === 255 ? colorValues : [0, 0, 0, 0]))
          .flat()
      ).forEach((v, i) => (pixels.data[i] = v));
      context.putImageData(pixels, 0, 0);
    }
  }, [bitmap, color, canvas]);
  return (
    <canvas
      {...childProps}
      className="region mask"
      style={{
        ...(childProps.style || {}),
        imageRendering: "pixelated",
        position: "absolute",
        width: "100%",
        height: "100%",
        top: 0,
      }}
      ref={canvas}
    />
  );
};

export default Mask;
