import { ActionDescriptor } from "photoshop/dom/CoreModules";

export interface PhotoshopServiceInterface {
  executeActions(params: ActionDescriptor[]): Promise<any>;
  performMenuCommand(commandID: number): Promise<any>;
  addActionNotificationListener(events: string[], handler: any): Promise<any>;
}
