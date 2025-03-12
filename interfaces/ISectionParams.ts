import {AlertColor} from "@mui/material/Alert";
import {IGenericTaskGroup} from "./IGenericTaskModels";

export interface ISectionParams {
  addNotification: (message: string, severity: AlertColor) => void,
  setIsReady: (state: boolean) => void,
  setSelectedGroup: (group: IGenericTaskGroup) => void,
  parentRef: React.MutableRefObject<ISync | undefined>,
}

export interface ISyncResponse {
  processed: number,
  failed: number
}

export interface ISync {
  sync: (newData: IGenericTaskGroup, current: IGenericTaskGroup) => Promise<ISyncResponse>;
}