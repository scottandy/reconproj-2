import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database, Play, CheckCircle2, AlertCircle, RefreshCw, FileText, Users, Car, Phone, Calendar, MapPin } from 'lucide-react';

const DatabaseMigrationStatus: React.FC = () => {
  const [migrationStatus, setMigrationStatus] = useState<{
    isRunning: boolean;
    isComplete: boolean;
    error: string | null;
    tables: Record<string, boolean>;
  }>({
    isRunning: false,
    isComplete: false,
    error: null,
    tables: {}
  });

  const expectedTables = [
    { name: 'dealerships', icon: FileText, description: 'Dealership information and settings' },
    { name: 'users', icon: Users, description: 'User accounts and roles' },
    { name: 'vehicles', icon: Car, description: 'Vehicle inventory and status' },
    { name: 'contacts', icon: Phone, description: 'Service provider contacts' },
    { name: 'todos', icon: Calendar, description: 'Tasks and calendar events' },
    { name: 'locations', icon: MapPin, description: 'Vehicle locations and capacity' }
  ];

  const checkTableExists = async (tableName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      return !error;
    } catch (error) {
      return false;
    }
  };

  const checkMigrationStatus = async () => {
    setMigrationStatus(prev => ({ ...prev, isRunning: true, error: null }));

    try {
      const tableStatus: Record<string, boolean> = {};
      
      for (const table of expectedTables) {
        const exists = await checkTableExists(table.name);
        tableStatus[table.name] = exists;
      }

      const allTablesExist = Object.values(tableStatus).every(exists => exists);

      setMigrationStatus({
        isRunning: false,
        isComplete: allTablesExist,
        error: null,
        tables: tableStatus
      });
    } catch (error) {
      setMigrationStatus({
        isRunning: false,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Failed to check migration status',
        tables: {}
      });
    }
  };

  const runMigration = async () => {
    setMigrationStatus(prev => ({ ...prev, isRunning: true, error: null }));

    try {
      // Note: In a real application, you would run the migration SQL here
      // For this demo, we'll just check if tables exist
      await checkMigrationStatus();
    } catch (error) {
      setMigrationStatus(prev => ({
        ...prev,
        isRunning: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      }));
    }
  };

  React.useEffect(() => {
    checkMigrationStatus();
  }, []);

  return (
    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/20 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Database Migration Status</h3>
          <p className="text-gray-600 dark:text-gray-400">Database schema setup and table creation</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Migration Status */}
        <div className={`p-4 rounded-xl border-2 transition-all duration-200 ${
          migrationStatus.isRunning 
            ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20'
            : migrationStatus.isComplete
              ? 'border-green-200 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
              : 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {migrationStatus.isRunning ? (
                <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              ) : migrationStatus.isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <div>
                <p className={`font-semibold ${
                  migrationStatus.isRunning 
                    ? 'text-blue-900 dark:text-blue-100'
                    : migrationStatus.isComplete
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-yellow-900 dark:text-yellow-100'
                }`}>
                  {migrationStatus.isRunning 
                    ? 'Checking Migration Status...'
                    : migrationStatus.isComplete 
                      ? 'Database Schema Ready'
                      : 'Migration Required'
                  }
                </p>
                <p className={`text-sm ${
                  migrationStatus.isRunning 
                    ? 'text-blue-700 dark:text-blue-300'
                    : migrationStatus.isComplete
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {migrationStatus.isRunning 
                    ? 'Verifying database tables...'
                    : migrationStatus.isComplete
                      ? 'All required tables are present'
                      : 'Some tables are missing and need to be created'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={checkMigrationStatus}
                disabled={migrationStatus.isRunning}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-lg hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
                title="Refresh status"
              >
                <RefreshCw className={`w-4 h-4 ${migrationStatus.isRunning ? 'animate-spin' : ''}`} />
              </button>
              {!migrationStatus.isComplete && (
                <button
                  onClick={runMigration}
                  disabled={migrationStatus.isRunning}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <Play className="w-4 h-4" />
                  Run Migration
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {migrationStatus.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="font-semibold text-red-900 dark:text-red-100">Migration Error</span>
            </div>
            <p className="text-sm text-red-700 dark:text-red-300">{migrationStatus.error}</p>
          </div>
        )}

        {/* Tables Status */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Database Tables</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expectedTables.map((table) => {
              const exists = migrationStatus.tables[table.name];
              const Icon = table.icon;
              
              return (
                <div key={table.name} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">{table.name}</span>
                    {exists ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{table.description}</p>
                  <p className={`text-xs mt-1 font-medium ${
                    exists ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {exists ? 'Table exists' : 'Table missing'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Migration Instructions */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Migration Instructions</h4>
          <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <p>The migration file has been created at <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">supabase/migrations/20250617160910_proud_math.sql</code></p>
            <p>To apply the migration to your Supabase database:</p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Go to your Supabase dashboard</li>
              <li>Navigate to the SQL Editor</li>
              <li>Copy and paste the migration SQL</li>
              <li>Run the migration</li>
              <li>Return here and click "Refresh Status"</li>
            </ol>
          </div>
        </div>

        {/* Success Message */}
        {migrationStatus.isComplete && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">🎉 Database Ready!</h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Your database schema has been successfully set up. You can now start using all the application features with Supabase as your backend.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseMigrationStatus;