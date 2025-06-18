import React, { useState, useEffect } from 'react';
import { getDeploymentStatus } from '../utils/deploymentUtils';
import { Rocket, CheckCircle2, AlertCircle, RefreshCw, Clock, Link, ExternalLink } from 'lucide-react';

const DeploymentStatus: React.FC = () => {
  const [status, setStatus] = useState<{
    isLoading: boolean;
    isDeployed: boolean;
    deployUrl: string | null;
    message: string;
    lastChecked: string;
  }>({
    isLoading: true,
    isDeployed: false,
    deployUrl: null,
    message: 'Checking deployment status...',
    lastChecked: new Date().toISOString()
  });

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, isLoading: true }));
    
    try {
      const deploymentStatus = await getDeploymentStatus();
      
      setStatus({
        isLoading: false,
        isDeployed: deploymentStatus.status === 'success',
        deployUrl: deploymentStatus.deploy_url || null,
        message: deploymentStatus.status === 'success' 
          ? 'Deployment successful!' 
          : deploymentStatus.status === 'error'
            ? 'Deployment failed'
            : 'Deployment in progress...',
        lastChecked: new Date().toISOString()
      });
    } catch (error) {
      setStatus({
        isLoading: false,
        isDeployed: false,
        deployUrl: null,
        message: 'Failed to check deployment status',
        lastChecked: new Date().toISOString()
      });
    }
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
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Deployment Status</h3>
          <p className="text-gray-600 dark:text-gray-400">Current deployment information</p>
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
                      : 'Deployment Pending'
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
        )}

        {/* Last Checked */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
          Last checked: {formatTime(status.lastChecked)}
        </div>
      </div>
    </div>
  );
};

export default DeploymentStatus;