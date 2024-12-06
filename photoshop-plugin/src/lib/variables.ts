export const EditorWebsocketUrl = "ws://localhost:3542";
export const psAppRef = {
  _ref: "application",
  _enum: "ordinal",
  _value: "targetEnum",
};
export const psDocRef = {
  _ref: "document",
  _enum: "ordinal",
  _value: "targetEnum",
};
export const refreshToolUi = {
  _obj: "updateCurrentToolCursor",
  _target: psAppRef,
};
export const contentAwareFill = {
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
};
export const switchColors = {
  _obj: "exchange",
  _target: [
    {
      _property: "colors",
      _ref: "color",
    },
  ],
};
export const mergeVisibleDuplicate = {
  _obj: "mergeVisible",
  duplicate: true,
};

export const createLayerMask = {
  _obj: "make",
  at: {
    _enum: "channel",
    _ref: "channel",
    _value: "mask",
  },
  new: {
    _class: "channel",
  },
  using: {
    _enum: "userMaskEnabled",
    _value: "revealAll",
  },
};
