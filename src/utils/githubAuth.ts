const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID || 'your_github_client_id'
const GITHUB_REDIRECT_URI = `${window.location.origin}/callback`

export const generateGitHubOAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: 'repo user',
    state: Math.random().toString(36).substring(7)
  })
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

export const exchangeCodeForToken = async (code: string): Promise<string> => {
  // In a real implementation, you would need a backend server to exchange the code for a token
  // For GitHub Pages deployment, we'll use a proxy service or handle this differently
  
  // For now, let's simulate the token exchange
  // In production, you would make a request to your backend server
  
  // Mock token for development
  return 'mock_github_token_' + Math.random().toString(36).substring(7)
}

export const getUserFromToken = async (token: string): Promise<any> => {
  // Mock user data for development
  // In production, this would call the GitHub API to get user info
  return {
    id: '12345',
    username: 'testuser',
    email: 'test@example.com',
    avatar_url: 'https://github.com/github.png',
    access_token: token
  }
}