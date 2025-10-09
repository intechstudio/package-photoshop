import { ActionDescriptor } from "photoshop/dom/CoreModules";
import { psAppRef, refreshToolUi } from "../lib/variables";
import { PhotoshopServiceInterface } from "../photoshop-service-interface";

class Tools {
  private static _instance: Tools;
  private _photoshopService!: PhotoshopServiceInterface;

  private constructor() {}

  public static get instance() {
    if (!this._instance) this._instance = new Tools();
    return this._instance;
  }

  public async initTools(photoshopService: PhotoshopServiceInterface) {
    this._photoshopService = photoshopService;

    let result = (
      await photoshopService.executeActions([
        {
          _obj: "get",
          _target: [
            {
              _property: "tool",
            },
            {
              _ref: "application",
              _enum: "ordinal",
              _value: "targetEnum",
            },
          ],
          _options: {
            dialogOptions: "dontDisplay",
          },
        },
      ])
    )[0];
    if (result && result.tool?._enum) {
      this._currentTool = result.tool._enum;
      console.log("CURRENT TOOL", { result });
    }

    this._photoshopService.addActionNotificationListener(
      ["select"],
      (name: string, descriptor: any) => this._onToolSelected(name, descriptor),
    );
  }

  private _prevTool: string | undefined;
  private _currentTool: string | undefined;

  public async setPreviousTool() {
    console.log({ prev: this._prevTool, cur: this._currentTool });
    if (this._prevTool) {
      this.setTool(this._prevTool);
    }
  }

  public async setTool(toolId: string) {
    if (this._currentTool == toolId) return;
    this._prevTool = this._currentTool;
    this._currentTool = toolId;
    return await this._photoshopService.executeActions([
      {
        _obj: "select",
        _target: [
          {
            _ref: toolId,
          },
        ],
        _options: {
          dialogOptions: "dontDisplay",
        },
      },
      refreshToolUi,
    ]);
  }

