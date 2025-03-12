import {useState} from "react";
import {AlertColor} from "@mui/material/Alert";
import {INotification} from "../interfaces/INotification";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<INotification[]>([]);

  const addNotification = (message: string, severity: AlertColor) => {
    const id = crypto.randomUUID();
    setNotifications([
      ...notifications,
      {
        id: id,
        message: message,
        severity: severity,
      }
    ])
  }

  const removeNotification = (id: string) => {
    setNotifications(notifications.filter(log => log.id !== id))
  }

  return {
    notifications,
    addNotification,
    removeNotification
  }
}