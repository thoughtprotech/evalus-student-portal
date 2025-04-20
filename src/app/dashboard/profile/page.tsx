"use client";

import {
  fetchCandidateAction,
  updateCandidateAction,
} from "@/app/actions/dashboard/user";
import { EditableImage } from "@/components/EditableImage";
import EditableText from "@/components/EditableText";
import { Mail, MapPin, StickyNote } from "lucide-react";
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
  const [candidate, setCandidate] = useState<Candidate>();

  const fetchCandidate = async () => {
    const { status, data, message } = await fetchCandidateAction(1);
    if (status) {
      setCandidate(data as Candidate);
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchCandidate();
  }, []);

  const handleImageUpdate = async (formdata: FormData) => {
    const { status, data, message } = await updateCandidateAction(
      candidate!.CandidateID,
      formdata
    );
    if (status) {
      console.log({ data, message });
    }
  };

  const handleUserUpdate = async (text: string, field: string) => {
    const formData = new FormData();
    formData.append(field, text);
    console.log({ formData });
    const { status, data, message } = await updateCandidateAction(
      candidate!.CandidateID,
      formData
    );
    if (status) {
      console.log({ data, message });
    }
  };

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full flex flex-col items-center gap-6">
      <div className="w-full max-w-4xl flex flex-col lg:flex lg:flex-row justify-between lg:items-center gap-4">
        <div className=" flex items-center gap-8">
          {candidate && (
            <EditableImage
              firstName={candidate.FirstName}
              lastName={candidate.LastName}
              src={candidate.IUserPhoto}
              onEdit={handleImageUpdate}
            />
          )}
          <div className="flex flex-col">
            <div className="flex flex-col">
              {candidate && (
                <EditableText
                  text={candidate.LastName}
                  onSubmit={(text) => handleUserUpdate(text, "LastName")}
                  className="text-xl font-bold text-indigo-600"
                  inputClassName="p-2 border border-gray-300 rounded-md"
                />
              )}
              {candidate && (
                <EditableText
                  text={candidate.FirstName}
                  onSubmit={(text) => handleUserUpdate(text, "FirstName")}
                  className="text-5xl font-bold text-gray-800"
                  inputClassName="text-5xl p-2 border border-gray-300 rounded-md"
                />
              )}
            </div>
            <div className="text-xl font-medium text-gray-600">
              {candidate && (
                <EditableText
                  text={candidate.DisplayName}
                  onSubmit={(text) => handleUserUpdate(text, "DisplayName")}
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

      <div className="w-full max-w-4xl flex flex-col gap-6">
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Mail className="text-indigo-500" />
            <h2 className="font-semibold text-lg text-gray-800">
              Contact Information
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {candidate && (
              <>
                <div>
                  <h3 className="font-medium text-gray-600">Email</h3>
                  <EditableText
                    text={candidate.Email}
                    onSubmit={(text) => handleUserUpdate(text, "Email")}
                    className="text-lg text-gray-800"
                    inputClassName="w-full p-2 border border-gray-300 rounded-md"
                    type="email"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-600">Phone Number</h3>
                  <EditableText
                    text={candidate.PhoneNumber}
                    onSubmit={(text) => handleUserUpdate(text, "PhoneNumber")}
                    className="text-lg text-gray-800"
                    inputClassName="w-full p-2 border border-gray-300 rounded-md"
                    type="phone"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-600">Cell Phone</h3>
                  <EditableText
                    text={candidate.CellPhone}
                    onSubmit={(text) => handleUserUpdate(text, "CellPhone")}
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
                    text={candidate.Address}
                    onSubmit={(text) => handleUserUpdate(text, "Address")}
                    className="text-lg text-gray-800"
                    inputClassName="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-600">City</h3>
                  <EditableText
                    text={candidate.City}
                    onSubmit={(text) => handleUserUpdate(text, "City")}
                    className="text-lg text-gray-800"
                    inputClassName="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-600">State</h3>
                  <EditableText
                    text={candidate.State}
                    onSubmit={(text) => handleUserUpdate(text, "State")}
                    className="text-lg text-gray-800"
                    inputClassName="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-600">Postal Code</h3>
                  <EditableText
                    text={candidate.PostalCode}
                    onSubmit={(text) => handleUserUpdate(text, "PostalCode")}
                    className="text-lg text-gray-800"
                    inputClassName="w-full p-2 border border-gray-300 rounded-md"
                    type="number"
                  />
                </div>
                <div>
                  <h3 className="font-medium text-gray-600">Country</h3>
                  <EditableText
                    text={candidate.Country}
                    onSubmit={(text) => handleUserUpdate(text, "Country")}
                    className="text-lg text-gray-800"
                    inputClassName="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="flex items-center gap-2">
            <StickyNote className="text-yellow-500" />
            <h2 className="font-semibold text-lg text-gray-800">Notes</h2>
          </div>
          <h1 className="text-lg text-gray-800">{candidate?.Notes}</h1>
        </div>
      </div>
    </div>
  );
}
