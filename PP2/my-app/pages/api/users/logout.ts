import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method === "POST") {
    // Clear JWT token stored in cookies
    res.setHeader(
      "Set-Cookie",
      "token=; Max-Age=0; path=/; HttpOnly; Secure; SameSite=Strict"
    );

    // Optionally, add logic to clear the token from a database if you're managing sessions (not necessary for stateless JWTs)
    return res.status(200).json({ message: "Logged out successfully" });
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
