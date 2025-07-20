"use client";

import { useEffect, useState } from "react";
import { QUESTION_TYPES } from "@/utils/constants";

const QuestionOptionsInput = ({
  type,
  onDataChange,
}: {
  type: string;
  onDataChange: (data: any) => void;
}) => {
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [correctOptions, setCorrectOptions] = useState<string[]>([]);

  const [matchCols, setMatchCols] = useState<string[][]>([[""], [""]]);
  const [matchAnswer, setMatchAnswer] = useState<any>(
    type === QUESTION_TYPES.MATCH_PAIRS_MULTIPLE ? [[]] : [""]
  );

  const [trueFalseAnswer, setTrueFalseAnswer] = useState<string>("True");
  const [textAnswer, setTextAnswer] = useState<string>("");

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
        <h3 className="font-semibold">Options</h3>
        {options.map((opt, idx) => (
          <label key={idx} className="flex items-center gap-2">
            <input
              type={type === QUESTION_TYPES.SINGLE_MCQ ? "radio" : "checkbox"}
              name="correctOption"
              checked={
                type === QUESTION_TYPES.SINGLE_MCQ
                  ? correctOptions[0] === opt
                  : correctOptions.includes(opt)
              }
              onChange={() => {
                if (type === QUESTION_TYPES.SINGLE_MCQ) {
                  setCorrectOptions([opt]);
                } else {
                  const updated = [...correctOptions];
                  const i = updated.indexOf(opt);
                  if (i >= 0) updated.splice(i, 1);
                  else updated.push(opt);
                  setCorrectOptions(updated);
                }
              }}
            />
            <input
              value={opt}
              onChange={(e) => {
                const newOpts = [...options];
                newOpts[idx] = e.target.value;

                const newCorrect = [...correctOptions];
                if (correctOptions.includes(opt)) {
                  const i = newCorrect.indexOf(opt);
                  newCorrect[i] = e.target.value;
                  setCorrectOptions(newCorrect);
                }

                setOptions(newOpts);
              }}
              className="px-3 py-2 border border-gray-300 rounded-xl flex-1"
              placeholder={`Option ${idx + 1}`}
            />
          </label>
        ))}
        <div className="flex gap-2">
          <button
            onClick={() => setOptions([...options, ""])}
            className="px-4 py-2 font-bold bg-indigo-500 text-white rounded-xl cursor-pointer text-sm"
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
        <h3 className="font-semibold">Match Pairs</h3>
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
                className="px-2 py-1 bg-indigo-500 text-white rounded-xl text-sm"
              >
                Add Row
              </button>
            </div>
          ))}
        </div>

        {matchCols[0].length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold">Correct Answer</h4>
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
        <h3 className="font-semibold">True/False</h3>
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
        <h3 className="font-semibold">Correct Answer</h3>
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
      <h3 className="font-semibold">Correct Answer</h3>
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