  public async setToolParameters(
    toolId: string,
    toolValue: number,
    isRelative: boolean,
  ) {
    const currentToolProperties = await this._getCurrentToolProperties();
    let originalValue = 0;
    if (isRelative) {
      switch (toolId) {
        case "angle":
          originalValue =
            currentToolProperties?.currentToolOptions?.brush?.angle?._value;
          break;
        case "flow":
          originalValue = currentToolProperties?.currentToolOptions?.flow;
          break;
        case "hardness":
          originalValue =
            currentToolProperties?.currentToolOptions?.brush?.hardness?._value;
          break;
        /*case "mode":
                    originalValue = currentToolProperties.currentToolOptions.mode._value;
                    break;*/
        case "opacity":
          originalValue = currentToolProperties?.currentToolOptions?.opacity;
          break;
        case "pressure":
          originalValue = currentToolProperties?.currentToolOptions?.pressure;
          break;
        case "roundness":
          originalValue =
            currentToolProperties?.currentToolOptions?.brush?.roundness?._value;
          break;
        case "size":
          originalValue =
            currentToolProperties?.currentToolOptions?.brush?.diameter?._value;
          break;
        case "smoothing":
          originalValue = currentToolProperties?.currentToolOptions?.smooth;
          break;
        case "spacing":
          originalValue =
            currentToolProperties?.currentToolOptions?.brush?.spacing?._value;
          break;
        case "minimumRoundness":
          originalValue =
            currentToolProperties?.currentToolOptions?.minimumRoundness?._value;
        case "sizeJitter":
          originalValue =
            currentToolProperties?.currentToolOptions?.$szVr?.jitter?._value;
        case "scatter":
          originalValue =
            currentToolProperties?.currentToolOptions?.scatterDynamics?.jitter
              ?._value;
        case "textureBrightness":
          originalValue =
            currentToolProperties?.currentToolOptions?.textureBrightness;
        case "textureDepth":
          originalValue =
            currentToolProperties?.currentToolOptions?.textureDepth?._value;
        case "minimumDepth":
          originalValue =
            currentToolProperties?.currentToolOptions?.minimumDepth?._value;
        case "dualBrushSize":
          originalValue =
            currentToolProperties?.currentToolOptions?.dualBrush?.brush
              ?.diameter?._value;
        case "dualBrushSpacing":
          originalValue =
            currentToolProperties?.currentToolOptions?.dualBrush?.brush?.spacing
              ?._value;
        case "dualBrushScatter":
          originalValue =
            currentToolProperties?.currentToolOptions?.dualBrush
              ?.scatterDynamics?.jitter?._value;
        case "transferOpacityJitter":
          originalValue =
            currentToolProperties?.currentToolOptions?.$opVr?.jitter?._value;
        case "transferOpacityMinimum":
          originalValue =
            currentToolProperties?.currentToolOptions?.$opVr?.minimum?._value;
        case "transferFlowJitter":
          originalValue =
            currentToolProperties?.currentToolOptions?.$prVr?.jitter?._value;
        case "transferFlowMinimum":
          originalValue =
            currentToolProperties?.currentToolOptions?.$prVr?.minimum?._value;
      }
    }
    let brush = currentToolProperties.currentToolOptions.brush;
    console.log({ currentToolProperties });
    if (originalValue === undefined || originalValue === null) return;
    switch (toolId) {
      case "angle":
        let newAngle = originalValue + toolValue;
        brush.angle._value = newAngle;
        await this._setBrushOptions(brush);
        break;
      case "flow":
        let newFlow = this._getClampedValue(originalValue + toolValue, 0, 100);
        currentToolProperties.currentToolOptions.flow = newFlow;
        await this._setToolOptions({ flow: newFlow }, currentToolProperties);
        break;
      case "hardness":
        let newHardness = this._getClampedValue(
          originalValue + toolValue,
          0,
          100,
        );
        brush.hardness._value = newHardness;
        await this._setBrushOptions(brush);
        break;
      /*case "mode":
                originalValue = currentToolProperties.currentToolOptions.mode._value;
                break;*/
      case "opacity":
        let newOpacity = this._getClampedValue(
          originalValue + toolValue,
          0,
          100,
        );
        currentToolProperties.currentToolOptions.opacity = newOpacity;
        await this._setToolOptions(
          { opacity: newOpacity },
          currentToolProperties,
        );
        break;
      case "pressure":
        let newPressure = this._getClampedValue(
          originalValue + toolValue,
          0,
          100,
        );
        currentToolProperties.currentToolOptions.pressure = newPressure;
        await this._setToolOptions(
          { pressure: newPressure },
          currentToolProperties,
        );
        break;
      case "roundness":
        let newRoundness = this._getClampedValue(
          originalValue + toolValue,
          1,
          100,
        );
        brush.roundness._value = newRoundness;
        await this._setBrushOptions(brush);
        break;
      case "size":
        let newSize = this._getClampedValue(originalValue + toolValue, 1, 5000);
        brush.diameter._value = newSize;
        await this._setBrushOptions({
          masterDiameter: { _unit: "pixelsUnit", _value: newSize },
        });
        break;
      case "smoothing":
        let newSmooth = this._getClampedValue(
          originalValue + toolValue,
          0,
          100,
        );
        currentToolProperties.currentToolOptions.smooth = newSmooth;
        await this._setToolOptions(
          {
            smooth: newSmooth,
            smoothingValue: Math.round((newSmooth / 100) * 255),
          },
          currentToolProperties,
        );
        break;
      case "spacing":
        let newSpacing = this._getClampedValue(
          originalValue + toolValue,
          1,
          1000,
        );
        brush.spacing._value = newSpacing;
        await this._setBrushOptions(brush);
        break;
      case "minimumDiameter":
        let newMinimumDiameter = this._getClampedValue(
          originalValue + toolValue,
          0,
          100,
        );
        currentToolProperties.currentToolOptions.minimumDiameter =
          newMinimumDiameter;
        await this._setToolOptions(
          { minimumDiameter: newMinimumDiameter },
          currentToolProperties,
        );
        break;
      case "sizeJitter":
        let sizeJitter = this._getClampedValue(
          originalValue + toolValue,
          0,
          100,
        );
        let szVr = currentToolProperties.currentToolOptions.$szVr ?? {
          _obj: "$brVr",
          $bVTy: 2,
          $fStp: 25,
          minimum: {
            _unit: "percentUnit",
            _value: 0,
          },
        };
        szVr.jitter = {
          _unit: "percentUnit",
          _value: sizeJitter,
        };
        await this._setToolOptions({ $szVr: szVr }, currentToolProperties);
        break;
      case "scatter":
        let scatter = this._getClampedValue(originalValue + toolValue, 0, 1000);
        let scatterDynamics = currentToolProperties.currentToolOptions
          .scatterDynamics ?? {
          _obj: "$brVr",
          $bVTy: 0,
          $fStp: 25,
          minimum: {
            _unit: "percentUnit",
            _value: 0,
          },
        };
        scatterDynamics.jitter = {
          _unit: "percentUnit",
          _value: scatter,
        };
        await this._setToolOptions(
          { scatterDynamics: scatterDynamics },
          currentToolProperties,
        );
        break;
      case "textureBrightness":
        let newTextureBrightness = this._getClampedValue(
          originalValue + toolValue,
          -150,
          150,
        );
        currentToolProperties.currentToolOptions.textureBrightness =
          newTextureBrightness;
        await this._setToolOptions(
          { textureBrightness: newTextureBrightness },
          currentToolProperties,
        );
        break;
      case "textureDepth":
        let newTextureDepth = this._getClampedValue(
          originalValue + toolValue,
          0,
          100,
        );
        currentToolProperties.currentToolOptions.textureDepth = {
          _unit: "percentUnit",
          _value: newTextureDepth,
        };
        await this._setToolOptions(
          {
            textureDepth: currentToolProperties.currentToolOptions.textureDepth,
          },
          currentToolProperties,
        );
        break;
      case "minimumDepth":
        let newMinimumDepth = this._getClampedValue(
          originalValue + toolValue,
          0,
          100,
        );
        currentToolProperties.currentToolOptions.minimumDepth = {
          _unit: "percentUnit",
          _value: newMinimumDepth,
        };
        await this._setToolOptions(
          {
            minimumDepth: currentToolProperties.currentToolOptions.minimumDepth,
          },
          currentToolProperties,
        );
        break;
      case "dualBrushSize":
        let newDualBrushSize = this._getClampedValue(
          originalValue + toolValue,
          1,
          5000,
        );
        if (
          currentToolProperties.currentToolOptions.dualBrush?.brush?.diameter
            ?._value === undefined
        ) {
          return;
        }
        currentToolProperties.currentToolOptions.dualBrush.brush.diameter._value =
          newDualBrushSize;
        await this._setToolOptions(
          { dualBrush: currentToolProperties.currentToolOptions.dualBrush },
          currentToolProperties,
        );
        break;
      case "dualBrushSpacing":
        let newDualBrushSpacing = this._getClampedValue(
          originalValue + toolValue,
          1,
          1000,
        );
        if (
          currentToolProperties.currentToolOptions.dualBrush?.brush?.spacing
            ?._value === undefined
        ) {
          return;
        }
        currentToolProperties.currentToolOptions.dualBrush.brush.spacing._value =
          newDualBrushSpacing;
        await this._setToolOptions(
          { dualBrush: currentToolProperties.currentToolOptions.dualBrush },
          currentToolProperties,
        );
        break;
      case "dualBrushScatter":
        let newDualBrushScatter = this._getClampedValue(
          originalValue + toolValue,
          0,
          1000,
        );
        if (
          currentToolProperties.currentToolOptions.dualBrush?.scatterDynamics
            ?.jitter?._value === undefined
        ) {
          return;
        }
        currentToolProperties.currentToolOptions.dualBrush.scatterDynamics.jitter._value =
          newDualBrushScatter;
        await this._setToolOptions(
          { dualBrush: currentToolProperties.currentToolOptions.dualBrush },
          currentToolProperties,
        );
        break;
      case "transferOpacityJitter":
        let newTransferOpacityJitter = this._getClampedValue(
          originalValue + toolValue,
          0,
          100,
        );
        if (
          currentToolProperties?.currentToolOptions?.$opVr?.jitter?._value ===
          undefined
        ) {
          return;
        }
        currentToolProperties.currentToolOptions.$opVr.jitter._value =
          newTransferOpacityJitter;
        await this._setToolOptions(
          { $opVr: currentToolProperties.currentToolOptions.$opVr },
          currentToolProperties,
        );
        break;
      case "transferOpacityMinimum":
        let newTransferOpacityMinimum = this._getClampedValue(
          originalValue + toolValue,
          0,
          100,
        );
        if (
          currentToolProperties?.currentToolOptions?.$opVr?.minimum?._value ===
          undefined
        ) {
          return;
        }
        currentToolProperties.currentToolOptions.$opVr.minimum._value =
          newTransferOpacityMinimum;
        await this._setToolOptions(
          { $opVr: currentToolProperties.currentToolOptions.$opVr },
          currentToolProperties,
        );
        break;
      case "transferFlowJitter":
        let newTransferFlowJitter = this._getClampedValue(
          originalValue + toolValue,
          0,
          100,
        );
        if (
          currentToolProperties?.currentToolOptions?.$prVr?.jitter?._value ===
          undefined
        ) {
          return;
        }
        currentToolProperties.currentToolOptions.$prVr.jitter._value =
          newTransferFlowJitter;
        await this._setToolOptions(
          { $prVr: currentToolProperties.currentToolOptions.$prVr },
          currentToolProperties,
        );
        break;
      case "transferFlowMinimum":
        let newTransferFlowMinimum = this._getClampedValue(
          originalValue + toolValue,
          0,
          100,
        );
        if (
          currentToolProperties?.currentToolOptions?.$prVr?.minimum?._value ===
          undefined
        ) {
          return;
        }
        currentToolProperties.currentToolOptions.$prVr.minimum._value =
          newTransferFlowMinimum;
        await this._setToolOptions(
          { $prVr: currentToolProperties.currentToolOptions.$prVr },
          currentToolProperties,
        );
        break;
    }
  }

