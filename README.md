# Process Point

A GitHub Pages-based application for collaborative JSON configuration file management with optimistic locking and GitHub Actions integration.

## Features

- **GitHub Integration**: Seamlessly work with your GitHub repositories and files
- **Optimistic Locking**: Prevent conflicts with SHA-based locking mechanism
- **JSON Editor**: Monaco-based editor with syntax highlighting and validation
- **Version History**: Track changes and rollback to previous versions
- **Responsive Design**: GitHub-inspired dark theme with mobile support
- **Real-time Collaboration**: Multiple users can safely edit files with conflict resolution

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Editor**: Monaco Editor (VS Code editor)
- **Icons**: Lucide React
- **Authentication**: GitHub OAuth
- **API**: GitHub REST API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- GitHub account
- GitHub OAuth App (for authentication)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd process-point
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL to: `http://localhost:5173/callback`
   - Copy the Client ID and Client Secret to your `.env` file

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## Environment Variables

Create a `.env` file with the following variables:

```env
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
VITE_GITHUB_CLIENT_SECRET=your_github_client_secret_here
VITE_APP_NAME=Process Point
VITE_APP_URL=http://localhost:5173
```

## Deployment

### GitHub Pages

1. Build the application:
```bash
npm run build
```

2. Deploy to GitHub Pages:
```bash
npm run deploy
```

### Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

## Usage

1. **Authentication**: Sign in with your GitHub account
2. **Repository Selection**: Choose a repository from your GitHub account
3. **File Editing**: Select a JSON file to edit or create a new one
4. **Save Changes**: Make edits and save with a commit message
5. **History**: View file history and rollback to previous versions
6. **Settings**: Configure preferences and user settings

## Architecture

The application follows a client-side architecture:

- **Frontend**: React SPA with TypeScript
- **Authentication**: GitHub OAuth flow
- **Data Storage**: GitHub repositories (JSON files)
- **API Integration**: Direct GitHub REST API calls
- **State Management**: Zustand for global state
- **Optimistic Locking**: SHA-based conflict detection

## Key Components

- **LandingPage**: GitHub OAuth login and feature showcase
- **Dashboard**: Repository browser with search and filtering
- **FileEditor**: Monaco editor with JSON validation and preview
- **HistoryView**: Commit timeline with rollback functionality
- **Settings**: User preferences and configuration
- **Callback**: OAuth callback handler

## API Endpoints

The application integrates with GitHub REST API:

- `GET /user/repos` - List user repositories
- `GET /repos/{owner}/{repo}/contents/{path}` - Get file content
- `PUT /repos/{owner}/{repo}/contents/{path}` - Update file content
- `GET /repos/{owner}/{repo}/commits` - Get commit history

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.