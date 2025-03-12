import { NextApiRequest, NextApiResponse } from 'next';

export default (req: NextApiRequest, res: NextApiResponse) => {
  const code = req.query["code"];
  const state = req.query["state"];

  res.status(200).redirect(`/todoistCallback?code=${code}&state=${state}`)
};