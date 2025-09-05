import clsx from "clsx";

export default function AssessmentFooter({
  handleNextQuestion,
  toggleMarkForReview,
  clearResponse,
}: {
  handleNextQuestion: any;
  toggleMarkForReview: any;
  clearResponse: any;
}) {
  return (
    <div className="flex flex-col md:flex md:flex-row items-center justify-between px-4 py-2">
      <div className="w-full flex gap-3">
        <button
          onClick={toggleMarkForReview}
          className={clsx(
            "w-full md:w-fit px-4 py-1 rounded-md font-medium cursor-pointer bg-white hover:bg-gray-200 border border-gray-300 text-sm"
          )}
        >
          Mark For Review & Next
          {/* {question. === "review" ||
                        question.status === "answeredMarkedForReview"
                          ? "Unmark Review"
                          : currentIndex < question.length - 1
                          ? "Mark For Review & Next"
                          : "Mark For Review"} */}
        </button>
        <button
          onClick={clearResponse}
          className={clsx(
            "w-full md:w-fit px-4 py-1 rounded-md font-medium cursor-pointer bg-white hover:bg-gray-200 border border-gray-300 text-sm"
          )}
        >
          Clear Response
        </button>
      </div>

      <div className="w-full md:w-fit flex gap-3">
        {/* <div className="w-full md:w-fit">
                        <button
                          onClick={handlePreviousQuestion}
                          disabled={currentIndex === 0}
                          className={clsx(
                            "w-full md:w-fit px-6 py-1 rounded-md font-medium text-white transition cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
                          )}
                        >
                          Previous
                        </button>
                      </div> */}
        {/* {currentIndex + 1 === currentSection?.questions.length ? (
                      <div className="w-full md:w-fit">
                        <button
                          onClick={handleSubmit}
                          className="w-full text-nowrap px-6 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded-md font-medium cursor-pointer mb-16 md:mb-0 text-sm"
                        >
                          Submit Test
                        </button>
                      </div>
                    ) : ( */}
        <div className="w-full md:w-fit">
          <button
            onClick={handleNextQuestion}
            // disabled={
            //   currentIndex + 1 === currentSection?.questions.length
            // }
            className={clsx(
              "w-full md:w-fit px-6 py-1 rounded-md font-medium text-white transition cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500 whitespace-nowrap text-sm"
            )}
          >
            Save & Next
          </button>
        </div>
        {/* )} */}
      </div>
    </div>
  );
}
