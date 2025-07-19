"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type UserContextType = {
  username: string;
  currentGroupId: string;
  setUsername: (name: string) => void;
  setCurrentGroupId: (groupId: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState<string>("");
  const [currentGroupId, setCurrentGroupId] = useState<string>("");

  return (
    <UserContext.Provider
      value={{ username, currentGroupId, setUsername, setCurrentGroupId }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
