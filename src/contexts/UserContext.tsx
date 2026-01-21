"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type UserContextType = {
  username: string;
  displayName: string;
  userPhoto: string | null;
  candidateId: number | null;
  setCandidateId: (id: number | null) => void;
  setUserPhoto: (photo: string | null) => void;
  setDisplayName: (name: string) => void;
  currentGroupId: string;
  setUsername: (name: string) => void;
  setCurrentGroupId: (groupId: string) => void;
  groupSelected: boolean;
  setGroupSelected: (val: boolean) => void;
  selectedGroupName: string;
  setSelectedGroupName: (name: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<number | null>(null);
  const [currentGroupId, setCurrentGroupId] = useState<string>("");
  const [groupSelected, setGroupSelected] = useState<boolean>(false);
  const [selectedGroupName, setSelectedGroupName] = useState<string>("");

  return (
    <UserContext.Provider
      value={{ username, displayName, userPhoto, candidateId, setCandidateId, setUsername, setDisplayName, setUserPhoto, currentGroupId, setCurrentGroupId, groupSelected, setGroupSelected, selectedGroupName, setSelectedGroupName }}
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
