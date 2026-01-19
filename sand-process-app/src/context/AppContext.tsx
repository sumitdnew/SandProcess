import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../constants/mockData';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  currentRole: UserRole | null;
  setCurrentRole: (role: UserRole) => void;
  users: User[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [users] = useState<User[]>(mockUsers);

  // Load from localStorage on mount
  React.useEffect(() => {
    const savedRole = localStorage.getItem('currentRole');
    if (savedRole) {
      const role = savedRole as UserRole;
      setCurrentRole(role);
      const user = mockUsers.find(u => u.role === role) || mockUsers[0];
      setCurrentUser(user);
    } else {
      // Default to admin
      setCurrentRole('admin');
      setCurrentUser(mockUsers[0]);
    }
  }, []);

  // Save to localStorage when role changes
  React.useEffect(() => {
    if (currentRole) {
      localStorage.setItem('currentRole', currentRole);
      const user = mockUsers.find(u => u.role === currentRole) || mockUsers[0];
      setCurrentUser(user);
    }
  }, [currentRole]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        currentRole,
        setCurrentRole,
        users,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};


