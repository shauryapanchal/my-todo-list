import {INotificationsParams} from "../../interfaces/INotificationsParams";
import {Alert, Snackbar} from "@mui/material";
import React from "react";

const Notifications = ({notifications, removeNotification}: INotificationsParams) => {
  return (<>
      {notifications &&
        notifications.map(notification =>
          <Snackbar key={notification.id} open={true} autoHideDuration={6000}
                    onClose={() => removeNotification(notification.id)}>
            <Alert onClose={() => removeNotification(notification.id)} severity={notification.severity}
                   sx={{width: '100%'}}>
              {notification.message}
            </Alert>
          </Snackbar>)
      }
    </>);
}

export default Notifications;