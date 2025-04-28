import { PhotoshopServiceInterface } from "../photoshop-service-interface";

class ImageAdjustments {
  private static _instance: ImageAdjustments;
  private _photoshopService!: PhotoshopServiceInterface;

  private constructor() {}

  public static get instance() {
    if (!this._instance) this._instance = new ImageAdjustments();
    return this._instance;
  }

  public async initImageAdjustments(
    photoshopService: PhotoshopServiceInterface,
  ) {
    this._photoshopService = photoshopService;
  }

  public async changeBrightnessContrast(brightness: number, contrast: number) {
    await this._photoshopService.executeActions([
      {
        _obj: "brightnessEvent",
        brightness: brightness,
        contrast: contrast,
      },
    ]);
  }

  public async changeHSL(hue: number, saturation: number, lightness: number) {
    await this._photoshopService.executeActions([
      {
        _obj: "hueSaturation",
        presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
        adjustment: [
          {
            _obj: "hueSatAdjustmentV2",
            hue: hue,
            lightness: lightness,
            saturation: saturation,
          },
        ],
      },
    ]);
  }
}

export default ImageAdjustments.instance;
