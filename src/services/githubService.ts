import axios from 'axios'
import { Repository, FileItem, Commit } from '@/types'

const GITHUB_API_BASE = 'https://api.github.com'

class GitHubService {
  private getHeaders(token: string) {
    return {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }
  }

  async getUserRepos(token: string): Promise<Repository[]> {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/user/repos`, {
        headers: this.getHeaders(token),
        params: {
          sort: 'updated',
          per_page: 100
        }
      })
      
      return response.data.map((repo: any) => ({
        owner: repo.owner.login,
        name: repo.name,
        full_name: repo.full_name,
        private: repo.private,
        updated_at: repo.updated_at,
        default_branch: repo.default_branch
      }))
    } catch (error) {
      console.error('Error fetching user repositories:', error)
      throw error
    }
  }

  async getRepositoryContents(token: string, owner: string, repo: string, path: string = ''): Promise<FileItem[]> {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
        headers: this.getHeaders(token)
      })
      
      const contents = Array.isArray(response.data) ? response.data : [response.data]
      
      return contents.map((item: any) => ({
        path: item.path,
        name: item.name,
        type: item.type,
        size: item.size,
        sha: item.sha,
        content: item.content,
        encoding: item.encoding
      }))
    } catch (error) {
      console.error('Error fetching repository contents:', error)
      throw error
    }
  }

  async getFileContent(token: string, owner: string, repo: string, path: string): Promise<FileItem> {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, {
        headers: this.getHeaders(token)
      })
      
      return {
        path: response.data.path,
        name: response.data.name,
        type: response.data.type,
        size: response.data.size,
        sha: response.data.sha,
        content: response.data.content,
        encoding: response.data.encoding
      }
    } catch (error) {
      console.error('Error fetching file content:', error)
      throw error
    }
  }

  async updateFile(token: string, owner: string, repo: string, path: string, content: string, message: string, sha: string, branch: string = 'main'): Promise<any> {
    try {
      const encodedContent = btoa(content)
      
      const response = await axios.put(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
        {
          message,
          content: encodedContent,
          sha,
          branch
        },
        {
          headers: this.getHeaders(token)
        }
      )
      
      return response.data
    } catch (error) {
      console.error('Error updating file:', error)
      throw error
    }
  }

  async getFileCommits(token: string, owner: string, repo: string, path: string): Promise<Commit[]> {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits`, {
        headers: this.getHeaders(token),
        params: {
          path,
          per_page: 50
        }
      })
      
      return response.data.map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: {
          name: commit.commit.author.name,
          email: commit.commit.author.email,
          date: commit.commit.author.date
        },
        html_url: commit.html_url
      }))
    } catch (error) {
      console.error('Error fetching file commits:', error)
      throw error
    }
  }

  async getCommitDiff(token: string, owner: string, repo: string, sha: string): Promise<any> {
    try {
      const response = await axios.get(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${sha}`, {
        headers: this.getHeaders(token)
      })
      
      return response.data
    } catch (error) {
      console.error('Error fetching commit diff:', error)
      throw error
    }
  }
}

export const githubService = new GitHubService()