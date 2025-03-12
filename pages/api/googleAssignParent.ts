import {NextApiRequest, NextApiResponse} from "next";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    const taskListId = req.query["taskListId"];
    const accessToken = req.query["accessToken"];
    const parent = req.query['parent'];
    const child = req.query['child'];

    // Set up the request to the Google Tasks API
    const apiUrl = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${child}/move?parent=${parent}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };

    // Make the request to the Google Tasks API
    const response = await fetch(apiUrl, { headers: headers, method: "POST" });
    const task = await response.json();

    // Return the list of tasks in the response
    res.status(200).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error });
  }
}
