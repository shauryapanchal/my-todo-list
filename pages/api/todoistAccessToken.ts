import { NextApiRequest, NextApiResponse } from 'next';

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const authCode = req.query['code'];
  const clientId = process.env.NEXT_PUBLIC_TODOIST_ID;
  const clientSecret = process.env.TODOIST_SECRET;

  try {
    const result = await fetch(`https://todoist.com/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&code=${authCode}`, {
      method: 'POST'
    });
    const data = await result.json();
    res.status(200).json(data);
  } catch (e: any) {
    res.status(500);
  }
};
