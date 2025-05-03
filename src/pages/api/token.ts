// pages/api/token.ts
import type { NextApiRequest, NextApiResponse } from 'next';

type TokenResponse = {
  token: string;
  wsUrl: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TokenResponse>
) {
  const { identity, room } = req.query as { identity: string; room: string };

  const resp = await fetch(
    `${process.env.NEXT_PUBLIC_TOKEN_API}?identity=${identity}&room=${room}`
  );
  if (!resp.ok) {
    return res.status(resp.status).json({ token: '', wsUrl: '' });
  }
  const { token, wsUrl } = await resp.json();
  res.status(200).json({ token, wsUrl });
}
