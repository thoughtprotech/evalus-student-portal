"use client";

import { useState, ChangeEvent, FormEvent, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";
import { ArrowLeft, UserPlus2 } from "lucide-react";
import { createCandidateAction } from "@/app/actions/dashboard/candidates/createCandidate";
import { fetchCompaniesAction } from "@/app/actions/admin/companies";
import { fetchCandidatesAction } from "@/app/actions/admin/candidates";

// Indian States (sample, add more as needed)
const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

// Sample countries and candidate groups (replace/fetch as needed)
const COUNTRIES = [
  "India", "United States", "Canada", "United Kingdom", "Australia"
];
const CANDIDATE_GROUPS = [
  "General", "OBC", "SC", "ST", "EWS"
];

// Add this to your list of roles (replace with your actual roles if needed)
const ROLES = [
  { value: "candidate", display: "Candidate" },
  { value: "admin", display: "Admin" }
];

export default function AddCandidatePage() {
  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const selectCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const textareaCls = "w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition";
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    cellPhone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    notes: "",
    companyId: "", // store as string in form, convert later
    candidateGroupIds: [] as string[], // multi-select values as strings
    isActive: true,
  });
  const [userLogin, setUserLogin] = useState({
    userName: "",
    password: "",
    displayName: "",
    role: "",
    userPhoto: null as File | null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [companies, setCompanies] = useState<{id:number; name:string}[]>([]);
  const [groups, setGroups] = useState<{id:number; name:string}[]>([]);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
  const userPhotoInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserLoginChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setUserLogin((prev) => ({
      ...prev,
      [name]: type === "file" ? (e.target as any).files?.[0] : value,
    }));
  };

  // For file input (user photo)
  const handleUserPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUserLogin((prev) => ({
        ...prev,
        userPhoto: e.target.files![0],
      }));
      setUserPhotoPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const validate = () => {
    if (!form.firstName.trim()) {
      toast.error("First name is required");
      return false;
    }
    if (!form.lastName.trim()) {
      toast.error("Last name is required");
      return false;
    }
    if (
      !form.email.trim() ||
      !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.email)
    ) {
      toast.error("Valid email is required");
      return false;
    }
    if (!form.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    if (!validate()) return;

    setIsSaving(true);

    // Prepare payload (adjust as per your API)
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      cellPhone: form.cellPhone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim(),
      notes: form.notes.trim(),
      companyId: form.companyId ? Number(form.companyId) : 0,
      candidateGroupIds: form.candidateGroupIds.map((id) => Number(id)),
      isActive: form.isActive ? 1 : 0,
    };

    const res = await createCandidateAction(payload);
    const { status, error, errorMessage } = res;
    const isSuccess = status >= 200 && status < 300 && !error;

    if (isSuccess) {
      setShowSuccessModal(true);
    } else {
      toast.error(errorMessage || "Failed to create candidate");
    }
    setIsSaving(false);
  };

  const handleSaveAndNew = async () => {
    if (isSaving) return;
    if (!validate()) return;

    setIsSaving(true);

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      cellPhone: form.cellPhone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      postalCode: form.postalCode.trim(),
      country: form.country.trim(),
      notes: form.notes.trim(),
      companyId: form.companyId ? Number(form.companyId) : 0,
      candidateGroupIds: form.candidateGroupIds.map((id) => Number(id)),
      isActive: form.isActive ? 1 : 0,
    };

    const res = await createCandidateAction(payload);
    const { status, error, errorMessage } = res;
    const isSuccess = status >= 200 && status < 300 && !error;

    if (isSuccess) {
      toast.success("Candidate created! Add another...");
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        cellPhone: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        notes: "",
        companyId: "",
        candidateGroupIds: [],
        isActive: true,
      });
    } else {
      toast.error(errorMessage || "Failed to create candidate");
    }
    setIsSaving(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const [compRes, candRes] = await Promise.all([
          fetchCompaniesAction({ top: 100, skip: 0 }),
          fetchCandidatesAction({ top: 200, skip: 0 })
        ]);
        if (compRes.data?.rows) {
          setCompanies(compRes.data.rows.map(r => ({ id: r.id, name: r.companyName })));
        }
        // Derive groups placeholder (unique candidateGroup values)
        if (candRes.data?.rows) {
          const map = new Map<string, number>();
          candRes.data.rows.forEach((r:any) => {
            if (r.candidateGroup && !map.has(r.candidateGroup)) {
              map.set(r.candidateGroup, map.size + 1);
            }
          });
          setGroups(Array.from(map.entries()).map(([name, id]) => ({ id, name })));
        }
      } catch (e) {
        console.error('Init load failed', e);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="w-[85%] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/admin/candidates"
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <UserPlus2 className="w-4 h-4 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  Add New Candidate
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/candidates"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Candidates
              </Link>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAndNew}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors ${
                    isSaving
                      ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {isSaving ? "Saving..." : "Save & New"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors ${
                    isSaving
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {isSaving ? "Saving..." : "Save Candidate"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

  {/* Main Content */}
  <div className="w-[85%] mx-auto px-6 py-8">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            autoComplete="off"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className={inputCls}
                  placeholder="Enter first name"
                  value={form.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className={inputCls}
                  placeholder="Enter last name"
                  value={form.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className={inputCls}
                  placeholder="Enter email"
                  value={form.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  required
                  className={inputCls}
                  placeholder="Enter phone number"
                  value={form.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Cell Phone
                </label>
                <input
                  type="text"
                  name="cellPhone"
                  className={inputCls}
                  placeholder="Enter cell phone"
                  value={form.cellPhone}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Company
                </label>
                <select
                  name="companyId"
                  aria-label="Company"
                  className={selectCls}
                  value={form.companyId}
                  onChange={handleInputChange}
                >
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Candidate Groups (multi-select)
                </label>
                <select
                  multiple
                  name="candidateGroupIds"
                  aria-label="Candidate Groups"
                  className={`w-full h-32 border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition`}
                  value={form.candidateGroupIds}
                  onChange={(e) => {
                    const options = Array.from(e.target.selectedOptions).map(o => o.value);
                    setForm(prev => ({ ...prev, candidateGroupIds: options }));
                  }}
                >
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-800">Active</label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Address
              </label>
              <textarea
                name="address"
                className={textareaCls}
                placeholder="Enter address"
                rows={2}
                value={form.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  className={inputCls}
                  placeholder="Enter city"
                  value={form.city}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  State
                </label>
                <select
                  aria-label="State"
                  name="state"
                  className={selectCls}
                  value={form.state}
                  onChange={handleInputChange}
                >
                  <option value="">Select state</option>
                  {STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  className={inputCls}
                  placeholder="Enter postal code"
                  value={form.postalCode}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Country
                </label>
                <select
                  aria-label="Country"
                  name="country"
                  className={selectCls}
                  value={form.country}
                  onChange={handleInputChange}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                className={textareaCls}
                placeholder="Additional notes (optional)"
                rows={2}
                value={form.notes}
                onChange={handleInputChange}
              />
            </div>

            {/* --- User Login Section --- */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">User Login</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    User Name
                  </label>
                  <input
                    type="text"
                    name="userName"
                    className={inputCls}
                    placeholder="Enter user name"
                    value={userLogin.userName}
                    onChange={handleUserLoginChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    className={inputCls}
                    placeholder="Enter password"
                    value={userLogin.password}
                    onChange={handleUserLoginChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    name="displayName"
                    className={inputCls}
                    placeholder="Enter display name"
                    value={userLogin.displayName}
                    onChange={handleUserLoginChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    className={selectCls}
                    value={userLogin.role}
                    onChange={handleUserLoginChange}
                  >
                    <option value="">Select role</option>
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.display}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  User Photo
                </label>
                <input
                  type="file"
                  name="userPhoto"
                  accept="image/*"
                  ref={userPhotoInputRef}
                  className={inputCls}
                  onChange={handleUserPhotoChange}
                />
                {userPhotoPreview && (
                  <div className="mt-2">
                    <img
                      src={userPhotoPreview}
                      alt="User Photo Preview"
                      className="h-16 w-16 object-contain border rounded"
                    />
                  </div>
                )}
              </div>
            </div>
            {/* --- End User Login Section --- */}

            {/* Bottom action buttons removed as per requirement (only header actions retained) */}
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onConfirm={() => {
          setShowSuccessModal(false);
          router.push("/admin/candidates");
        }}
        onCancel={() => {}}
        title="Candidate Created Successfully! 🎉"
        message="Your candidate has been successfully created and saved to the database."
        confirmText="Go to Candidates"
        cancelText=""
        variant="success"
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
      />
    </div>
  );
}