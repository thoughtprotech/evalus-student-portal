"use client";

import {
  fetchCandidateAction,
  updateCandidateAction,
} from "@/app/actions/dashboard/user";
import { EditableImage } from "@/components/EditableImage";
import EditableText from "@/components/EditableText";
import { User, Mail, MapPin, StickyNote } from "lucide-react";
import { useEffect, useState } from "react";
import UpdatePassword from "./_components/UpdatePassword";
import Loader from "@/components/Loader";

interface Candidate {
  CandidateID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  CellPhone: string;
  Address: string;
  City: string;
  State: string;
  PostalCode: string;
  Country: string;
  CandidateGroupID: number;
  Notes: string;
  DisplayName: string;
  IUserPhoto?: string | null;
}

export default function ProfilePage() {
  const [loaded, setLoaded] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const [candidate, setCandidate] = useState<any>(null);
  // Get username from UserContext
  const { username: userName } = require("@/contexts/UserContext").useUser();

  const fetchCandidate = async () => {
    const { status, data } = await fetchCandidateAction(userName);
    if (status && data) {
      setUser(data.user);
      setCandidate(data.candidateRegistration);
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, []);

  const handleImageUpdate = async (formdata: FormData) => {
    // Upload the image and get the public URL
    let newUserPhoto = user?.userPhoto ?? "";
    if (formdata.has("file")) {
      // Delete old image if it exists and is a profile image
      if (user?.userPhoto && typeof user.userPhoto === 'string' && user.userPhoto.includes('/uploads/profiles/')) {
        // Extract the relevant path for deletion
        let relativePath = user.userPhoto;
        // If userPhoto is a full URL, extract the path
        if (relativePath.startsWith('http')) {
          try {
            const urlObj = new URL(relativePath);
            relativePath = urlObj.pathname;
          } catch { }
        }
        await fetch(`/api/uploads?path=${relativePath}`, { method: 'DELETE' });
      }
      const file = formdata.get("file");
      if (file && file instanceof File) {
        // Upload the file and get the public URL
        const { url } = await (await import("@/utils/uploadToLocal")).uploadToLocal(file);
        if (url && url.startsWith("/uploads/profiles/")) {
          // Store only the relevant path
          newUserPhoto = url;
        }
      }
    }
    const payload = {
      ...user,
      userPhoto: newUserPhoto,
      candidate: candidate,
    };
    console.log("Image Update Payload:", payload);
    const { status } = await updateCandidateAction(userName, payload);
    if (status) fetchCandidate();
  };

  const handleUserUpdate = async (text: string, field: string) => {
    // PATCH API endpoint: /api/Users/{userName}/both
    // Print PATCH payload for debugging
    // Build JSON Patch document
    // Build simple JSON payload for PUT
    let updatedUser = { ...user };
    let updatedCandidate = { ...candidate };
    if (user && field in user) {
      updatedUser[field] = text;
    } else if (candidate && field in candidate) {
      updatedCandidate[field] = text;
    }
    // Remove navigation arrays if present
    delete updatedUser.users;
    delete updatedUser.userlogs;
    delete updatedCandidate.users;
    const putPayload = {
      user: updatedUser,
      candidateRegistration: updatedCandidate,
    };
    console.log("Profile PUT payload:", putPayload);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000";
    const res = await fetch(`${baseUrl}/api/Users/${userName}/both`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(putPayload),
    });
    if (res.ok) fetchCandidate();
  };

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full flex flex-col items-center bg-gray-50 min-h-screen">
      <div className="w-full bg-white shadow-md py-6 mb-8">
        <h1 className="text-3xl font-bold text-center text-indigo-700">Profile Information</h1>
      </div>
      <div className="w-full max-w-4xl flex flex-col items-center gap-6">
        <div className="w-full flex flex-col lg:flex lg:flex-row justify-between lg:items-center gap-4">
          <div className="flex items-center gap-8">
            {user && (
              <EditableImage
                firstName={candidate?.firstName || user?.firstName}
                lastName={candidate?.lastName || user?.lastName}
                src={user.userPhoto}
                onEdit={handleImageUpdate}
              />
            )}
            <div className="flex flex-col">
              <div className="flex flex-col">
                {candidate && (
                  <EditableText
                    text={candidate.lastName}
                    onSubmit={(text) => handleUserUpdate(text, "lastName")}
                    className="text-xl font-bold text-indigo-600"
                    inputClassName="p-2 border border-gray-300 rounded-md"
                  />
                )}
                {candidate && (
                  <EditableText
                    text={candidate.firstName}
                    onSubmit={(text) => handleUserUpdate(text, "firstName")}
                    className="text-5xl font-bold text-gray-800"
                    inputClassName="text-5xl p-2 border border-gray-300 rounded-md"
                  />
                )}
              </div>
              <div className="text-xl font-medium text-gray-600">
                {user && (
                  <EditableText
                    text={user.displayName}
                    onSubmit={(text) => handleUserUpdate(text, "displayName")}
                    className="text-xl font-bold text-gray-800"
                    inputClassName="w-fit p-2 border border-gray-300 rounded-md"
                  />
                )}
              </div>
            </div>
          </div>
          <div>
            <UpdatePassword handleUserUpdate={handleUserUpdate} />
          </div>
        </div>

        <div className="w-full flex flex-col gap-6">
          {/* Account Information Section */}
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <User className="text-indigo-500" />
              <h2 className="font-semibold text-lg text-gray-800">Account Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {user && (
                <>
                  <div>
                    <h3 className="font-medium text-gray-600">Display Name</h3>
                    <EditableText
                      text={user.displayName}
                      onSubmit={(text) => handleUserUpdate(text, "displayName")}
                      className="text-lg text-gray-800"
                      inputClassName="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-600">User Name</h3>
                    <div className="text-lg text-gray-800 p-2">{user.userName}</div>
                  </div>
                </>
              )}
            </div>
          </div>
          {/* Contact Information Section */}
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Mail className="text-indigo-500" />
              <h2 className="font-semibold text-lg text-gray-800">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {candidate && (
                <>
                  <div>
                    <h3 className="font-medium text-gray-600">Email</h3>
                    <EditableText
                      text={candidate.email}
                      onSubmit={(text) => handleUserUpdate(text, "email")}
                      className="text-lg text-gray-800"
                      inputClassName="w-full p-2 border border-gray-300 rounded-md"
                      type="email"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-600">Phone Number</h3>
                    <EditableText
                      text={candidate.phoneNumber}
                      onSubmit={(text) => handleUserUpdate(text, "phoneNumber")}
                      className="text-lg text-gray-800"
                      inputClassName="w-full p-2 border border-gray-300 rounded-md"
                      type="phone"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-600">Cell Phone</h3>
                    <EditableText
                      text={candidate.cellPhone}
                      onSubmit={(text) => handleUserUpdate(text, "cellPhone")}
                      className="text-lg text-gray-800"
                      inputClassName="w-full p-2 border border-gray-300 rounded-md"
                      type="phone"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="text-red-500" />
              <h2 className="font-semibold text-lg text-gray-800">Address</h2>
            </div>
            {candidate && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-600">Street Address</h3>
                    <EditableText
                      text={candidate.address}
                      onSubmit={(text) => handleUserUpdate(text, "address")}
                      className="text-lg text-gray-800"
                      inputClassName="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-600">City</h3>
                    <EditableText
                      text={candidate.city}
                      onSubmit={(text) => handleUserUpdate(text, "city")}
                      className="text-lg text-gray-800"
                      inputClassName="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-600">State</h3>
                    <EditableText
                      text={candidate.state}
                      onSubmit={(text) => handleUserUpdate(text, "state")}
                      className="text-lg text-gray-800"
                      inputClassName="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-600">Postal Code</h3>
                    <EditableText
                      text={candidate.postalCode}
                      onSubmit={(text) => handleUserUpdate(text, "postalCode")}
                      className="text-lg text-gray-800"
                      inputClassName="w-full p-2 border border-gray-300 rounded-md"
                      type="number"
                    />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-600">Country</h3>
                    <EditableText
                      text={candidate.country}
                      onSubmit={(text) => handleUserUpdate(text, "country")}
                      className="text-lg text-gray-800"
                      inputClassName="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Notes section removed */}
        </div>
      </div>
    </div>
  );
}