  private _onToolSelected(name: string, descriptor: any) {
    let toolRef = descriptor._target[0]._ref;
    if (toolRef && toolRef.includes("Tool")) {
      if (this._currentTool == toolRef) return;
      this._prevTool = this._currentTool;
      this._currentTool = toolRef;
    }
  }

  private lastToolPropertyCache: Date | undefined = undefined;
  private lastToolPropertyCacheDate: any = undefined;
  private toolPropertyRequest: Promise<any> | undefined;
  private async _getCurrentToolProperties() {
    if (
      this.lastToolPropertyCacheDate &&
      new Date().getTime() - this.lastToolPropertyCacheDate.getTime() < 500
    ) {
      this.lastToolPropertyCacheDate = new Date();
      return this.lastToolPropertyCache;
    }
    if (!this.toolPropertyRequest) {
      this.toolPropertyRequest = new Promise(async (resolve) => {
        let result = await this._photoshopService.executeActions([
          {
            _obj: "get",
            _target: {
              _ref: [
                { _property: "currentToolOptions" },
                { _ref: "application", _enum: "ordinal", _value: "targetEnum" },
              ],
            },
          },
        ]);
        this.lastToolPropertyCache = result[0];
        this.lastToolPropertyCacheDate = new Date();

        resolve(result[0]);
      });
      let result = await this.toolPropertyRequest;
      this.toolPropertyRequest = undefined;
      return result;
    } else {
      return await this.toolPropertyRequest;
    }
  }

