import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const DebugAuth: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const token = localStorage.getItem('token');

  return (
    <div className="p-6 bg-[#161b22] border border-[#21262d] rounded-lg m-4">
      <h2 className="text-xl font-bold text-[#f0f6fc] mb-4">🔍 Debug Auth State</h2>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-[#7d8590]">Is Loading:</span>
          <span className="text-[#f0f6fc] ml-2">{isLoading.toString()}</span>
        </div>
        
        <div>
          <span className="text-[#7d8590]">Is Authenticated:</span>
          <span className="text-[#f0f6fc] ml-2">{isAuthenticated.toString()}</span>
        </div>
        
        <div>
          <span className="text-[#7d8590]">Token in localStorage:</span>
          <span className="text-[#f0f6fc] ml-2">{token ? 'Present' : 'Missing'}</span>
        </div>
        
        <div>
          <span className="text-[#7d8590]">User Object:</span>
          <pre className="text-[#f0f6fc] ml-2 mt-2 bg-[#0d1117] p-2 rounded overflow-auto text-xs">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        
        <div>
          <span className="text-[#7d8590]">User Role:</span>
          <span className="text-[#f0f6fc] ml-2">{user?.role || 'None'}</span>
        </div>
        
        <div>
          <span className="text-[#7d8590]">Expected Redirect:</span>
          <span className="text-[#f0f6fc] ml-2">
            {!isAuthenticated ? '/login' :
             (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') ? '/admin/dashboard' :
             '/dashboard'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default DebugAuth;
