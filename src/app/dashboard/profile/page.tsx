"use client";

import { EditableImage } from "@/components/EditableImage";
import EditableText from "@/components/EditableText";
import { Mail, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import UpdatePassword from "./_components/UpdatePassword";
import Loader from "@/components/Loader";
import { apiHandler } from "@/utils/api/client";
import { endpoints } from "@/utils/api/endpoints";
import { uploadToLocal } from "@/utils/uploadToLocal";
import { useUser } from "@/contexts/UserContext";

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
  const [raw, setRaw] = useState<any>();
  const [userName, setUserName] = useState<string | undefined>();
  const { username } = useUser();

  const fetchCandidate = async () => {
    // Step 1: Resolve username from context
    const effectiveUser = username;
    if (!effectiveUser) return; // wait until username available

    // Step 2: Fetch Users by userName (source of truth for displayName/photo and potential candidateId)
    const usersRes = await apiHandler(endpoints.getUserByUserName, { userName: effectiveUser } as any);
    const uRaw: any = usersRes?.data;
    const userObj = Array.isArray(uRaw?.value) ? uRaw.value[0] : uRaw;

    const uname = userObj?.userName ?? userObj?.UserName ?? effectiveUser;
    setUserName(uname);

    // Try to derive candidateId from Users payload
    const derivedCandidateId = userObj?.candidateId ?? userObj?.CandidateId ?? userObj?.candidateID ?? userObj?.CandidateID;

    // Step 3: If candidateId present, fetch CandidateRegistration; else, fallback to minimal mapping from Users
    if (derivedCandidateId) {
      const res = await apiHandler(endpoints.getCandidateById, { candidateId: Number(derivedCandidateId) } as any);
      if (res.error || !res.data) {
        // fallback to users-only mapping
        const mappedFromUser: Candidate = {
          CandidateID: Number(derivedCandidateId),
          FirstName: "",
          LastName: "",
          Email: userObj?.email ?? userObj?.Email ?? "",
          PhoneNumber: "",
          CellPhone: "",
          Address: "",
          City: "",
          State: "",
          PostalCode: "",
          Country: "",
          CandidateGroupID: 0,
          Notes: "",
          DisplayName: userObj?.displayName ?? userObj?.DisplayName ?? "",
          IUserPhoto: userObj?.userPhoto ?? userObj?.UserPhoto ?? undefined,
        };
        setCandidate(mappedFromUser);
        setLoaded(true);
        return;
      }
      const c: any = res.data;
      setRaw(c);
      const login = getLoginLike(c);
      const mapped: Candidate = {
        CandidateID: c.candidateId ?? Number(derivedCandidateId),
        FirstName: c.firstName ?? "",
        LastName: c.lastName ?? "",
        Email: c.email ?? c.Email ?? login?.email ?? login?.Email ?? userObj?.email ?? userObj?.Email ?? "",
        PhoneNumber: c.phoneNumber ?? "",
        CellPhone: c.cellPhone ?? "",
        Address: c.address ?? "",
        City: c.city ?? "",
        State: c.state ?? "",
        PostalCode: c.postalCode ?? "",
        Country: c.country ?? "",
        CandidateGroupID: (Array.isArray(c.candidateGroupIds) ? c.candidateGroupIds[0] : c.candidateGroupId) ?? 0,
        Notes: c.notes ?? "",
        DisplayName: userObj?.displayName ?? userObj?.DisplayName ?? c.displayName ?? c.DisplayName ?? login?.displayName ?? login?.DisplayName ?? "",
        IUserPhoto: c.userPhoto ?? c.UserPhoto ?? login?.userPhoto ?? login?.UserPhoto ?? userObj?.userPhoto ?? userObj?.UserPhoto ?? undefined,
      };
      setCandidate(mapped);
      setLoaded(true);
    } else {
      // Users had no candidateId: still set account info so header/account shows correctly
      const mappedFromUser: Candidate = {
        CandidateID: 0,
        FirstName: "",
        LastName: "",
        Email: userObj?.email ?? userObj?.Email ?? "",
        PhoneNumber: "",
        CellPhone: "",
        Address: "",
        City: "",
        State: "",
        PostalCode: "",
        Country: "",
        CandidateGroupID: 0,
        Notes: "",
        DisplayName: userObj?.displayName ?? userObj?.DisplayName ?? "",
        IUserPhoto: userObj?.userPhoto ?? userObj?.UserPhoto ?? undefined,
      };
      setCandidate(mappedFromUser);
      setLoaded(true);
    }
  };

  useEffect(() => {
    fetchCandidate();
    // re-run if username from context becomes available
  }, [username]);

  const handleImageUpdate = async (formdata: FormData) => {
    if (!candidate) return;
    const file = formdata.get("file");
    if (file && file instanceof File) {
      const { url } = await uploadToLocal(file);
      // Persist photo on Users if we know the username
      if (userName) {
        await apiHandler(endpoints.patchUser, {
          userName,
          operations: [{ path: "/userPhoto", op: "replace", value: url }],
        } as any);
      }
      setCandidate({ ...candidate, IUserPhoto: url });
    }
  };

  const handleUserUpdate = async (text: string, field: string) => {
    if (!candidate || !raw) return;
    // Clone current raw candidate model
    const body: any = { ...raw };
    let updateUsersPassword = false;
    switch (field) {
      case "FirstName": body.firstName = text; break;
      case "LastName": body.lastName = text; break;
      case "Email": body.email = text; ensureLogin(body); body.userLogin[0].email = text; break;
      case "PhoneNumber": body.phoneNumber = text; break;
      case "CellPhone": body.cellPhone = text; break;
      case "Address": body.address = text; break;
      case "City": body.city = text; break;
      case "State": body.state = text; break;
      case "PostalCode": body.postalCode = text; break;
      case "Country": body.country = text; break;
      case "DisplayName":
        ensureLogin(body);
        body.userLogin[0].displayName = text;
        body.userLogin[0].DisplayName = text;
        body.displayName = text;
        body.DisplayName = text;
        break;
      case "password": updateUsersPassword = true; break;
      default: break;
    }

    if (!updateUsersPassword) {
      const putRes = await apiHandler(endpoints.updateCandidate, { candidateId: body.candidateId, ...body } as any);
      if (!putRes.error) {
        setRaw(body);
        // Optimistically update visible fields
        setCandidate((prev) => updateLocalCandidate(prev, field, text));
      }
      // If display name changed, also patch Users to keep in sync
      if (field === "DisplayName" && userName) {
        await apiHandler(endpoints.patchUser, {
          userName,
          operations: [{ path: "/displayName", op: "replace", value: text }],
        } as any);
      }
    } else if (userName) {
      await apiHandler(endpoints.patchUser, {
        userName,
        operations: [{ path: "/password", op: "replace", value: text }],
      } as any);
    }
  };

  function ensureLogin(obj: any) {
    // Prefer maintaining whichever structure backend returned
    const existing = getLoginArrayRef(obj);
    if (existing.arr.length === 0) existing.ref.push({});
    // Normalize access to first login
    obj.__loginAccessor = existing.ref; // transient only for local construction
  }

  function getLoginLike(obj: any): any | undefined {
    const candidates = [
      obj?.userLogin,
      obj?.userLogins,
      obj?.UserLogin,
      obj?.UserLogins,
      obj?.login,
      obj?.Login,
      obj?.user,
      obj?.User,
      obj?.users,
      obj?.Users,
    ];
    for (const v of candidates) {
      if (!v) continue;
      if (Array.isArray(v)) return v[0];
      if (typeof v === 'object') return v;
    }
    return undefined;
  }

  function getLoginArrayRef(obj: any): { ref: any[]; arr: any[] } {
    // Return a reference to whichever array exists or create userLogin
    if (Array.isArray(obj.userLogin)) return { ref: obj.userLogin, arr: obj.userLogin };
    if (Array.isArray(obj.userLogins)) return { ref: obj.userLogins, arr: obj.userLogins };
    if (Array.isArray(obj.UserLogin)) return { ref: obj.UserLogin, arr: obj.UserLogin };
    if (Array.isArray(obj.UserLogins)) return { ref: obj.UserLogins, arr: obj.UserLogins };
    // Create one if none exist
    if (!Array.isArray(obj.userLogin)) obj.userLogin = [];
    return { ref: obj.userLogin, arr: obj.userLogin };
  }

  function updateLocalCandidate(prev: Candidate | undefined, field: string, text: string) {
    if (!prev) return prev;
    const copy: any = { ...prev };
    switch (field) {
      case "FirstName": copy.FirstName = text; break;
      case "LastName": copy.LastName = text; break;
      case "DisplayName": copy.DisplayName = text; break;
      case "Email": copy.Email = text; break;
      case "PhoneNumber": copy.PhoneNumber = text; break;
      case "CellPhone": copy.CellPhone = text; break;
      case "Address": copy.Address = text; break;
      case "City": copy.City = text; break;
      case "State": copy.State = text; break;
      case "PostalCode": copy.PostalCode = text; break;
      case "Country": copy.Country = text; break;
    }
    return copy as Candidate;
  }

  function computeDisplayName(c: Candidate | undefined, fallbackUser?: string) {
    if (!c) return fallbackUser || "";
    if (c.DisplayName && c.DisplayName.trim().length > 0) return c.DisplayName;
    const parts = [c.FirstName, c.LastName].filter(Boolean);
    if (parts.length > 0) return parts.join(" - ");
    return fallbackUser || "";
  }

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
          </div>
        </div>
        <div>
          <UpdatePassword handleUserUpdate={handleUserUpdate} />
        </div>
      </div>

      <div className="w-full max-w-4xl flex flex-col gap-6">
        {/* Account section: Display Name (editable) and User Name (read-only) */}
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg text-gray-800">Account</h2>
          </div>
          {candidate && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-600">Display Name</h3>
                <EditableText
                  text={computeDisplayName(candidate, userName)}
                  onSubmit={(text) => handleUserUpdate(text, "DisplayName")}
                  className="text-lg text-gray-800"
                  inputClassName="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <h3 className="font-medium text-gray-600">User Name</h3>
                <p className="text-lg text-gray-800 select-text">{userName || "-"}</p>
              </div>
            </div>
          )}
        </div>

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

        {null}
      </div>
    </div>
  );
}
