import { PhotoshopServiceInterface } from "../photoshop-service-interface";

class AdjustmentLayer {
  private static _instance: AdjustmentLayer;
  private photoshopService!: PhotoshopServiceInterface;

  private constructor() {}

  public static get instance() {
    if (!this._instance) this._instance = new AdjustmentLayer();
    return this._instance;
  }

  public async initeAdjustmentLayer(
    photoshopService: PhotoshopServiceInterface
  ) {
    this.photoshopService = photoshopService;
  }

  public async createLayer(type: string) {
    await this.photoshopService.executeActions([
      {
        _obj: "make",
        _target: { _ref: "adjustmentLayer" },
        using: {
          _obj: "adjustmentLayer",
          type: { _obj: type },
        },
        _options: { dialogOptions: "silent" },
      },
    ]);
  }

  public async modifyBrigthnessContrast(data: {
    brightness?: number;
    contrast?: number;
    isRelative: boolean;
  }) {
    const currentAdjustment = await this.getCurrentAdjustmentLayer();
    if (!currentAdjustment) return;
    let newBrightness =
      (data.brightness ?? 0) +
      (data.isRelative || data.brightness == undefined
        ? currentAdjustment.brightness
        : 0);
    let newContrast =
      (data.contrast ?? 0) +
      (data.isRelative || data.contrast == undefined
        ? currentAdjustment.center
        : 0);
    await this.modifyAdjustmentLayer({
      _obj: "brightnessEvent",
      brightness: newBrightness,
      center: newContrast,
    });
  }

  public async modifyExposureOffsetGamma(data: {
    exposure?: number;
    offset?: number;
    gamma?: number;
    isRelative: boolean;
  }) {
    const currentAdjustment = await this.getCurrentAdjustmentLayer();
    if (!currentAdjustment) return;
    let newExposure =
      (data.exposure ?? 0) +
      (data.isRelative || data.exposure == undefined
        ? currentAdjustment.exposure
        : 0);
    let newOffset =
      (data.offset ?? 0) +
      (data.isRelative || data.offset == undefined
        ? currentAdjustment.offset
        : 0);
    let newGamma =
      (data.gamma ?? 0) +
      (data.isRelative || data.gamma == undefined
        ? currentAdjustment.gammaCorrection
        : 0);

    await this.modifyAdjustmentLayer({
      _obj: "exposure",
      presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
      exposure: newExposure,
      offset: newOffset,
      gammaCorrection: newGamma,
    });
  }

  private async getCurrentAdjustmentLayer(): Promise<any> {
    return (
      await this.photoshopService.executeActions([
        {
          _obj: "get",
          _target: {
            _ref: [
              { _property: "adjustment" },
              {
                _ref: "adjustmentLayer",
                _enum: "ordinal",
                _value: "targetEnum",
              },
            ],
          },
        },
      ])
    )[0].adjustment[0];
  }

  private async modifyAdjustmentLayer(to: object) {
    await this.photoshopService.executeActions([
      {
        _obj: "set",
        _target: {
          _ref: "adjustmentLayer",
          _enum: "ordinal",
          _value: "targetEnum",
        },
        to: to,
        _options: { dialogOptions: "silent" },
      },
    ]);
  }
}

export default AdjustmentLayer.instance;
