import {INotification} from "./INotification";

export interface INotificationsParams {
  notifications: INotification[],
  removeNotification: (id: string) => void
}
