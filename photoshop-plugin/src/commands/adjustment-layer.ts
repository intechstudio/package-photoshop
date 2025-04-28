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
    photoshopService: PhotoshopServiceInterface,
  ) {
    this.photoshopService = photoshopService;
  }

  public async createLayer(type: string) {
    return await this.photoshopService.executeActions([
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

    let newBrightness = this._getNewValue(
      currentAdjustment.brightness,
      data.brightness,
      data.isRelative,
    );
    let newContrast = this._getNewValue(
      currentAdjustment.center,
      data.contrast,
      data.isRelative,
    );

    return await this.modifyAdjustmentLayer({
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

    let newExposure = this._getNewValue(
      currentAdjustment.exposure,
      data.exposure,
      data.isRelative,
    );
    let newOffset = this._getNewValue(
      currentAdjustment.offset,
      data.offset,
      data.isRelative,
    );
    let newGamma = this._getNewValue(
      currentAdjustment.gammaCorrection,
      data.gamma,
      data.isRelative,
    );

    return await this.modifyAdjustmentLayer({
      _obj: "exposure",
      presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
      exposure: newExposure,
      offset: newOffset,
      gammaCorrection: newGamma,
    });
  }

  public async modifyVibranceSaturation(data: {
    vibrance?: number;
    saturation?: number;
    isRelative: boolean;
  }) {
    const currentAdjustment = await this.getCurrentAdjustmentLayer();
    if (!currentAdjustment) return;

    let newVibrance = this._getNewValue(
      currentAdjustment.vibrance,
      data.vibrance,
      data.isRelative,
    );
    let newSaturation = this._getNewValue(
      currentAdjustment.saturation,
      data.saturation,
      data.isRelative,
    );
    return await this.modifyAdjustmentLayer({
      _obj: "vibrance",
      vibrance: newVibrance,
      saturation: newSaturation,
    });
  }

  public async modifyHueSaturationLightness(data: {
    hue?: number;
    saturation?: number;
    lightness?: number;
    isRelative: boolean;
  }) {
    const currentAdjustment = await this.getCurrentAdjustmentLayer();
    if (!currentAdjustment) return;

    let newHue = this._getNewValue(
      currentAdjustment.adjustment[0].hue,
      data.hue,
      data.isRelative,
    );
    let newSaturation = this._getNewValue(
      currentAdjustment.adjustment[0].saturation,
      data.saturation,
      data.isRelative,
    );
    let newLightness = this._getNewValue(
      currentAdjustment.adjustment[0].lightness,
      data.lightness,
      data.isRelative,
    );
    console.log({ currentAdjustment, data });

    return await this.modifyAdjustmentLayer({
      _obj: "hueSaturation",
      presetKind: { _enum: "presetKindType", _value: "presetKindCustom" },
      adjustment: [
        {
          _obj: "hueSatAdjustmentV2",
          hue: newHue,
          lightness: newLightness,
          saturation: newSaturation,
        },
      ],
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
    return await this.photoshopService.executeActions([
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

  private _getNewValue(
    originalValue: number | undefined,
    newValue: number | undefined,
    isRelative: boolean,
  ) {
    if (!isRelative) {
      return newValue ?? 0;
    }
    return (originalValue ?? 0) + (newValue ?? 0);
  }
}

export default AdjustmentLayer.instance;
