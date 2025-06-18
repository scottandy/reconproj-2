import React, { useState } from 'react';
import { Rocket, Loader2 } from 'lucide-react';

interface DeploymentButtonProps {
  onDeploy: () => Promise<void>;
}

const DeploymentButton: React.FC<DeploymentButtonProps> = ({ onDeploy }) => {
  const [isDeploying, setIsDeploying] = useState(false);

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await onDeploy();
    } catch (error) {
      console.error('Deployment failed:', error);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <button
      onClick={handleDeploy}
      disabled={isDeploying}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg disabled:opacity-70"
    >
      {isDeploying ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Deploying...
        </>
      ) : (
        <>
          <Rocket className="w-5 h-5" />
          Deploy to Netlify
        </>
      )}
    </button>
  );
};

export default DeploymentButton;