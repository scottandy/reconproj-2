import React, { useState, useEffect } from 'react';
import { Github, GitBranch, GitCommit, RefreshCw, Check, AlertCircle, Lock, ExternalLink, Copy, Trash2, Upload, FileCode, FolderOpen } from 'lucide-react';

interface GitHubCredentials {
  username: string;
  token: string;
  repository: string;
}

interface CommitFile {
  path: string;
  content: string;
  action: 'add' | 'update' | 'delete';
}

interface RepoFile {
  path: string;
  type: 'file' | 'directory';
  size?: number;
}

const GitHubIntegration: React.FC = () => {
  const [credentials, setCredentials] = useState<GitHubCredentials>({
    username: 'scottandy',
    token: '',
    repository: 'scottandy/reconpro'
  });
  const [showCredentials, setShowCredentials] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [branch, setBranch] = useState('main');
  const [savedCredentials, setSavedCredentials] = useState<GitHubCredentials | null>(null);
  const [repoFiles, setRepoFiles] = useState<RepoFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [currentDirectory, setCurrentDirectory] = useState('');
  const [lastApiError, setLastApiError] = useState<string | null>(null);

  // Load saved credentials on component mount
  useEffect(() => {
    const saved = localStorage.getItem('github_credentials');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedCredentials(parsed);
        setCredentials(parsed);
        
        // Load repository files
        if (parsed.username && parsed.token && parsed.repository) {
          loadRepositoryFiles(parsed);
        }
      } catch (error) {
        console.error('Failed to parse saved GitHub credentials:', error);
      }
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const saveCredentials = () => {
    if (!credentials.username || !credentials.token || !credentials.repository) {
      setStatus('error');
      setMessage('Please fill in all fields');
      return;
    }

    localStorage.setItem('github_credentials', JSON.stringify(credentials));
    setSavedCredentials(credentials);
    setStatus('success');
    setMessage('Credentials saved successfully');
    setShowCredentials(false);
    
    // Load repository files with new credentials
    loadRepositoryFiles(credentials);
  };

  const loadRepositoryFiles = async (creds: GitHubCredentials) => {
    setIsLoadingFiles(true);
    setLastApiError(null);
    
    try {
      // Fetch files from the GitHub API
      const response = await fetch(`https://api.github.com/repos/${creds.repository}/contents`, {
        headers: {
          'Authorization': `token ${creds.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = `GitHub API error: ${response.status} - ${errorData.message || response.statusText}`;
        setLastApiError(errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      
      // Convert GitHub API response to our RepoFile format
      const files: RepoFile[] = data.map((item: any) => ({
        path: item.path,
        type: item.type === 'dir' ? 'directory' : 'file',
        size: item.size
      }));
      
      setRepoFiles(files);
      setIsLoadingFiles(false);
      setCurrentDirectory('');
    } catch (error) {
      console.error('Failed to load repository files:', error);
      setIsLoadingFiles(false);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to load repository files');
    }
  };

  const navigateDirectory = async (directory: string) => {
    if (!savedCredentials) return;
    
    setIsLoadingFiles(true);
    setCurrentDirectory(directory);
    
    try {
      // Fetch files from the GitHub API for the specific directory
      const response = await fetch(`https://api.github.com/repos/${savedCredentials.repository}/contents/${directory}`, {
        headers: {
          'Authorization': `token ${savedCredentials.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Convert GitHub API response to our RepoFile format
      const files: RepoFile[] = data.map((item: any) => ({
        path: item.path,
        type: item.type === 'dir' ? 'directory' : 'file',
        size: item.size
      }));
      
      setRepoFiles(files);
      setIsLoadingFiles(false);
    } catch (error) {
      console.error('Failed to load directory files:', error);
      setIsLoadingFiles(false);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to load directory files');
    }
  };

  const goBack = () => {
    if (!currentDirectory) return;
    
    const parts = currentDirectory.split('/');
    if (parts.length <= 1) {
      setCurrentDirectory('');
      loadRepositoryFiles(savedCredentials!);
    } else {
      parts.pop();
      navigateDirectory(parts.join('/'));
    }
  };

  const commitChanges = async () => {
    if (!savedCredentials) {
      setStatus('error');
      setMessage('Please save your GitHub credentials first');
      return;
    }

    if (!commitMessage) {
      setStatus('error');
      setMessage('Please enter a commit message');
      return;
    }

    setStatus('loading');
    setMessage('Committing changes...');
    setLastApiError(null);

    try {
      // Get the current commit SHA for the branch
      const branchResponse = await fetch(`https://api.github.com/repos/${savedCredentials.repository}/branches/${branch}`, {
        headers: {
          'Authorization': `token ${savedCredentials.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!branchResponse.ok) {
        const errorData = await branchResponse.json().catch(() => ({}));
        const errorMessage = `GitHub API error: ${branchResponse.status} - ${errorData.message || branchResponse.statusText}`;
        setLastApiError(errorMessage);
        throw new Error(errorMessage);
      }
      
      const branchData = await branchResponse.json();
      const currentCommitSha = branchData.commit.sha;
      
      // Get the current tree
      const treeResponse = await fetch(`https://api.github.com/repos/${savedCredentials.repository}/git/trees/${currentCommitSha}`, {
        headers: {
          'Authorization': `token ${savedCredentials.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!treeResponse.ok) {
        const errorData = await treeResponse.json().catch(() => ({}));
        const errorMessage = `GitHub API error: ${treeResponse.status} - ${errorData.message || treeResponse.statusText}`;
        setLastApiError(errorMessage);
        throw new Error(errorMessage);
      }
      
      // For this demo, we'll just create a commit with a simple change to README.md
      // In a real implementation, you would gather all changed files
      
      // Create a new blob for the README.md file
      const blobResponse = await fetch(`https://api.github.com/repos/${savedCredentials.repository}/git/blobs`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${savedCredentials.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `# ReconPro\n\nDealership Reconditioning Manager\n\nUpdated: ${new Date().toISOString()}\n`,
          encoding: 'utf-8'
        })
      });
      
      if (!blobResponse.ok) {
        const errorData = await blobResponse.json().catch(() => ({}));
        const errorMessage = `GitHub API error: ${blobResponse.status} - ${errorData.message || blobResponse.statusText}`;
        setLastApiError(errorMessage);
        throw new Error(errorMessage);
      }
      
      const blobData = await blobResponse.json();
      
      // Create a new tree
      const newTreeResponse = await fetch(`https://api.github.com/repos/${savedCredentials.repository}/git/trees`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${savedCredentials.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          base_tree: branchData.commit.commit.tree.sha,
          tree: [
            {
              path: 'README.md',
              mode: '100644',
              type: 'blob',
              sha: blobData.sha
            }
          ]
        })
      });
      
      if (!newTreeResponse.ok) {
        const errorData = await newTreeResponse.json().catch(() => ({}));
        const errorMessage = `GitHub API error: ${newTreeResponse.status} - ${errorData.message || newTreeResponse.statusText}`;
        setLastApiError(errorMessage);
        throw new Error(errorMessage);
      }
      
      const newTreeData = await newTreeResponse.json();
      
      // Create a new commit
      const commitResponse = await fetch(`https://api.github.com/repos/${savedCredentials.repository}/git/commits`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${savedCredentials.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: commitMessage,
          tree: newTreeData.sha,
          parents: [currentCommitSha]
        })
      });
      
      if (!commitResponse.ok) {
        const errorData = await commitResponse.json().catch(() => ({}));
        const errorMessage = `GitHub API error: ${commitResponse.status} - ${errorData.message || commitResponse.statusText}`;
        setLastApiError(errorMessage);
        throw new Error(errorMessage);
      }
      
      const commitData = await commitResponse.json();
      
      // Update the reference
      const refResponse = await fetch(`https://api.github.com/repos/${savedCredentials.repository}/git/refs/heads/${branch}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${savedCredentials.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sha: commitData.sha,
          force: false
        })
      });
      
      if (!refResponse.ok) {
        const errorData = await refResponse.json().catch(() => ({}));
        const errorMessage = `GitHub API error: ${refResponse.status} - ${errorData.message || refResponse.statusText}`;
        setLastApiError(errorMessage);
        throw new Error(errorMessage);
      }
      
      setStatus('success');
      setMessage('Changes committed successfully to GitHub. Netlify will automatically deploy the updates.');
      setCommitMessage('');
      
      // Refresh the file list
      setTimeout(() => {
        loadRepositoryFiles(savedCredentials);
      }, 1000);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to commit changes');
    }
  };

  const clearCredentials = () => {
    if (window.confirm('Are you sure you want to clear your GitHub credentials?')) {
      localStorage.removeItem('github_credentials');
      setSavedCredentials(null);
      setCredentials({ username: 'scottandy', token: '', repository: 'scottandy/reconpro' });
      setStatus('idle');
      setMessage('');
      setRepoFiles([]);
      setCurrentDirectory('');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setStatus('success');
    setMessage('Copied to clipboard');
    setTimeout(() => {
      if (status === 'success' && message === 'Copied to clipboard') {
        setStatus('idle');
        setMessage('');
      }
    }, 2000);
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Github className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">GitHub Integration</h3>
          <p className="text-gray-600 dark:text-gray-400">Commit and push changes to your GitHub repository</p>
        </div>
      </div>

      {/* Status Message */}
      {status !== 'idle' && (
        <div className={`mb-6 p-4 rounded-lg ${
          status === 'loading' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' :
          status === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' :
          'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700'
        }`}>
          <div className="flex items-center gap-2">
            {status === 'loading' && <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />}
            {status === 'success' && <Check className="w-5 h-5 text-green-600 dark:text-green-400" />}
            {status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />}
            <span className={`text-sm font-medium ${
              status === 'loading' ? 'text-blue-700 dark:text-blue-300' :
              status === 'success' ? 'text-green-700 dark:text-green-300' :
              'text-red-700 dark:text-red-300'
            }`}>
              {message}
            </span>
          </div>
        </div>
      )}

      {/* API Error Details */}
      {lastApiError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-lg">
          <h4 className="font-medium text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            GitHub API Error Details
          </h4>
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded font-mono text-xs text-red-700 dark:text-red-300 overflow-x-auto">
            {lastApiError}
          </div>
          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            If you're seeing a 403 error, your token may have expired or doesn't have the required permissions.
            Please generate a new token with the 'repo' scope.
          </p>
        </div>
      )}

      {/* GitHub Credentials */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">GitHub Credentials</h4>
          <button
            onClick={() => setShowCredentials(!showCredentials)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            {showCredentials ? 'Hide' : 'Show'}
          </button>
        </div>

        {showCredentials ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GitHub Username
              </label>
              <input
                type="text"
                name="username"
                value={credentials.username}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="your-github-username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Personal Access Token
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="token"
                  value={credentials.token}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                />
                <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 space-y-1">
                <p>
                  Create a token with 'repo' scope at{' '}
                  <a 
                    href="https://github.com/settings/tokens" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    github.com/settings/tokens
                  </a>
                </p>
                <p className="text-red-600 dark:text-red-400">
                  Note: Your previous token may have expired or been revoked. GitHub tokens have expiration dates.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Repository Name
              </label>
              <input
                type="text"
                name="repository"
                value={credentials.repository}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="username/repository"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={saveCredentials}
                className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save Credentials
              </button>
              <button
                onClick={() => setShowCredentials(false)}
                className="flex-1 py-2 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            {savedCredentials ? (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Connected to: {savedCredentials.repository}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      User: {savedCredentials.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Token: {savedCredentials.token.substring(0, 4)}•••••••••••••••
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCredentials(true)}
                      className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit credentials"
                    >
                      <GitBranch className="w-4 h-4" />
                    </button>
                    <button
                      onClick={clearCredentials}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Clear credentials"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No GitHub credentials saved. Click "Show" to add your credentials.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Repository Files */}
      {savedCredentials && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Repository Files</h4>
            <div className="flex items-center gap-2">
              {currentDirectory && (
                <button
                  onClick={goBack}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  Go Back
                </button>
              )}
              <button
                onClick={() => currentDirectory ? navigateDirectory(currentDirectory) : loadRepositoryFiles(savedCredentials)}
                disabled={isLoadingFiles}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1"
              >
                {isLoadingFiles ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>

          {currentDirectory && (
            <div className="mb-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 font-mono">
              {currentDirectory}
            </div>
          )}

          {repoFiles.length > 0 ? (
            <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {repoFiles.map((file, index) => (
                  <li key={index} className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {file.type === 'directory' ? (
                          <FolderOpen className="w-4 h-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                        ) : (
                          <FileCode className="w-4 h-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                        )}
                        <span 
                          className={`text-sm font-mono truncate ${
                            file.type === 'directory' 
                              ? 'text-yellow-700 dark:text-yellow-300 cursor-pointer hover:underline' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                          onClick={() => file.type === 'directory' ? navigateDirectory(file.path) : null}
                        >
                          {file.path.split('/').pop()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.type === 'file' && file.size !== undefined && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                          </span>
                        )}
                        <button
                          onClick={() => copyToClipboard(file.path)}
                          className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded transition-colors"
                          title="Copy path"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isLoadingFiles ? 'Loading repository files...' : 'No files loaded. Click "Refresh" to load files.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Commit Changes */}
      {savedCredentials && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Commit Changes</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Branch
            </label>
            <div className="flex items-center">
              <div className="relative flex-1">
                <GitBranch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="main"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Commit Message
            </label>
            <div className="relative">
              <GitCommit className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Update application files"
              />
            </div>
          </div>
          
          <button
            onClick={commitChanges}
            disabled={status === 'loading' || !commitMessage}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Committing...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Commit & Push Changes
              </>
            )}
          </button>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Changes will be committed to the <span className="font-mono">{branch}</span> branch
          </p>
        </div>
      )}

      {/* GitHub Token Troubleshooting */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
        <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          GitHub Token Troubleshooting
        </h4>
        <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
          <p>
            If you're seeing a <strong>403 Forbidden</strong> error, your token may have:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Expired (GitHub tokens can have expiration dates)</li>
            <li>Been revoked or deleted from GitHub</li>
            <li>Insufficient permissions (needs 'repo' scope)</li>
            <li>Rate limit exceeded</li>
          </ul>
          <p className="font-medium">
            Solution: Generate a new token with the 'repo' scope at{' '}
            <a 
              href="https://github.com/settings/tokens" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              github.com/settings/tokens
            </a>
          </p>
        </div>
      </div>

      {/* GitHub Info */}
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">About GitHub Integration</h4>
        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
          <p>
            This feature allows you to commit and push changes directly to your GitHub repository.
          </p>
          <p>
            When connected to Netlify, your site will automatically redeploy when changes are pushed to GitHub.
          </p>
          <p>
            For security reasons, your GitHub credentials are stored locally in your browser and are never sent to our servers.
          </p>
        </div>
      </div>
      
      {/* Netlify GitHub Integration Info */}
      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
        <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">Netlify + GitHub</h4>
        <div className="text-sm text-green-700 dark:text-green-300 space-y-2">
          <p>
            To enable automatic deployments when you push to GitHub:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Go to your Netlify site dashboard</li>
            <li>Navigate to Site settings → Build & deploy → Continuous Deployment</li>
            <li>Connect to your GitHub repository</li>
            <li>Configure build settings (if needed)</li>
          </ol>
          <p className="mt-2">
            <a 
              href="https://docs.netlify.com/site-deploys/create-deploys/#deploy-with-git" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-green-700 dark:text-green-300 hover:underline"
            >
              Learn more about Netlify GitHub integration
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GitHubIntegration;