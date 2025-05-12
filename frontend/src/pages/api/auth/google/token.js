// This file would be used in a real implementation to exchange the authorization code for tokens
// For the demo, we're simulating the OAuth flow in the frontend

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { code } = req.body

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" })
  }

  try {
    // Exchange the code for tokens
    // In a real implementation, you would use the Google OAuth API
    // to exchange the code for tokens

    // Mock response for demo purposes
    const tokens = {
      access_token: "mock_access_token",
      id_token: "mock_id_token",
      refresh_token: "mock_refresh_token",
      expires_in: 3600,
    }

    res.status(200).json(tokens)
  } catch (error) {
    console.error("Token exchange error:", error)
    res.status(500).json({ error: "Failed to exchange code for tokens" })
  }
}
