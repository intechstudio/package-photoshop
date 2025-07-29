import {
  contentAwareFill,
  createLayerMask,
  mergeVisibleDuplicate,
  psAppRef,
  refreshToolUi,
  switchColors,
} from "../lib/variables";
import { PhotoshopServiceInterface } from "../photoshop-service-interface";
import tools from "./tools";
import imageAdjustment from "./image-adjustment";
import adjustmentLayer from "./adjustment-layer";
import { EditorServiceInterface } from "../editor-service-interface";

class PhotoshopCommandHandler {
  private _photoshopService!: PhotoshopServiceInterface;
  _editorService!: EditorServiceInterface;

  public menuInfo: Map<string, string> = new Map();
  public toolInfo: Map<string, string> = new Map();

  public initializeCommunication(
    photoshopService: PhotoshopServiceInterface,
    editorService: EditorServiceInterface,
  ) {
    this._photoshopService = photoshopService;
    this._editorService = editorService;
    tools.initTools(photoshopService);
    imageAdjustment.initImageAdjustments(photoshopService);
    adjustmentLayer.initeAdjustmentLayer(photoshopService);

    /*photoshopService.addActionNotificationListener(
      ["set"],
      (name: any, descriptor: any) => {
        if (descriptor.to?.masterDiameter && descriptor.to._obj === "brush") {
          editorService.sendMessageToEditor(
            JSON.stringify({
              type: "execute-lua-script",
              script: `<?lua --[[@cb]] brush_size(${descriptor.to.masterDiameter._value}) ?>`,
            }),
          );
        }
      },
    );*/
  }

  private static _instance: PhotoshopCommandHandler;

  private constructor() {}

  public static get instance() {
    if (!this._instance) this._instance = new PhotoshopCommandHandler();
    return this._instance;
  }

  handleCommand(params: any[], commandMode: string) {
    let executeCommand = (
      commandOverlay: string,
      command: () => Promise<any>,
    ): Promise<any> => {
      if (commandMode.includes("overlay")) {
        this._editorService.sendMessageToEditor(
          JSON.stringify({
            type: "show-overlay-info",
            info: commandOverlay,
          }),
        );
      }
      if (commandMode.includes("execute")) {
        return command();
      }

      return Promise.resolve();
    };

    switch (params[0]) {
      case "menu":
        return executeCommand(
          `Menu command ${this.menuInfo.get(params[1]) ?? params[1]}`,
          () => this._photoshopService.performMenuCommand(Number(params[1])),
        );
      case "json":
        return executeCommand("Custom JSON action", () =>
          this._photoshopService.executeActions(JSON.parse(params[1])),
        );
      case "tool-parameter":
        return executeCommand(
          params[3]
            ? `Change ${params[1]} by ${params[2]}`
            : `Set ${params[1]} to ${params[2]}`,
          () => tools.setToolParameters(params[1], params[2], params[3]),
        );
      case "select-tool":
        return executeCommand(
          `${this.toolInfo.get(params[1]) ?? params[1]} selected`,
          () => tools.setTool(params[1]),
        );
      case "image-adjustment":
        return executeCommand(
          `Adjust image ${params[1]} by ${params[2]}`,
          () => {
            switch (params[1]) {
              case "brightness":
                return imageAdjustment.changeBrightnessContrast(params[2], 0);
              case "contrast":
                return imageAdjustment.changeBrightnessContrast(0, params[2]);
              case "hue":
                return imageAdjustment.changeHSL(params[2], 0, 0);
              case "saturation":
                return imageAdjustment.changeHSL(0, params[2], 0);
              case "lightness":
                return imageAdjustment.changeHSL(0, 0, params[2]);
            }
            return Promise.reject();
          },
        );
      case "create-adjustment":
        return executeCommand(`Create ${params[1]} adjustment layer`, () =>
          adjustmentLayer.createLayer(params[1]),
        );
      case "adjust-adjustment":
        return executeCommand(
          params[3]
            ? `Adjust layer ${params[1]} by ${params[2]}`
            : `Set layer ${params[1]} to ${params[2]}`,
          () => {
            switch (params[1]) {
              case "brightness":
                return adjustmentLayer.modifyBrigthnessContrast({
                  brightness: params[2],
                  isRelative: params[3],
                });
              case "contrast":
                return adjustmentLayer.modifyBrigthnessContrast({
                  contrast: params[2],
                  isRelative: params[3],
                });
              case "exposure":
                return adjustmentLayer.modifyExposureOffsetGamma({
                  exposure: params[2],
                  isRelative: params[3],
                });
              case "offset":
                return adjustmentLayer.modifyExposureOffsetGamma({
                  offset: params[2],
                  isRelative: params[3],
                });
              case "gamma":
                return adjustmentLayer.modifyExposureOffsetGamma({
                  gamma: params[2],
                  isRelative: params[3],
                });
              case "vibrance":
                return adjustmentLayer.modifyVibranceSaturation({
                  vibrance: params[2],
                  isRelative: params[3],
                });
              case "vibranceSaturation":
                return adjustmentLayer.modifyVibranceSaturation({
                  saturation: params[2],
                  isRelative: params[3],
                });
              case "hue":
                return adjustmentLayer.modifyHueSaturationLightness({
                  hue: params[2],
                  isRelative: params[3],
                });
              case "saturation":
                return adjustmentLayer.modifyHueSaturationLightness({
                  saturation: params[2],
                  isRelative: params[3],
                });
              case "lightness":
                return adjustmentLayer.modifyHueSaturationLightness({
                  lightness: params[2],
                  isRelative: params[3],
                });
            }
            return Promise.reject();
          },
        );
      case "quick-action":
        switch (params[1]) {
          case "toggle-tool":
            return executeCommand(`Toogle current/previous tool`, () =>
              tools.setPreviousTool(),
            );
          case "content-fill":
            return executeCommand(`Content-aware auto fill`, () =>
              this._photoshopService.executeActions([contentAwareFill]),
            );
          case "switch-colors":
            return executeCommand(`Switch primary/secondary color`, () =>
              this._photoshopService.executeActions([
                switchColors,
                refreshToolUi,
              ]),
            );
          case "merge-visible-duplicate":
            return executeCommand(`Merge visible layers`, () =>
              this._photoshopService.executeActions([mergeVisibleDuplicate]),
            );
          case "create-layer-mask":
            return executeCommand(`Create layer mask`, () =>
              this._photoshopService.executeActions([createLayerMask]),
            );
        }
        break;
    }
  }
}

export default PhotoshopCommandHandler.instance;
