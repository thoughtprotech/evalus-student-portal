"use client";

import { useState } from "react";

export default function Step5AssignTest() {
	const [search, setSearch] = useState("");
	const [group, setGroup] = useState("");
	const [status, setStatus] = useState("");

	return (
		<div className="space-y-4">
			<div className="text-sm font-semibold text-gray-800">Check Candidates</div>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-800 mb-1">Search</label>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Name / Email / Code"
						className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
					/>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-800 mb-1">Group</label>
					<select
						value={group}
						onChange={(e) => setGroup(e.target.value)}
						className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
					>
						<option value="">All</option>
						<option value="A">Group A</option>
						<option value="B">Group B</option>
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-800 mb-1">Status</label>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value)}
						className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
					>
						<option value="">Any</option>
						<option value="active">Active</option>
						<option value="inactive">Inactive</option>
					</select>
				</div>
			</div>
			{/* Placeholder table/list */}
			<div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">
				Candidate list will appear here.
			</div>
		</div>
	);
}

