"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmationModal from "@/components/ConfirmationModal";
import { ArrowLeft, Building2 } from "lucide-react";
import { createCompanyAction } from "@/app/actions/dashboard/companies/createCompany";

// Sample state and country lists (replace with your own or fetch from API)
const STATES = [
	"Karnataka",
	"Andhra Pradesh",
	"Telangana",
	"Tamil Nadu",
	"Kerala",
];
const COUNTRIES = [
	"United States",
	"Canada",
	"India",
	"United Kingdom",
	"Australia",
];

export default function AddCompanyPage() {
	const [form, setForm] = useState({
		firstName: "",
		lastName: "",
		companyName: "",
		email: "",
		phoneNumber: "",
		cellPhone: "",
		address: "",
		city: "",
		state: "",
		postalCode: "",
		country: "",
		notes: "",
	});
	const [companyLogo, setCompanyLogo] = useState<File | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const router = useRouter();

	const handleInputChange = (
		e: ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>
	) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
	};

	const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setCompanyLogo(e.target.files[0]);
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
		if (!form.companyName.trim()) {
			toast.error("Company name is required");
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
		if (!form.address.trim()) {
			toast.error("Address is required");
			return false;
		}
		if (!form.city.trim()) {
			toast.error("City is required");
			return false;
		}
		if (!form.state.trim()) {
			toast.error("State is required");
			return false;
		}
		if (!form.postalCode.trim()) {
			toast.error("Postal code is required");
			return false;
		}
		if (!form.country.trim()) {
			toast.error("Country is required");
			return false;
		}
		return true;
	};

	const handleSubmit = async (e?: FormEvent) => {
		if (e) e.preventDefault();
		if (isSaving) return;
		if (!validate()) return;

		setIsSaving(true);

		const formData = new FormData();
		formData.append("firstName", form.firstName.trim());
		formData.append("lastName", form.lastName.trim());
		formData.append("companyName", form.companyName.trim());
		formData.append("email", form.email.trim());
		formData.append("phoneNumber", form.phoneNumber.trim());
		formData.append("cellPhone", form.cellPhone.trim());
		formData.append("address", form.address.trim());
		formData.append("city", form.city.trim());
		formData.append("state", form.state.trim());
		formData.append("postalCode", form.postalCode.trim());
		formData.append("country", form.country.trim());
		formData.append("notes", form.notes.trim());
		if (companyLogo) {
			formData.append("companyLogo", companyLogo);
		}

		const res = await createCompanyAction(formData);
		const { status, error, errorMessage } = res;
		const isSuccess = status >= 200 && status < 300 && !error;

		if (isSuccess) {
			setShowSuccessModal(true);
		} else {
			toast.error(errorMessage || "Failed to create company");
		}
		setIsSaving(false);
	};

	const handleSaveAndNew = async () => {
		if (isSaving) return;
		if (!validate()) return;

		setIsSaving(true);

		const formData = new FormData();
		formData.append("firstName", form.firstName.trim());
		formData.append("lastName", form.lastName.trim());
		formData.append("companyName", form.companyName.trim());
		formData.append("email", form.email.trim());
		formData.append("phoneNumber", form.phoneNumber.trim());
		formData.append("cellPhone", form.cellPhone.trim());
		formData.append("address", form.address.trim());
		formData.append("city", form.city.trim());
		formData.append("state", form.state.trim());
		formData.append("postalCode", form.postalCode.trim());
		formData.append("country", form.country.trim());
		formData.append("notes", form.notes.trim());
		if (companyLogo) {
			formData.append("companyLogo", companyLogo);
		}

		const res = await createCompanyAction(formData);
		const { status, error, errorMessage } = res;
		const isSuccess = status >= 200 && status < 300 && !error;

		if (isSuccess) {
			toast.success("Company created! Add another...");
			setForm({
				firstName: "",
				lastName: "",
				companyName: "",
				email: "",
				phoneNumber: "",
				cellPhone: "",
				address: "",
				city: "",
				state: "",
				postalCode: "",
				country: "",
				notes: "",
			});
			setCompanyLogo(null);
		} else {
			toast.error(errorMessage || "Failed to create company");
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
								href="/admin/companies"
								className="text-gray-500 hover:text-gray-700 transition-colors"
							>
								<ArrowLeft className="w-5 h-5" />
							</Link>
							<div className="flex items-center gap-2">
								<div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
									<Building2 className="w-4 h-4 text-indigo-600" />
								</div>
								<h1 className="text-2xl font-semibold text-gray-900">
									Add New Company
								</h1>
							</div>
						</div>
						<div className="flex items-center gap-4">
							<Link
								href="/admin/companies"
								className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
							>
								Back to Companies
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
									{isSaving ? "Saving..." : "Save Company"}
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
						encType="multipart/form-data"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									First Name{" "}
									<span className="text-red-500">*</span>
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
									Last Name{" "}
									<span className="text-red-500">*</span>
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
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Company Name{" "}
								<span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								name="companyName"
								required
								className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
								placeholder="Enter company name"
								value={form.companyName}
								onChange={handleInputChange}
							/>
						</div>
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
								Company Logo
							</label>
							<input
								type="file"
								name="companyLogo"
								accept="image/*"
								className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm bg-gray-50"
								onChange={handleFileChange}
							/>
							{companyLogo && (
								<div className="mt-2">
									<img
										src={URL.createObjectURL(companyLogo)}
										alt="Logo Preview"
										className="h-16 w-16 object-contain border rounded"
									/>
								</div>
							)}
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Phone Number{" "}
									<span className="text-red-500">*</span>
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
						</div>
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">
								Address{" "}
								<span className="text-red-500">*</span>
							</label>
							<textarea
								name="address"
								required
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
									City <span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="city"
									required
									className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
									placeholder="Enter city"
									value={form.city}
									onChange={handleInputChange}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									State <span className="text-red-500">*</span>
								</label>
								<select
									name="state"
									required
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
									Postal Code{" "}
									<span className="text-red-500">*</span>
								</label>
								<input
									type="text"
									name="postalCode"
									required
									className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50 focus:bg-white"
									placeholder="Enter postal code"
									value={form.postalCode}
									onChange={handleInputChange}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">
									Country <span className="text-red-500">*</span>
								</label>
								<select
									name="country"
									required
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
								{isSaving ? "Saving..." : "Save Company"}
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
					router.push("/admin/companies");
				}}
				onCancel={() => {}}
				title="Company Created Successfully! 🎉"
				message="Your company has been successfully created and saved to the database."
				confirmText="Go to Companies"
				cancelText=""
				variant="success"
				className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200"
			/>
		</div>
	);
}