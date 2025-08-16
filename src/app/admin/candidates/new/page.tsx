"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";
import { ArrowLeft, UserPlus2 } from "lucide-react";
import { createCandidateAction } from "@/app/actions/dashboard/candidates/createCandidate";

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

export default function AddCandidatePage() {
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
    candidateGroup: "",
    notes: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
      ...form,
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
      candidateGroup: form.candidateGroup.trim(),
      notes: form.notes.trim(),
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
      ...form,
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
      candidateGroup: form.candidateGroup.trim(),
      notes: form.notes.trim(),
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
        candidateGroup: "",
        notes: "",
      });
    } else {
      toast.error(errorMessage || "Failed to create candidate");
    }
    setIsSaving(false);
  };

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
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            autoComplete="off"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter first name"
                  value={form.firstName}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter last name"
                  value={form.lastName}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter email"
                  value={form.email}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter phone number"
                  value={form.phoneNumber}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cell Phone
                </label>
                <input
                  type="text"
                  name="cellPhone"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter cell phone"
                  value={form.cellPhone}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Candidate Group
                </label>
                <select
                  name="candidateGroup"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
                  value={form.candidateGroup}
                  onChange={handleInputChange}
                >
                  <option value="">Select group</option>
                  {CANDIDATE_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Enter address"
                rows={2}
                value={form.address}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter city"
                  value={form.city}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  name="state"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="postalCode"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                  placeholder="Enter postal code"
                  value={form.postalCode}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country
                </label>
                <select
                  name="country"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                name="notes"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Additional notes (optional)"
                rows={2}
                value={form.notes}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleSaveAndNew}
                disabled={isSaving}
                className={`flex-1 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors ${
                  isSaving
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isSaving ? "Saving..." : "Save & New"}
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors ${
                  isSaving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isSaving ? "Saving..." : "Save Candidate"}
              </button>
            </div>
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