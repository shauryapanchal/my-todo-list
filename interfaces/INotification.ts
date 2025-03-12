import { AlertColor } from "@mui/material/Alert";

export interface INotification {
  id: string;
  message: string;
  severity: AlertColor;
}