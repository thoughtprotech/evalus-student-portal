"use client";

import ImportantInstructions from "@/components/ImportantInstructions";
import { useRouter } from "next/navigation";
import { Key, MousePointerClick, FileSpreadsheet, FilePlus2 } from "lucide-react";

export default function Step3AddQuestions() {
	const router = useRouter();

	const handleSelectQuestions = () => {
		// TODO: Route to question bank selection when available
		router.push("/admin/tests/new/questions/select");
	};

	const handleAddQuestions = () => {
		// TODO: Route to manual add questions when available
		router.push("/admin/tests/new/questions/add");
	};

	return (
		<div className="w-full">
			<div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
						{/* Left: Cards (3 cols on large; 4th card wraps to next row) */}
				<div className="lg:col-span-3">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{/* Card: Passkey (placeholder/inactive) */}
						<div className="rounded-md border bg-gray-50">
							<div className="p-8 text-center">
										<Key className="mx-auto mb-4 h-16 w-16 text-gray-400" strokeWidth={1.5} />
								<p className="text-sm text-gray-600">
									This is to associate new questions in the created test. You can
									create questions of type: multiple choice, multiple options,
									true/false, fill in the blanks, match following and match
									matrix.
								</p>
							</div>
							<div className="px-4 pb-4">
								<button disabled className="w-full rounded bg-green-400/60 text-white py-2 text-sm cursor-not-allowed">
									Add With Passkey
								</button>
							</div>
						</div>

						{/* Card: Select Questions (active) */}
						<div className="rounded-md border bg-gray-50">
							<div className="p-8 text-center">
										<MousePointerClick className="mx-auto mb-4 h-16 w-16 text-gray-400" strokeWidth={1.5} />
								<p className="text-sm text-gray-600">
									Directly add questions from the question bank. The selected set
									of questions will be associated to the test.
								</p>
							</div>
							<div className="px-4 pb-4">
								<button onClick={handleSelectQuestions} className="w-full rounded bg-green-600 hover:bg-green-700 text-white py-2 text-sm">
											Select Question
								</button>
							</div>
						</div>

						{/* Card: Import (placeholder/inactive) */}
						<div className="rounded-md border bg-gray-50">
							<div className="p-8 text-center">
										<FileSpreadsheet className="mx-auto mb-4 h-16 w-16 text-gray-400" strokeWidth={1.5} />
								<p className="text-sm text-gray-600">
									Add questions via importing an Excel sheet. Import numerous
									questions in a single go.
								</p>
							</div>
							<div className="px-4 pb-4">
								<button disabled className="w-full rounded bg-green-400/60 text-white py-2 text-sm cursor-not-allowed">
									Select Import Type
								</button>
							</div>
						</div>

								{/* Card: Add Questions (active) */}
								<div className="rounded-md border bg-gray-50">
									<div className="p-8 text-center">
										<FilePlus2 className="mx-auto mb-4 h-16 w-16 text-gray-400" strokeWidth={1.5} />
										<p className="text-sm text-gray-600">
											This is to associate new questions in the created test. You can
											create questions of type: multiple choice, multiple options,
											true/false, fill in the blanks, match following and match
											matrix.
										</p>
									</div>
									<div className="px-4 pb-4">
										<button onClick={handleAddQuestions} className="w-full rounded bg-green-600 hover:bg-green-700 text-white py-2 text-sm">
											Add Questions
										</button>
									</div>
								</div>
					</div>
				</div>

				{/* Right: Important Instructions */}
				<div className="lg:col-span-1">
					<ImportantInstructions
						title="Important Instructions"
						detail="This is to add questions in a created test. You can add questions using three methods: 1) Select predefined questions using question bank, 2) Import an excel sheet, incorporating multiple questions in one go, 3) Add new questions as per the user requirement."
					/>
				</div>
			</div>
		</div>
	);
}

