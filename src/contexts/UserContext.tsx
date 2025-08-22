"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type UserContextType = {
  username: string;
  currentGroupId: string;
  setUsername: (name: string) => void;
  setCurrentGroupId: (groupId: string) => void;
  groupSelected: boolean;
  setGroupSelected: (val: boolean) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState<string>("");
  const [currentGroupId, setCurrentGroupId] = useState<string>("");
  const [groupSelected, setGroupSelected] = useState<boolean>(false);

  return (
    <UserContext.Provider
      value={{ username, currentGroupId, setUsername, setCurrentGroupId, groupSelected, setGroupSelected }}
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
