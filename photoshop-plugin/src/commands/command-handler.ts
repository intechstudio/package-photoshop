import { ActionDescriptor } from "photoshop/dom/CoreModules";
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

interface PhotoshopCommand {
  type: string;
  actions?: ActionDescriptor[];
  commandID?: number;
}

class PhotoshopCommandHandler {
  private _photoshopService!: PhotoshopServiceInterface;
  private _editorService!: EditorServiceInterface;

  public initializeCommunication(
    photoshopService: PhotoshopServiceInterface,
    editorService: EditorServiceInterface
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

  async handleCommand(params: any) {
    switch (params[0]) {
      case "menu":
        await this._photoshopService.performMenuCommand(Number(params[1]));
        break;
      case "json":
        await this._photoshopService.executeActions(JSON.parse(params[1]));
      case "tool-parameter":
        await tools.setToolParameters(params[1], params[2], params[3]);
        break;
      case "select-tool":
        await tools.setTool(params[1]);
        break;
      case "image-adjustment":
        switch (params[1]) {
          case "brightness":
            await imageAdjustment.changeBrightnessContrast(params[2], 0);
            break;
          case "contrast":
            await imageAdjustment.changeBrightnessContrast(0, params[2]);
            break;
          case "hue":
            await imageAdjustment.changeHSL(params[2], 0, 0);
            break;
          case "saturation":
            await imageAdjustment.changeHSL(0, params[2], 0);
            break;
          case "lightness":
            await imageAdjustment.changeHSL(0, 0, params[2]);
            break;
        }
        break;
      case "create-adjustment":
        await adjustmentLayer.createLayer(params[1]);
        break;
      case "adjust-adjustment":
        switch (params[1]) {
          case "brightness":
            await adjustmentLayer.modifyBrigthnessContrast({
              brightness: params[2],
              isRelative: params[3],
            });
            break;
          case "contrast":
            await adjustmentLayer.modifyBrigthnessContrast({
              contrast: params[2],
              isRelative: params[3],
            });
            break;
          case "exposure":
            await adjustmentLayer.modifyExposureOffsetGamma({
              exposure: params[2],
              isRelative: params[3],
            });
            break;
          case "offset":
            await adjustmentLayer.modifyExposureOffsetGamma({
              offset: params[2],
              isRelative: params[3],
            });
            break;
          case "gamma":
            await adjustmentLayer.modifyExposureOffsetGamma({
              gamma: params[2],
              isRelative: params[3],
            });
            break;
        }
      case "quick-action":
        switch (params[1]) {
          case "toggle-tool":
            await tools.setPreviousTool();
            break;
          case "content-fill":
            await this._photoshopService.executeActions([contentAwareFill]);
            break;
          case "switch-colors":
            await this._photoshopService.executeActions([
              switchColors,
              refreshToolUi,
            ]);
            break;
          case "merge-visible-duplicate":
            await this._photoshopService.executeActions([
              mergeVisibleDuplicate,
            ]);
            break;
          case "create-layer-mask":
            await this._photoshopService.executeActions([createLayerMask]);
            break;
        }
        break;
        break;
    }
  }
}

export default PhotoshopCommandHandler.instance;
