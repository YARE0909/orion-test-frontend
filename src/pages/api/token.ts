import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { identity, room } = req.query as { identity: string; room: string };
  // Proxy to your backend token service
  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_TOKEN_API}?identity=${identity}&room=${room}`
  );
  const { token } = await resp.json();
  res.status(200).json({ token });
}
