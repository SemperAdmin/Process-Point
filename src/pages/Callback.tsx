import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { exchangeCodeForToken, getUserFromToken } from '@/utils/githubAuth'

export default function Callback() {
  const navigate = useNavigate()
  const { login } = useAuthStore()

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')
      const error = urlParams.get('error')

      if (error) {
        console.error('GitHub OAuth error:', error)
        navigate('/')
        return
      }

      if (!code) {
        console.error('No authorization code received')
        navigate('/')
        return
      }

      try {
        // Exchange code for token
        const token = await exchangeCodeForToken(code)
        
        // Get user info from token
        const user = await getUserFromToken(token)
        
        // Store user info
        login(user)
        
        // Redirect to dashboard
        navigate('/dashboard')
      } catch (error) {
        console.error('Error during OAuth callback:', error)
        navigate('/')
      }
    }

    handleCallback()
  }, [login, navigate])

  return (
    <div className="min-h-screen bg-github-dark flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-github-blue rounded-xl mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
        <h2 className="text-2xl font-semibold text-white mb-2">Completing GitHub Login...</h2>
        <p className="text-gray-400">Please wait while we authenticate your account.</p>
      </div>
    </div>
  )
}