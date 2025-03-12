import {NextApiRequest, NextApiResponse} from "next";

export default async function (req: NextApiRequest, res: NextApiResponse) {
  try {
    const taskListId = req.query["taskListId"];
    const accessToken = req.query["accessToken"];

    // Set up the request to the Google Tasks API
    const apiUrl = `https://www.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=true&showHidden=true`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    };

    // Make the request to the Google Tasks API
    const response = await fetch(apiUrl, { headers });
    const tasks = await response.json();

    // Set the appropriate CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Return the list of tasks in the response
    res.status(200).json(tasks);
  } catch (error: any) {
    // Set the appropriate CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(500).json({ error: error });
  }
}