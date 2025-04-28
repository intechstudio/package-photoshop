import {
  type ActionDescriptor,
  type BatchPlayCommandOptions,
} from "photoshop/dom/CoreModules";
import { photoshop } from "../globals";
import { psAppRef } from "./variables";

const executeAsModal = photoshop.core.executeAsModal;
const batchPlay = photoshop.app.batchPlay;

export const openUXPPanel = async (id: string) => {
  const uxp = require("uxp") as typeof import("uxp");
  const plugins = Array.from(uxp.pluginManager.plugins);

  const plugin = plugins.find(
    (plugin) => plugin.id === uxp.entrypoints._pluginInfo.id,
  );
  console.log("plugin", plugin, "opening panel: ", id);
  if (plugin) await plugin.showPanel(id);
  else console.error("No plugin found");
};

export async function batchPlayInModal(
  actionJSON: ActionDescriptor[],
  batchPlayOptions: BatchPlayCommandOptions = {},
) {
  return await executeAsModal(
    () => {
      return batchPlay(actionJSON, batchPlayOptions);
    },
    { commandName: "batchPlayInModal" },
  )
    .then((res) => {
      console.log({ res });
      return res;
    })
    .catch((err) => err);
}

export async function getPropety(propertyName: string, ref = psAppRef) {
  // example: panelList, menuBarInfo

  const actionJSON = [
    {
      _obj: "get",
      _target: [{ _property: propertyName }, ref],
    },
  ];

  const batchPlayOptions = {
    synchronousExecution: false,
  };

  const result = await batchPlayInModal(actionJSON, batchPlayOptions)
    .then((res) => {
      return res[0];
    })
    .catch((err) => {
      return err;
    });

  return result;
}
