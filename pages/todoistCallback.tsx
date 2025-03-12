import {useEffect} from "react";

export default function TodoistCallback() {
  useEffect(() => {
    window.addEventListener("message", (event: MessageEvent) => {
      if (event.data !== 'TODOIST_CALLBACK')
        return;

      event.source?.postMessage({type: event.data, url: window.location.href})
    })
  }, [])

  return (
    <p>
      Returning from Todoist...
    </p>
  )
}
