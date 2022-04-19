import React from "react";
import ReactDOM from "react-dom";
import { WidgetModel } from "@jupyter-widgets/base";
import { PageConfig } from "@jupyterlab/coreutils";
import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from "@jupyter-widgets/base";
import {
  ImageLabeler,
  VideoLabeler,
  Labels,
  Config,
  BatchImageLabeler,
  TimestampedLabel,
} from "react-image-labeler";
import { useModelState } from "./hooks";
import { MODULE_NAME, MODULE_VERSION } from "./version";

interface BaseWidgetState<T, U> {
  states: {
    metadata: { [key: string]: string };
    selected: boolean;
    visible: boolean;
    ignored: boolean;
    labeled: boolean;
  }[];
  urls: string[];
  type: T;
  config: Config;
  labels: U;
  updated: number;
  action: "next" | "prev" | "delete" | "ignore" | "unignore" | "";
  metadata: { [key: string]: string };
  preload: string[];
  showNavigation: boolean;
  maxCanvasSize: number;
  buttons: {
    next: boolean;
    prev: boolean;
    save: boolean;
    config: boolean;
    delete: boolean;
    ignore: boolean;
    unignore: boolean;
  };
  base: {
    serverRoot: string;
    url: string;
  };
  progress: number;
  mode: "light" | "dark";
}

type ImageWidgetState = BaseWidgetState<"image", Labels>;
type VideoWidgetState = BaseWidgetState<"video", TimestampedLabel[]>;
type WidgetState = VideoWidgetState | ImageWidgetState;

const DEFAULT_PROPERTIES: WidgetState = {
  states: [],
  urls: [],
  type: "image",
  config: { image: [], regions: [] } as Config,
  labels: { image: {}, polygons: [], masks: [], boxes: [] } as Labels,
  updated: Date.now(),
  action: "" as "next" | "prev" | "delete" | "ignore" | "unignore" | "",
  metadata: {} as { [key: string]: string },
  preload: [] as string[],
  showNavigation: true,
  maxCanvasSize: 512 as number,
  buttons: {
    next: true,
    prev: true,
    save: true,
    config: true,
    delete: true,
    ignore: true,
    unignore: true,
  },
  base: {
    serverRoot: "",
    url: "",
  },
  progress: -1,
  mode: "light" as "light" | "dark",
};

const Widget: React.FC<{
  model: WidgetModel;
}> = ({ model }) => {
  // @ts-ignore
  const [config, setConfig] = useModelState<WidgetState, "config">(
    "config",
    model
  );
  // @ts-ignore
  const [states, setStates] = useModelState<WidgetState, "states">(
    "states",
    model
  );
  // @ts-ignore
  const [urls, setUrls] = useModelState<WidgetState, "urls">("urls", model);
  // @ts-ignore
  const [type, setType] = useModelState<WidgetState, "type">("type", model);
  // @ts-ignore
  const [labels, setLabels] = useModelState<WidgetState, "labels">(
    "labels",
    model
  );
  // @ts-ignore
  const [updated, setUpdated] = useModelState<WidgetState, "updated">(
    "updated",
    model
  );
  // @ts-ignore
  const [action, setAction] = useModelState<WidgetState, "action">(
    "action",
    model
  );
  // @ts-ignore
  const [base, setBase] = useModelState<WidgetState, "base">("base", model);
  // @ts-ignore
  const [progress, setProgress] = useModelState<WidgetState, "progress">(
    "progress",
    model
  );
  // @ts-ignore
  const [mode, setMode] = useModelState<WidgetState, "mode">("mode", model);
  // @ts-ignore
  const [buttons, setButtons] = useModelState<WidgetState, "buttons">(
    "buttons",
    model
  );
  // @ts-ignore
  const [preload, setPreload] = useModelState<WidgetState, "preload">(
    "preload",
    model
  );
  // @ts-ignore
  const [maxCanvasSize, setMaxCanvasSize] = useModelState<
    WidgetState,
    "maxCanvasSize"
  >("maxCanvasSize", model);
  // @ts-ignore
  const [showNavigation, setShowNavigation] = useModelState<
    WidgetState,
    "showNavigation"
  >("showNavigation", model);

  React.useEffect(() => {
    setBase({
      serverRoot: PageConfig.getOption("serverRoot"),
      url: PageConfig.getBaseUrl(),
    });
  });
  const common = {
    config,
    preload,
    options: { progress, mode, maxCanvasSize, showNavigation },
    callbacks: {
      onSave: buttons["save"]
        ? (labels: any) => {
            setLabels(labels);
            setUpdated(Date.now());
          }
        : undefined,
      onSaveConfig: buttons["config"] ? setConfig : undefined,
      onNext: buttons["next"] ? () => setAction("next") : undefined,
      onPrev: buttons["prev"] ? () => setAction("prev") : undefined,
      onDelete: buttons["delete"] ? () => setAction("delete") : undefined,
      onIgnore: buttons["ignore"] ? () => setAction("ignore") : undefined,
      onUnignore: buttons["unignore"] ? () => setAction("unignore") : undefined,
    },
  };
  const style = {
    padding: 16,
    backgroundColor: mode == "dark" ? "rgb(18, 18, 18)" : "white",
  };
  if (states.length === 0) {
    return null;
  } else if (states.length === 1) {
    const props = {
      target: urls[0],
      metadata: states[0].metadata,
      ...common,
    };
    return (
      <div style={style}>
        {type == "image" ? (
          <ImageLabeler labels={(labels || {}) as Labels} {...props} />
        ) : (
          <VideoLabeler
            labels={(Array.isArray(labels) ? labels : []) as TimestampedLabel[]}
            {...props}
          />
        )}
      </div>
    );
  } else {
    if (type !== "image") {
      return <p>Videos cannot be batch labeled.</p>;
    }
    return (
      <div style={style}>
        <BatchImageLabeler
          {...common}
          target={urls}
          states={states}
          setStates={(states) => setStates(states)}
        />
      </div>
    );
  }
};

class ImageLabelerModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: ImageLabelerModel.model_name,
      _model_module: ImageLabelerModel.model_module,
      _model_module_version: ImageLabelerModel.model_module_version,
      _view_name: ImageLabelerModel.view_name,
      _view_module: ImageLabelerModel.view_module,
      _view_module_version: ImageLabelerModel.view_module_version,
      ...DEFAULT_PROPERTIES,
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = "ImageLabelerModel";
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = "ImageLabelerView"; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

class ImageLabelerView extends DOMWidgetView {
  render() {
    this.el.classList.add("qsl-image-labeler-widget");
    const component = React.createElement(Widget, {
      model: this.model,
    });
    ReactDOM.render(component, this.el);
  }
}

export { ImageLabelerModel, ImageLabelerView };