  private _getClampedValue(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  private _getToolOptionsToDescriptor(currentToolOptions: {
    [x: string]: any;
  }): Object {
    const to: any = {};
    Object.keys(currentToolOptions).forEach((key) => {
      const keyValue = currentToolOptions[key];
      const keyValueType = typeof keyValue;
      if (keyValueType != "function") to[key] = keyValue;
    });

    return to;
  }

  private latestToolOptions: any = undefined;
  private isSendingToolOptions = false;
  private mustSendNewToolOptions = false;
  private async _setToolOptions(
    to: any,
    currentToolProperties: ActionDescriptor,
  ) {
    to["_obj"] = "null";
    to = Object.assign(
      this._getToolOptionsToDescriptor(
        currentToolProperties.currentToolOptions,
      ),
      to,
    );
    this.latestToolOptions = to;
    this.mustSendNewToolOptions = true;
    if (!this.isSendingToolOptions) {
      this.isSendingToolOptions = true;
      while (this.mustSendNewToolOptions) {
        const desc = {
          _obj: "set",
          _target: { _ref: currentToolProperties.tool._enum },
          to: this.latestToolOptions,
          _options: { dialogOptions: "silent" },
        };
        this.mustSendNewToolOptions = false;
        await this._photoshopService.executeActions([desc, refreshToolUi]);
      }
      this.isSendingToolOptions = false;
    }
  }

  private latestBrushOption: any = undefined;
  private isSendingBrush: boolean = false;
  private mustSendNewBrush: boolean = false;
  private async _setBrushOptions(to: any) {
    to["_obj"] = "brush";
    this.latestBrushOption = to;
    this.mustSendNewBrush = true;
    if (!this.isSendingBrush) {
      this.isSendingBrush = true;
      while (this.mustSendNewBrush) {
        const desc = {
          _obj: "set",
          _target: { _ref: "brush", _enum: "ordinal", _value: "targetEnum" },
          to: this.latestBrushOption,
          _options: { dialogOptions: "silent" },
        };
        this.mustSendNewBrush = false;
        await this._photoshopService.executeActions([desc, refreshToolUi]);
      }
      this.isSendingBrush = false;
    }
  }
}

export default Tools.instance;
