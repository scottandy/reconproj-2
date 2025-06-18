import React, { useState, useEffect } from 'react';
import { getDeploymentStatus, deployProject } from '../utils/deploymentUtils';
import { Rocket, CheckCircle2, AlertCircle, RefreshCw, Clock, Link, ExternalLink, Copy } from 'lucide-react';
import DeploymentButton from './DeploymentButton';

interface DeploymentStatus {
  status: 'success' | 'error' | 'pending';
  deploy_url?: string;
  error_message?: string;
  deploy_id?: string;
  claimed?: boolean;
  claim_url?: string;
}

const DeploymentPanel: React.FC = () => {
  const [status, setStatus] = useState<{
    isLoading: boolean;
    isDeployed: boolean;
    deployUrl: string | null;
    claimUrl: string | null;
    message: string;
    lastChecked: string;
    deploymentStatus: DeploymentStatus | null;
  }>({
    isLoading: true,
    isDeployed: false,
    deployUrl: null,
    claimUrl: null,
    message: 'Checking deployment status...',
    lastChecked: new Date().toISOString(),
    deploymentStatus: null
  });

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      const deploymentStatus = await getDeploymentStatus();
      
      setStatus({
        isLoading: false,
        isDeployed: deploymentStatus.status === 'success',
        deployUrl: deploymentStatus.deploy_url || null,
        claimUrl: deploymentStatus.claim_url || null,
        message: deploymentStatus.status === 'success' 
          ? 'Deployment successful!' 
          : deploymentStatus.status === 'error'
            ? deploymentStatus.error_message || 'Deployment failed'
            : 'Deployment in progress...',
        lastChecked: new Date().toISOString(),
        deploymentStatus
      });
    } catch (error) {
      setStatus({
        isLoading: false,
        isDeployed: false,
        deployUrl: null,
        claimUrl: null,
        message: 'Failed to check deployment status',
        lastChecked: new Date().toISOString(),
        deploymentStatus: null
      });
    }
  };

  const handleDeploy = async () => {
    try {
      const result = await deployProject();
      await checkStatus();
    } catch (error) {
      console.error('Deployment failed:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  useEffect(() => {
    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(() => {
      checkStatus();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString();
  };

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Rocket className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Deployment</h3>
          <p className="text-gray-600 dark:text-gray-400">Deploy your application to Netlify</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Status Card */}
        <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
          status.isLoading 
            ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
            : status.isDeployed
              ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
              : 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {status.isLoading ? (
                <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              ) : status.isDeployed ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <div>
                <p className={`font-semibold ${
                  status.isLoading 
                    ? 'text-blue-900 dark:text-blue-100'
                    : status.isDeployed
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-yellow-900 dark:text-yellow-100'
                }`}>
                  {status.isLoading 
                    ? 'Checking Deployment...'
                    : status.isDeployed 
                      ? 'Deployment Active'
                      : 'Not Deployed'
                  }
                </p>
                <p className={`text-sm ${
                  status.isLoading 
                    ? 'text-blue-700 dark:text-blue-300'
                    : status.isDeployed
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {status.message}
                </p>
              </div>
            </div>
            <button
              onClick={checkStatus}
              disabled={status.isLoading}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
              title="Refresh deployment status"
            >
              <RefreshCw className={`w-4 h-4 ${status.isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Deployment URL */}
        {status.deployUrl && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-900 dark:text-green-100">Deployment URL</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-green-700 dark:text-green-300 font-mono">{status.deployUrl}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(status.deployUrl || '')}
                  className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-800/30 rounded transition-colors"
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a 
                  href={status.deployUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  Visit
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Claim URL - for transferring ownership */}
        {status.claimUrl && !status.deploymentStatus?.claimed && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Link className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">Claim URL</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700 dark:text-blue-300 font-mono">{status.claimUrl}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(status.claimUrl || '')}
                  className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded transition-colors"
                  title="Copy URL"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a 
                  href={status.claimUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  Claim Site
                </a>
              </div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Use this link to transfer the Netlify site to your own account
            </p>
          </div>
        )}

        {/* Deploy Button */}
        <div className="flex justify-center mt-6">
          <DeploymentButton onDeploy={handleDeploy} />
        </div>

        {/* Last Checked */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          Last checked: {formatTime(status.lastChecked)}
        </div>
      </div>
    </div>
  );
};

export default DeploymentPanel;