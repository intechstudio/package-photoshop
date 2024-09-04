import { ActionDescriptor } from "photoshop/dom/CoreModules";
import { psAppRef } from "../lib/variables";
import { PhotoshopServiceInterface } from "../photoshop-service-interface";
import tools from "./tools";
import imageAdjustment from "./image-adjustment";
import adjustmentLayer from "./adjustment-layer";

interface PhotoshopCommand {
  type: string;
  actions?: ActionDescriptor[];
  commandID?: number;
}

class PhotoshopCommandHandler {
  private _photoshopService!: PhotoshopServiceInterface;

  public get photoshopService() {
    return this._photoshopService;
  }

  public set photoshopService(service: PhotoshopServiceInterface) {
    this._photoshopService = service;
    tools.initTools(service);
    imageAdjustment.initImageAdjustments(service);
    adjustmentLayer.initeAdjustmentLayer(service);
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
        await this.photoshopService.performMenuCommand(Number(params[1]));
        break;
      case "json":
        await this.photoshopService.executeActions(params[1]);
      case "content-fill":
        await this.photoshopService.executeActions([
          {
            _obj: "fill",
            using: {
              _enum: "fillContents",
              _value: "contentAware",
            },
            opacity: {
              _unit: "percentUnit",
              _value: 100,
            },
            mode: {
              _enum: "blendMode",
              _value: "normal",
            },
            _isCommand: true,
            _options: {
              dialogOptions: "dontDisplay",
            },
          },
        ]);
        break;
      case "tool-parameter":
        await tools.setToolParameters(params[1], params[2], params[3]);
        break;
      case "toggle-tool":
        await tools.setPreviousTool();
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
        break;
    }
  }
}

export default PhotoshopCommandHandler.instance;
