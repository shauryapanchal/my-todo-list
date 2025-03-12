import {NextApiRequest, NextApiResponse} from "next";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    const taskListId = req.query["taskListId"];
    const accessToken = req.query["accessToken"];
    const title = req.query['title'];
    const status = req.query['status'];
    // const due = req.query['due'];
    const notes = req.query['notes'];

    // Set up the request to the Google Tasks API
    const apiUrl = `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };

    const body = JSON.stringify({
      title: title,
      status: status,
      // due: due, // TODO: Reported as invalid param
      notes: notes
    });

    // Make the request to the Google Tasks API
    const response = await fetch(apiUrl, { headers: headers, body: body, method: "POST" });
    const task = await response.json();

    // Return the list of tasks in the response
    res.status(200).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error });
  }
}
