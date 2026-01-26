"use client";

import { useState, ChangeEvent, FormEvent, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";
import { ArrowLeft, UserPlus2 } from "lucide-react";
import { createUserAction } from "@/app/actions/admin/users/updateUser";
import { fetchCompaniesAction } from "@/app/actions/admin/companies";
import { fetchRolesAction } from "@/app/actions/admin/roles";
import { useUser } from "@/contexts/UserContext";
import { uploadToLocal } from "@/utils/uploadToLocal";
import PasswordInput from "@/components/PasswordInput";
import { validatePassword } from "@/utils/passwordValidation";

// Indian States
const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

const COUNTRIES = [
  "India", "United States", "Canada", "United Kingdom", "Australia"
];

export default function AddUserPage() {
  const { username } = useUser();
  const router = useRouter();
  
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
    companyId: "",
    isActive: true,
    isHandicapped: false,
    userName: "",
    password: "",
    displayName: "",
    role: "",
    userPhoto: null as string | null,
  });

  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = useCallback((password: string) => {
    setForm(prev => ({ ...prev, password }));
  }, []);

  const handlePasswordValidationChange = useCallback((isValid: boolean, errors: string[]) => {
    setPasswordValid(isValid);
    setPasswordErrors(errors);
  }, []);

  const handleUserPhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const { url } = await uploadToLocal(file);
        setForm(prev => ({ ...prev, userPhoto: url }));
        setUserPhotoPreview(url);
      } catch (error) {
        console.error('File upload failed:', error);
        toast.error('Photo upload failed. Please try again.');
      }
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
    if (!form.email.trim() || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(form.email)) {
      toast.error("Valid email is required");
      return false;
    }
    if (!form.phoneNumber.trim()) {
      toast.error("Phone number is required");
      return false;
    }
    if (!form.userName.trim()) {
      toast.error("User name is required");
      return false;
    }

    const passwordValidation = validatePassword(form.password);
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0] || "Password does not meet requirements");
      return false;
    }

    if (!form.displayName.trim()) {
      toast.error("Display name is required");
      return false;
    }
    if (!form.role.trim()) {
      toast.error("Role is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
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
      createdBy: username || "system",
      modifiedBy: username || "system",
      isActive: form.isActive ? 1 : 0,
      isHandicapped: form.isHandicapped ? 1 : 0,
      userName: form.userName.trim(),
      password: form.password,
      displayName: form.displayName.trim(),
      role: form.role.trim(),
      userPhoto: form.userPhoto,
    };

    const res = await createUserAction(payload);
    const { status, error, errorMessage } = res;
    const isSuccess = status >= 200 && status < 300 && !error;

    if (isSuccess) {
      setShowSuccessModal(true);
    } else {
      toast.error(errorMessage || "Failed to create user");
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
      createdBy: username || "system",
      modifiedBy: username || "system",
      isActive: form.isActive ? 1 : 0,
      isHandicapped: form.isHandicapped ? 1 : 0,
      userName: form.userName.trim(),
      password: form.password,
      displayName: form.displayName.trim(),
      role: form.role.trim(),
      userPhoto: form.userPhoto,
    };

    const res = await createUserAction(payload);
    const { status, error, errorMessage } = res;
    const isSuccess = status >= 200 && status < 300 && !error;

    if (isSuccess) {
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
        isActive: true,
        isHandicapped: false,
        userName: "",
        password: "",
        displayName: "",
        role: "",
        userPhoto: null,
      });
      setUserPhotoPreview(null);
      toast.success("User created successfully!");
    } else {
      toast.error(errorMessage || "Failed to create user");
    }
    setIsSaving(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const [compRes, rolesRes] = await Promise.all([
          fetchCompaniesAction({ top: 100, skip: 0 }),
          fetchRolesAction({ top: 200, skip: 0 }),
        ]);

        if (compRes.data?.rows) {
          setCompanies(compRes.data.rows.map((r) => ({ id: r.id, name: r.companyName })));
        }
        if (rolesRes.data?.rows) {
          // Filter out Candidate role
          const filteredRoles = rolesRes.data.rows
            .filter((r: any) => r.name?.toLowerCase() !== 'candidate')
            .map((r: any) => ({ id: r.name, name: r.name }));
          setRoles(filteredRoles);
        }
      } catch (e) {
        console.error("Init load failed", e);
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
              <Link href="/admin/users" className="text-gray-500 hover:text-gray-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <UserPlus2 className="w-4 h-4 text-indigo-600" />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900">Add New User</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/users" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Back to Users
              </Link>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSaveAndNew}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors ${isSaving ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  {isSaving ? "Saving..." : "Save & New"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-colors ${isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}
                >
                  {isSaving ? "Saving..." : "Save User"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-[85%] mx-auto px-6 py-8">
        <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input type="text" name="firstName" required className={inputCls} placeholder="Enter first name" value={form.firstName} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input type="text" name="lastName" required className={inputCls} placeholder="Enter last name" value={form.lastName} onChange={handleInputChange} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input type="email" name="email" required className={inputCls} placeholder="Enter email" value={form.email} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input type="text" name="phoneNumber" required className={inputCls} placeholder="Enter phone number" value={form.phoneNumber} onChange={handleInputChange} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Cell Phone</label>
                <input type="text" name="cellPhone" className={inputCls} placeholder="Enter cell phone" value={form.cellPhone} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Company</label>
                <select name="companyId" aria-label="Company" className={selectCls} value={form.companyId} onChange={handleInputChange}>
                  <option value="">Select company</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 pt-6">
                <input id="isActive" type="checkbox" checked={form.isActive} onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))} className="h-4 w-4 text-indigo-600 border-gray-300 rounded" />
                <label htmlFor="isActive" className="text-sm text-gray-800">Active</label>
              </div>
              <div className="pt-6">
                <label className="block text-sm font-medium text-gray-800 mb-2">Specially Abled</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input id="handicapped-no" type="radio" checked={!form.isHandicapped} onChange={() => setForm(prev => ({ ...prev, isHandicapped: false }))} className="h-4 w-4 text-indigo-600 border-gray-300" />
                    <label htmlFor="handicapped-no" className="text-sm text-gray-800">No</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input id="handicapped-yes" type="radio" checked={form.isHandicapped} onChange={() => setForm(prev => ({ ...prev, isHandicapped: true }))} className="h-4 w-4 text-indigo-600 border-gray-300" />
                    <label htmlFor="handicapped-yes" className="text-sm text-gray-800">Yes</label>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Address</label>
              <textarea name="address" className={textareaCls} placeholder="Enter address" rows={2} value={form.address} onChange={handleInputChange} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">City</label>
                <input type="text" name="city" className={inputCls} placeholder="Enter city" value={form.city} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">State</label>
                <select aria-label="State" name="state" className={selectCls} value={form.state} onChange={handleInputChange}>
                  <option value="">Select state</option>
                  {STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Postal Code</label>
                <input type="text" name="postalCode" className={inputCls} placeholder="Enter postal code" value={form.postalCode} onChange={handleInputChange} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Country</label>
                <select aria-label="Country" name="country" className={selectCls} value={form.country} onChange={handleInputChange}>
                  <option value="">Select country</option>
                  {COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1">Notes</label>
              <textarea name="notes" className={textareaCls} placeholder="Additional notes (optional)" rows={2} value={form.notes} onChange={handleInputChange} />
            </div>

            {/* User Login Section */}
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">User Login</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    User Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="userName" className={inputCls} placeholder="Enter user name" value={form.userName} onChange={handleInputChange} />
                </div>
                <div>
                  <PasswordInput
                    value={form.password}
                    onChange={handlePasswordChange}
                    onValidationChange={handlePasswordValidationChange}
                    placeholder="Enter a strong password"
                    label="Password"
                    required={true}
                    showRequirements={true}
                    showStrengthIndicator={true}
                    className="mt-0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="displayName" className={inputCls} placeholder="Enter display name" value={form.displayName} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select name="role" className={selectCls} value={form.role} onChange={handleInputChange}>
                    <option value="">Select role</option>
                    {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-800 mb-1">User Photo</label>
                <input type="file" name="userPhoto" accept="image/*" className={inputCls} onChange={handleUserPhotoChange} />
                {userPhotoPreview && (
                  <div className="mt-2">
                    <img src={userPhotoPreview} alt="User Photo Preview" className="h-16 w-16 object-contain border rounded" />
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onConfirm={() => { setShowSuccessModal(false); router.push("/admin/users"); }}
        onCancel={() => {}}
        title="User Created Successfully! ??"
        message="Your user has been successfully created and saved to the database."
        confirmText="Go to Users"
        cancelText=""
        variant="success"
        className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
      />
    </div>
  );
}
