import { fetchInstructionsAction } from "@/app/actions/admin/tests/fetchInstructions";
import { fetchDifficultyLevelsAction } from "@/app/actions/dashboard/questions/fetchDifficultyLevels";
import {
  GetDifficultyLevelsResponse,
  GetInstructionsResponse,
} from "@/utils/api/types";
import { useEffect, useState } from "react";

export default function TestConfiguration({
  testConfiguration,
  handleChange,
}: {
  testConfiguration: any;
  handleChange: any;
}) {
  const [difficultyLevels, setDifficultyLevels] = useState<
    GetDifficultyLevelsResponse[]
  >([]);
  const [instructions, setInstructions] = useState<GetInstructionsResponse[]>(
    []
  );

  const fetchDifficultyLevels = async () => {
    const res = await fetchDifficultyLevelsAction();
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setDifficultyLevels(data!);
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  const fetchInstructions = async (language: string) => {
    const res = await fetchInstructionsAction(language);
    const { data, status, error, errorMessage } = res;
    if (status === 200) {
      setInstructions(data!);
    } else {
      console.log({ status, error, errorMessage });
    }
  };

  useEffect(() => {
    fetchDifficultyLevels();
    fetchInstructions("english");
  }, []);

  useEffect(() => {
    console.log({ instructions });
  }, [instructions]);

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Test Name</label>
          <input
            name="testName"
            value={testConfiguration.testName}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
            placeholder="Enter test name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Test Type</label>
          <select
            name="testType"
            value={testConfiguration.testType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
          >
            <option value="">Select one</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Test Code</label>
          <input
            name="testCode"
            value={testConfiguration.testCode}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
            placeholder="e.g., TST123"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            name="category"
            value={testConfiguration.category}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
          >
            <option value="">Select category</option>
            <option value="math">Math</option>
            <option value="science">Science</option>
          </select>
        </div>

        {/* <div>
          <label className="block text-sm font-medium mb-1">Instructions</label>
          <select
            name="instructions"
            value={testConfiguration.instructions}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
          >
            <option value="">Select instructions</option>
            <option value="none">None</option>
            <option value="readAll">Read all questions carefully</option>
          </select>
        </div> */}

        <div>
          <label className="block text-sm font-medium mb-1">Instructions</label>
          <select
            name="instructions"
            value={testConfiguration.instructions}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
          >
            <option value="">Select instructions</option>
            {instructions.map((instruction) => {
              return (
                <option
                  key={instruction.testInstructionId}
                  value={instruction.testInstructionId}
                >
                  {instruction.testInstructionName}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Duration (min)
          </label>
          <input
            type="number"
            name="duration"
            value={testConfiguration.duration}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Handicapped Duration (min)
          </label>
          <input
            type="number"
            name="handicappedDuration"
            value={testConfiguration.handicappedDuration}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Total Questions
          </label>
          <input
            type="number"
            name="totalQuestions"
            value={testConfiguration.totalQuestions}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Total Marks</label>
          <input
            type="number"
            name="totalMarks"
            value={testConfiguration.totalMarks}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Difficulty</label>
          <select
            name="difficulty"
            value={testConfiguration.difficulty}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
          >
            <option value="">Select difficulty</option>
            {difficultyLevels.map((dif) => {
              return (
                <option
                  key={dif.questionDifficultylevelId}
                  value={dif.questionDifficultylevelId}
                >
                  {dif.questionDifficultylevel1}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Secondary Test Type
          </label>
          <select
            name="secondaryTestType"
            value={testConfiguration.secondaryTestType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2"
          >
            <option value="">Select</option>
            <option value="mock">Mock</option>
            <option value="final">Final</option>
          </select>
        </div>
      </div>
    </div>
  );
}
