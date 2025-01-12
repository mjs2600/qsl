import React from "react";
import { Box } from "@mui/material";

import MediaViewer from "./components/MediaViewer";
import ControlMenu from "./components/ControlMenu";
import ImagePreloader from "./components/ImagePreloader";
import RegionList from "./components/RegionList";
import LabelerLayout from "./components/LabelerLayout";
import {
  useLoader,
  useDraftLabelState,
  useMediaMouseCallbacks,
} from "./components/library/hooks";
import { draft2labels } from "./components/library/utils";
import { Dimensions, ImageLabelerProps } from "./components/library/types";

const ImageLabeler: React.FC<ImageLabelerProps> = ({
  target,
  labels = { image: {} },
  options,
  callbacks,
  metadata,
  preload,
  config = { image: [], regions: [] },
}) => {
  const { draft, setDraft, resetDraft, cursor, setCursor } = useDraftLabelState(
    labels,
    [target]
  );
  const refs = {
    viewer: React.useRef<HTMLDivElement>(null),
    source: React.useRef<HTMLImageElement>(null),
    canvas: React.useRef<HTMLCanvasElement>(null),
  };
  const loader = useLoader<{
    size: Dimensions;
    layout: "horizontal" | "vertical";
  }>(
    React.useCallback(
      (event: React.SyntheticEvent<HTMLImageElement, Event>) =>
        new Promise((resolve, reject) => {
          if (!refs.source.current) {
            reject("Did not find source ref.");
          } else {
            const size = {
              width: refs.source.current.naturalWidth,
              height: refs.source.current.naturalHeight,
            };
            resolve({
              size,
              layout: size.height > size.width ? "horizontal" : "vertical",
            });
          }
        }),
      [refs.source, target]
    ),
    target
  );

  const save = React.useCallback(
    () =>
      callbacks?.onSave
        ? callbacks.onSave({
            ...draft2labels(draft.labels),
            dimensions: loader.mediaState?.size,
          })
        : undefined,
    [draft, loader.mediaState, callbacks?.onSave]
  );
  const imageCallbacks = useMediaMouseCallbacks(
    draft,
    setDraft,
    cursor,
    setCursor,
    refs,
    config.regions && config.regions.length > 0 ? true : false,
    options?.maxCanvasSize
  );
  return (
    <LabelerLayout
      metadata={metadata}
      progress={options?.progress}
      layout={loader.mediaState?.layout || "horizontal"}
      control={
        <ControlMenu
          cursor={cursor}
          setCursor={setCursor}
          config={config}
          disabled={loader.loadState === "loading"}
          direction={
            (loader.mediaState?.layout || "horizontal") === "horizontal"
              ? "column"
              : "row"
          }
          draft={draft}
          showNavigation={options?.showNavigation}
          setDraft={setDraft}
          callbacks={{
            ...callbacks,
            onSave: callbacks?.onSave ? save : undefined,
            onReset: resetDraft,
          }}
        />
      }
      content={
        <Box>
          <Box>
            <MediaViewer
              size={loader.mediaState?.size}
              maxViewHeight={options?.maxViewHeight}
              cursor={cursor.coords}
              media={{
                main: target ? (
                  <img
                    {...imageCallbacks}
                    ref={refs.source}
                    onLoad={loader.callbacks.onLoad}
                    onError={loader.callbacks.onError}
                    draggable={false}
                    src={loader.src}
                    style={{
                      cursor:
                        config.regions && config.regions.length > 0
                          ? "none"
                          : undefined,
                    }}
                  />
                ) : null,
                mini: target ? <img src={loader.src} /> : null,
              }}
              loadState={loader.loadState}
              onMouseLeave={() => setCursor({ ...cursor, coords: undefined })}
            >
              <RegionList
                cursor={cursor}
                config={config}
                draft={draft}
                callbacks={imageCallbacks}
              />
            </MediaViewer>
          </Box>
          {loader.loadState !== "loading" ? (
            <canvas style={{ display: "none" }} ref={refs.canvas} />
          ) : null}
          {loader.loadState !== "loading" && preload ? (
            <ImagePreloader images={preload} />
          ) : null}
        </Box>
      }
    />
  );
};

export default ImageLabeler;
