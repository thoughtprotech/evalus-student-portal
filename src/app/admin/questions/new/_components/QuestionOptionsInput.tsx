"use client";

import { useEffect, useState } from "react";
import { QUESTION_TYPES } from "@/utils/constants";
import { GetQuestionTypesResponse } from "@/utils/api/types";

const QuestionOptionsInput = ({
  questionTypeId,
  questionTypes,
  onDataChange,
  initialData,
}: {
  questionTypeId: number;
  questionTypes: GetQuestionTypesResponse[];
  onDataChange: (data: any) => void;
  initialData?: { options: any; answer: any };
}) => {
  const [type, setType] = useState<string>();
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctOptionIndices, setCorrectOptionIndices] = useState<number[]>([]);

  const [matchCols, setMatchCols] = useState<string[][]>([[""], [""]]);
  const [matchAnswer, setMatchAnswer] = useState<any>(
    type === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE ? [[]] : [""]
  );

  const [trueFalseAnswer, setTrueFalseAnswer] = useState<string>("");
  const [textAnswer, setTextAnswer] = useState<string>("");

  // Track whether we've applied initialData to avoid overriding user edits
  const [appliedInitial, setAppliedInitial] = useState(false);

  useEffect(() => {
    const qt = questionTypes.find((q) => q.questionTypeId === questionTypeId);
    const newType = qt?.questionType;
    setType(newType);

    // Reset defaults when changing type (new question or user switched type)
    if (!appliedInitial) {
      if (newType === QUESTION_TYPES.SINGLE_MCQ || newType === QUESTION_TYPES.MULTIPLE_MCQ) {
        setOptions(["", ""]);
        setCorrectOptionIndices([]);
      } else if (newType === QUESTION_TYPES.MATCH_PAIRS_SINGLE || newType === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE) {
        setMatchCols([[""], [""]]);
        setMatchAnswer(newType === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE ? [[]] : [""]);
      } else if (newType === QUESTION_TYPES.TRUEFALSE) {
        setTrueFalseAnswer("");
      } else {
        setTextAnswer("");
      }
    }

    // Apply initial data once type is known
    if (initialData && newType && !appliedInitial) {
      try {
        if (newType === QUESTION_TYPES.SINGLE_MCQ || newType === QUESTION_TYPES.MULTIPLE_MCQ) {
          const opts: string[] = Array.isArray(initialData.options?.options) ? initialData.options.options : Array.isArray(initialData.options) ? initialData.options : [];
          const ans: string[] = Array.isArray(initialData.answer) ? initialData.answer : [];
            if (opts.length) setOptions(opts.slice());
            // Derive indices
            const indices = ans.map(a => opts.findIndex(o => o === a)).filter(i => i >= 0);
            setCorrectOptionIndices(newType === QUESTION_TYPES.SINGLE_MCQ ? indices.slice(0,1) : indices);
        } else if (newType === QUESTION_TYPES.MATCH_PAIRS_SINGLE) {
          const left: string[] = initialData.options?.left || initialData.options?.[0] || [];
          const right: string[] = initialData.options?.right || initialData.options?.[1] || [];
          setMatchCols([left.length? left: [""], right.length? right: [""]]);
          // answer as pairs [[l,r]]
          const pairs: [string,string][] = Array.isArray(initialData.answer)? initialData.answer: [];
          const ansByIndex = left.map(l => pairs.find(p=> p[0]===l)?.[1] || "");
          setMatchAnswer(ansByIndex);
        } else if (newType === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE) {
          const left: string[] = initialData.options?.left || initialData.options?.[0] || [];
          const right: string[] = initialData.options?.right || initialData.options?.[1] || [];
          setMatchCols([left.length? left: [""], right.length? right: [""]]);
          const ansMatrix: any[] = Array.isArray(initialData.answer)? initialData.answer: [];
          setMatchAnswer(ansMatrix);
        } else if (newType === QUESTION_TYPES.TRUEFALSE) {
          const ans: string[] = Array.isArray(initialData.answer)? initialData.answer: [];
          setTrueFalseAnswer(ans[0] || "");
        } else if (newType === QUESTION_TYPES.NUMERIC || newType === QUESTION_TYPES.FILL_ANSWER || newType === QUESTION_TYPES.WRITE_UP) {
          const ans = Array.isArray(initialData.answer)? initialData.answer[0]: initialData.answer;
          setTextAnswer(ans ?? "");
        } else {
          // Generic
          const ans = Array.isArray(initialData.answer)? initialData.answer[0]: initialData.answer;
          setTextAnswer(ans ?? "");
        }
        setAppliedInitial(true);
      } catch { /* ignore */ }
    }
  }, [questionTypeId, questionTypes, initialData, appliedInitial]);

  // When switching to True/False, emit default options immediately with empty answer array
  useEffect(() => {
    if (type === QUESTION_TYPES.TRUEFALSE) {
      onDataChange({ options: ["True", "False"], answer: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    if (
      type === QUESTION_TYPES.SINGLE_MCQ ||
      type === QUESTION_TYPES.MULTIPLE_MCQ
    ) {
      // Clean up invalid indices (in case options were removed)
      const validIndices = correctOptionIndices.filter(idx => idx < options.length);
      if (validIndices.length !== correctOptionIndices.length) {
        setCorrectOptionIndices(validIndices);
      }
      
      // Convert indices back to actual option values
      const correctOptionsTexts = validIndices.map(idx => options[idx]).filter(Boolean);
      onDataChange({ options, answer: correctOptionsTexts });
    }
  }, [options, correctOptionIndices]);

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
      const ansArr = trueFalseAnswer ? [trueFalseAnswer] : [];
      onDataChange({ options: ["True", "False"], answer: ansArr });
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
          const optionId = `option-${idx}`;
          const isChecked = type === QUESTION_TYPES.SINGLE_MCQ
            ? correctOptionIndices[0] === idx
            : correctOptionIndices.includes(idx);
            
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
                    setCorrectOptionIndices([idx]);
                  } else if (type === QUESTION_TYPES.MULTIPLE_MCQ) {
                    // Multiple MCQ logic
                    setCorrectOptionIndices(prev => {
                      const updated = [...prev];
                      const i = updated.indexOf(idx);
                      if (i >= 0) {
                        // Remove if already selected
                        updated.splice(i, 1);
                      } else {
                        // Add if not selected
                        updated.push(idx);
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
                  newOpts[idx] = e.target.value;
                  setOptions(newOpts);
                  
                  // No need to update correctOptionIndices since we're using indices, not text values
                }}
                className="px-3 py-2 border border-gray-300 rounded-xl flex-1"
                placeholder={`Option ${idx + 1}`}
              />
            </div>
          );
        })}
        <div className="flex gap-2">
          <button
            onClick={() => setOptions([...options, ""])}
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
