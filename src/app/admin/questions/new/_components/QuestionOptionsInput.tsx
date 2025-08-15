"use client";

import { useEffect, useState } from "react";
import { QUESTION_TYPES } from "@/utils/constants";
import { GetQuestionTypesResponse } from "@/utils/api/types";

const QuestionOptionsInput = ({
  questionTypeId,
  questionTypes,
  onDataChange,
}: {
  questionTypeId: number;
  questionTypes: GetQuestionTypesResponse[];
  onDataChange: (data: any) => void;
}) => {
  const [type, setType] = useState<string>();
  const [options, setOptions] = useState<string[]>(["Option 1", "Option 2"]);
  const [correctOptions, setCorrectOptions] = useState<string[]>([]);

  const [matchCols, setMatchCols] = useState<string[][]>([[""], [""]]);
  const [matchAnswer, setMatchAnswer] = useState<any>(
    type === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE ? [[]] : [""]
  );

  const [trueFalseAnswer, setTrueFalseAnswer] = useState<string>("True");
  const [textAnswer, setTextAnswer] = useState<string>("");

  useEffect(() => {
    const qt = questionTypes.find((q) => q.questionTypeId === questionTypeId);
    setType(qt?.questionType);
    
    // Reset states when question type changes
    if (qt?.questionType === QUESTION_TYPES.SINGLE_MCQ || qt?.questionType === QUESTION_TYPES.MULTIPLE_MCQ) {
      setOptions(["Option 1", "Option 2"]);
      setCorrectOptions([]);
    }
  }, [questionTypeId]);

  useEffect(() => {
    if (
      type === QUESTION_TYPES.SINGLE_MCQ ||
      type === QUESTION_TYPES.MULTIPLE_MCQ
    ) {
      onDataChange({ options, answer: correctOptions });
    }
  }, [options, correctOptions]);

  useEffect(() => {
    if (
      type === QUESTION_TYPES.MATCH_PAIRS_SINGLE ||
      type === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE
    ) {
      onDataChange({ options: matchCols, answer: matchAnswer });
    }
  }, [matchCols, matchAnswer]);

  useEffect(() => {
    if (type === QUESTION_TYPES.TRUEFALSE) {
      onDataChange({ options: ["True", "False"], answer: trueFalseAnswer });
    }
  }, [trueFalseAnswer]);

  useEffect(() => {
    if (
      type !== QUESTION_TYPES.MATCH_PAIRS_SINGLE &&
      type !== QUESTION_TYPES.MATCH_PAIRS_MULTIPLE &&
      type !== QUESTION_TYPES.SINGLE_MCQ &&
      type !== QUESTION_TYPES.MULTIPLE_MCQ &&
      type !== QUESTION_TYPES.TRUEFALSE
    ) {
      onDataChange({ answer: textAnswer });
    }
  }, [textAnswer]);

  // MCQ Types
  if (
    type === QUESTION_TYPES.SINGLE_MCQ ||
    type === QUESTION_TYPES.MULTIPLE_MCQ
  ) {
    return (
      <div className="flex flex-col gap-3">
        {options.map((opt, idx) => {
          const optionId = `option-${idx}-${opt}`;
          const isChecked = type === QUESTION_TYPES.SINGLE_MCQ
            ? correctOptions[0] === opt
            : correctOptions.includes(opt);
            
          return (
            <div key={optionId} className="flex items-center gap-2">
              <input
                id={optionId}
                type={type === QUESTION_TYPES.SINGLE_MCQ ? "radio" : "checkbox"}
                name={type === QUESTION_TYPES.SINGLE_MCQ ? "correctOption" : undefined}
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation();
                  
                  if (type === QUESTION_TYPES.SINGLE_MCQ) {
                    setCorrectOptions([opt]);
                  } else if (type === QUESTION_TYPES.MULTIPLE_MCQ) {
                    // Multiple MCQ logic
                    setCorrectOptions(prev => {
                      const updated = [...prev];
                      const i = updated.indexOf(opt);
                      if (i >= 0) {
                        // Remove if already selected
                        updated.splice(i, 1);
                      } else {
                        // Add if not selected
                        updated.push(opt);
                      }
                      return updated;
                    });
                  }
                }}
              />
              <input
                value={opt}
                onChange={(e) => {
                  const newOpts = [...options];
                  const oldOpt = newOpts[idx];
                  newOpts[idx] = e.target.value;

                  // Update correctOptions if this option was selected
                  const newCorrect = [...correctOptions];
                  if (correctOptions.includes(oldOpt)) {
                    const i = newCorrect.indexOf(oldOpt);
                    if (i >= 0) {
                      newCorrect[i] = e.target.value;
                    }
                    setCorrectOptions(newCorrect);
                  }

                  setOptions(newOpts);
                }}
                className="px-3 py-2 border border-gray-300 rounded-xl flex-1"
                placeholder={`Option ${idx + 1}`}
              />
            </div>
          );
        })}
        <div className="flex gap-2">
          <button
            onClick={() => setOptions([...options, `Option ${options.length + 1}`])}
            className="px-6 py-3 rounded-md bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700"
          >
            Add Option
          </button>
        </div>
      </div>
    );
  }

  // Match Pair Types
  if (
    type === QUESTION_TYPES.MATCH_PAIRS_SINGLE ||
    type === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE
  ) {
    const isMultiple = type === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE;

    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-4">
          {[0, 1].map((col) => (
            <div key={col} className="flex flex-col gap-2">
              <h4 className="font-medium">Column {col + 1}</h4>
              {matchCols[col].map((val, idx) => (
                <input
                  key={idx}
                  value={val}
                  onChange={(e) => {
                    const updated = [...matchCols];
                    updated[col][idx] = e.target.value;
                    setMatchCols(updated);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-xl"
                  placeholder={`Value ${idx + 1}`}
                />
              ))}
              <button
                onClick={() => {
                  const updated = [...matchCols];
                  updated[col].push("");
                  setMatchCols(updated);
                }}
                className="px-6 py-3 rounded-md bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700"
              >
                Add Row
              </button>
            </div>
          ))}
        </div>

        {matchCols[0].length > 0 && (
          <div className="mt-4">
            {matchCols[0].map((left, idx) => (
              <div key={idx} className="flex gap-10 items-center">
                <span className="w-12">{left}</span>
                <div className="flex gap-2">
                  {matchCols[1].map((right, jdx) => (
                    <label key={jdx} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={
                          isMultiple
                            ? matchAnswer[idx]?.includes(right)
                            : matchAnswer[idx] === right
                        }
                        onChange={() => {
                          const updated = [...matchAnswer];
                          if (isMultiple) {
                            const list = [...(updated[idx] || [])];
                            const i = list.indexOf(right);
                            if (i >= 0) list.splice(i, 1);
                            else list.push(right);
                            updated[idx] = list;
                          } else {
                            updated[idx] = right;
                          }
                          setMatchAnswer(updated);
                        }}
                      />
                      {right}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // True/False Type
  if (type === QUESTION_TYPES.TRUEFALSE) {
    return (
      <div className="flex flex-col gap-3">
        {["True", "False"].map((val) => (
          <label key={val} className="flex items-center gap-2">
            <input
              type="radio"
              name="trueFalse"
              checked={trueFalseAnswer === val}
              onChange={() => setTrueFalseAnswer(val)}
            />
            {val}
          </label>
        ))}
      </div>
    );
  }

  if (type === QUESTION_TYPES.NUMERIC) {
    return (
      <div className="flex flex-col gap-3">
        <input
          type="text"
          inputMode="decimal"
          pattern="\d*(\.\d*)?"
          className="px-3 py-2 border border-gray-300 rounded-xl"
          value={textAnswer}
          onChange={(e) => {
            const val = e.target.value;
            // allow empty string or valid numeric/float
            if (val === "" || /^\d*\.?\d*$/.test(val)) {
              setTextAnswer(val);
            }
          }}
          placeholder="Enter correct answer"
        />
      </div>
    );
  }

  if (type === QUESTION_TYPES.WRITE_UP) {
    return (
      <div>
        <h1 className="text-gray-700">
          No correct answer can be set for this question type
        </h1>
      </div>
    );
  }

  // Fallback: Text-based answers (Fill in the Blank, Essay, Short, Numeric, etc.)
  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={textAnswer}
        onChange={(e) => setTextAnswer(e.target.value)}
        placeholder="Enter correct answer"
        className="px-3 py-2 border border-gray-300 rounded-xl"
      />
    </div>
  );
};

export default QuestionOptionsInput;
