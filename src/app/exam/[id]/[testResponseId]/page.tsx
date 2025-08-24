"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  GetQuestionByIdResponse,
  GetTestMetaDataResponse,
  SectionsMetaDataInterface,
} from "@/utils/api/types";
import Loader from "@/components/Loader";
import { fetchQuestionByIdAction } from "@/app/actions/exam/questions/getQuestionById";
import ScrollToggleButton from "@/components/ScrollToggleButton";
import { getUserAction } from "@/app/actions/getUser";
import { fetchTestMetaDataAction } from "@/app/actions/exam/questions/getTestMetaData";
import toast from "react-hot-toast";
import Header from "./_components/Header/Header";
import Sidebar from "./_components/Sidebar/Sidebar";
import SubmitExamModal from "./_components/SubmitExamModal";
import { endCandidateSessionAction } from "@/app/actions/exam/session/endCandidateSession";
import { QUESTION_STATUS, QUESTION_TYPES } from "@/utils/constants";
import { submitQuestionAction } from "@/app/actions/exam/session/submitQuestion";
import { signalRClient } from "@/utils/signalR/signalrClient";
import { LogLevel } from "@microsoft/signalr";
import { sendHeartbeatAck } from "@/utils/signalR/calls/heartbeat";
import AssessmentAreaHeader from "./_components/AssessmentArea/_components/Header";
import QuestionArea from "./_components/AssessmentArea/QuestionArea/_components/QuestionArea";
import AnswerArea from "./_components/AssessmentArea/QuestionArea/_components/AnswerArea";
import AssessmentFooter from "./_components/AssessmentArea/_components/Footer";
import SubmitSectionModal from "./_components/SubmitSectionModal";

export default function ExamPage() {
  const { id, testResponseId } = useParams();
  const [loaded, setLoaded] = useState<boolean>(false);

  const [question, setQuestion] = useState<GetQuestionByIdResponse>();
  const [showModal, setShowModal] = useState(false);
  const [showSubmitSectionModal, setSubmitSectionModal] = useState(false);
  const [errorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const router = useRouter();

  const fetchQuestionById = async (questionId: number) => {
    const res = await fetchQuestionByIdAction(questionId);
    const { data, status } = res;
    if (status === 200) {
      setQuestion(data!);
    } else {
      toast.error("Something Went Wrong");
    }
  };

  const handleSubmit = () => setShowModal(true);

  const cancelSubmit = () => setShowModal(false);

  const cancelSubmitSectionModalSubmit = () => setSubmitSectionModal(false);

  useEffect(() => {
    console.log({ id, testResponseId });
  }, [id, testResponseId]);

  const handleNextQuestion = async () => {
    console.log({ question });
    console.log("USER ANSWER: ", question?.options.answer);

    const valid = validateResponse();

    if (valid) {
      const userName = await getUserAction();

      if (userName) {
        const response = await submitQuestionAction(
          Number(testResponseId),
          question?.questionId!,
          question?.options.answer!,
          QUESTION_STATUS.ATTEMPTED,
          "",
          userName
        );

        if (response.status === 200) {
          if (currentSection?.questions[currentIndex + 1]) {
            fetchQuestionById(
              currentSection?.questions[currentIndex + 1].questionId!
            );
            setCurrentIndex(currentIndex + 1);
          } else {
            setSubmitSectionModal(true);
          }
        } else {
          console.log(response.errorMessage);
          toast.error("Something Went Wrong");
        }
      } else {
        toast.error("Something Went Wrong");
      }
    } else {
      toast.error("Provide An Answer");
    }
  };

  useEffect(() => {
    console.log({ question });
  }, [question]);

  const clearResponse = async () => {
    switch (question!.questionsMeta.questionTypeName) {
      case QUESTION_TYPES.SINGLE_MCQ:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            options: {
              ...prev.options,
              answer: JSON.stringify([]),
            },
          };
        });
        break;
      case QUESTION_TYPES.MULTIPLE_MCQ:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            options: {
              ...prev.options,
              answer: JSON.stringify([]),
            },
          };
        });
        break;
      case QUESTION_TYPES.MATCH_PAIRS_SINGLE:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            options: {
              ...prev.options,
              answer: JSON.stringify([]),
            },
          };
        });
        break;
      case QUESTION_TYPES.MATCH_PAIRS_MULTIPLE:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          let emptyArr: string[][] = [];

          JSON.parse(question!.options.options)[0].map(() => {
            emptyArr.push([]);
          });

          return {
            ...prev,
            options: {
              ...prev.options,
              answer: JSON.stringify(emptyArr),
            },
          };
        });
        break;
      case QUESTION_TYPES.WRITE_UP:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            options: {
              ...prev.options,
              answer: "",
            },
          };
        });
        break;
      case QUESTION_TYPES.NUMERIC:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            options: {
              ...prev.options,
              answer: "",
            },
          };
        });
        break;
      case QUESTION_TYPES.TRUEFALSE:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            options: {
              ...prev.options,
              answer: "",
            },
          };
        });
        break;
      case QUESTION_TYPES.FILL_ANSWER:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            options: {
              ...prev.options,
              answer: "",
            },
          };
        });
        break;
    }
  };

  const validateResponse = (): boolean => {
    switch (question!.questionsMeta.questionTypeName) {
      case QUESTION_TYPES.SINGLE_MCQ:
        if (question?.options.answer === "[]") {
          return false;
        }
        break;
      case QUESTION_TYPES.MULTIPLE_MCQ:
        if (question?.options.answer === "[]") {
          return false;
        }
        break;
      case QUESTION_TYPES.MATCH_PAIRS_SINGLE:
        if (question?.options.answer === "[]") {
          return false;
        }
        break;
      case QUESTION_TYPES.MATCH_PAIRS_MULTIPLE:
        if (question?.options.answer === "[]") {
          return false;
        }
        break;
      case QUESTION_TYPES.WRITE_UP:
        if (question?.options.answer === "") {
          return false;
        }
        break;
      case QUESTION_TYPES.NUMERIC:
        if (question?.options.answer === "") {
          return false;
        }
        break;
      case QUESTION_TYPES.TRUEFALSE:
        if (question?.options.answer === "") {
          return false;
        }
        break;
      case QUESTION_TYPES.FILL_ANSWER:
        if (question?.options.answer === "") {
          return false;
        }
        break;
    }

    return true;
  };

  const handleJumpTo = async (index: number, questionId: number) => {
    await fetchQuestionById(questionId);
    setCurrentIndex(index);
  };

  const toggleMarkForReview = async () => {
    // TODO: Implement API here to update question status
    const userName = await getUserAction();

    if (userName) {
      const isValid = validateResponse();

      if (isValid) {
        const response = await submitQuestionAction(
          Number(testResponseId),
          question?.questionId!,
          question?.options.answer!,
          QUESTION_STATUS.ANSWERED_TO_REVIEW,
          "",
          userName
        );

        if (response.status === 200) {
          if (currentSection?.questions[currentIndex + 1]) {
            fetchQuestionById(
              currentSection?.questions[currentIndex + 1].questionId!
            );
            setCurrentIndex(currentIndex + 1);
          } else {
            setSubmitSectionModal(true);
          }
        } else {
          console.log(response.errorMessage);
          toast.error("Something Went Wrong");
        }
      } else {
        const response = await submitQuestionAction(
          Number(testResponseId),
          question?.questionId!,
          question?.options.answer!,
          QUESTION_STATUS.TO_REVIEW,
          "",
          userName
        );

        if (response.status === 200) {
          if (currentSection?.questions[currentIndex + 1]) {
            fetchQuestionById(
              currentSection?.questions[currentIndex + 1].questionId!
            );
            setCurrentIndex(currentIndex + 1);
          } else {
            setSubmitSectionModal(true);
          }
        } else {
          console.log(response.errorMessage);
          toast.error("Something Went Wrong");
        }
      }
    }
  };

  const submitTest = async () => {
    const username = await getUserAction();

    if (!username) {
      toast.error("Something Went Wrong");
    }

    const response = await endCandidateSessionAction(
      Number(testResponseId),
      username!
    );

    if (response.status === 200) {
      const targetUrl = `/dashboard/analytics/${id}`;

      // If this window was opened via window.open(), window.opener points back to the parent
      if (window.opener && !window.opener.closed) {
        // Navigate the parent
        window.opener.location.assign(targetUrl);
        // Then close this popup
        window.close();
      } else {
        // Fallback: same‐window navigation
        router.push(targetUrl);
      }
    } else {
      toast.error("Something Went Wrong");
    }
  };

  // NEW
  const [currentSection, setCurrentSection] =
    useState<SectionsMetaDataInterface | null>(null);
  const [testMetaData, setTestMetaData] =
    useState<GetTestMetaDataResponse | null>(null);

  const fetchTestMetaData = async () => {
    setLoaded(false);
    const userId = await getUserAction();
    if (userId) {
      const res = await fetchTestMetaDataAction(Number(id), Number(userId));
      const { data, status } = res;
      if (status === 200 && data) {
        setTestMetaData(data);
        if (!currentSection) {
          setCurrentSection(data?.sections[0]);
        } else {
          const curSec = data.sections.find(
            (sec) => sec.sectionId === currentSection.sectionId
          );
          setCurrentSection(curSec!);
        }
        setLoaded(true);
      } else {
        setLoaded(true);
        toast.error("Something Went Wrong");
      }
    }
  };

  useEffect(() => {
    if (currentSection) {
      fetchQuestionById(currentSection?.questions[0]?.questionId!);
    }
  }, [currentSection]);

  useEffect(() => {
    console.log({ question });
  }, [question]);

  const handleTimeout = () => {
    // TODO: Handle timeout
  };

  function getCurrentSectionIndex(
    sections: SectionsMetaDataInterface[],
    current: SectionsMetaDataInterface
  ) {
    return sections.findIndex((s) => s.sectionId === current.sectionId);
  }

  const handleSectionTimeout = async () => {
    // Guard: needed data must exist
    if (!testMetaData || !testMetaData.sections?.length || !currentSection) {
      return;
    }

    const { sections } = testMetaData;

    const curIdx = getCurrentSectionIndex(sections, currentSection);
    if (curIdx === -1) {
      // Current section not found in latest metadata; optionally refetch or no-op
      return;
    }

    const isLast = curIdx === sections.length - 1;

    if (isLast) {
      await submitTest();
      return;
    }

    const nextSection = sections[curIdx + 1];
    if (nextSection) {
      setCurrentSection(nextSection);
    }
  };

  const goToNextSection = async () => {
    if (!testMetaData || !testMetaData.sections?.length || !currentSection) {
      return;
    }
    const { sections } = testMetaData;
    const curIdx = getCurrentSectionIndex(sections, currentSection);

    if (curIdx === -1) {
      // Current section not found in latest metadata; optionally refetch or no-op
      return;
    }

    const isLast = curIdx === sections.length - 1;

    if (isLast) {
      handleSubmit();
      return;
    }

    const nextSection = sections[curIdx + 1];
    if (nextSection) {
      setCurrentSection(nextSection);
    }
  };

  useEffect(() => {
    fetchTestMetaData();
  }, []);

  useEffect(() => {
    console.log({ question });
  }, [question]);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function start() {
      // Connect or reuse existing connection
      await signalRClient.connect({
        url: process.env.NEXT_PUBLIC_HUB_URL!,
        logLevel: LogLevel.Information,
        reconnectDelays: [0, 2000, 5000, 10000],
        // accessTokenFactory: async () => "jwt", // if needed
      });

      // Receive server heartbeat event
      const onHeartbeat = async (timestamp: string) => {
        // App-specific logic when server notifies heartbeat
        // Then ack back
        try {
          await sendHeartbeatAck({
            testResponseId: Number(testResponseId),
            clientId: "nextjs-client",
          });
          // eslint-disable-next-line no-console
          console.log("Heartbeat received, ack sent:", timestamp);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Ack failed", err);
        }
      };

      // Register handler
      signalRClient.on<[string]>("Heartbeat", onHeartbeat);

      // Optional: proactively ping every 2 minutes (example),
      // only if you also have a server method expecting it.
      // Replace "ClientHeartbeat" with your hub method if you need this.
      const TWO_MIN = 2 * 60 * 1000;
      if (intervalRef.current == null) {
        intervalRef.current = window.setInterval(async () => {
          // If you have a server method to record a client-side heartbeat:
          // await signalRClient.send("ClientHeartbeat", testResponseId, Date.now());
          // eslint-disable-next-line no-console
          console.log("Proactive client heartbeat tick");
        }, TWO_MIN);
      }

      // Cleanup registration on unmount
      return () => {
        signalRClient.off("Heartbeat", onHeartbeat);
      };
    }

    start().catch((err) => {
      // eslint-disable-next-line no-console
      console.error("SignalR connection error", err);
    });

    return () => {
      // Remove proactive interval
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // If this screen owns the connection lifecycle, you can also disconnect here.
      // If multiple pages share the same singleton connection, you might choose to leave it connected.
      // For exam-only usage, it's reasonable to stop on unmount:
      signalRClient.disconnect().catch(() => {});
      isMounted = false;
    };
  }, [testResponseId]);

  if (!loaded) {
    return <Loader />;
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      {testMetaData && (
        <Header
          data={testMetaData!}
          onTestTimeUp={handleTimeout}
          onSectionTimeUp={handleSectionTimeout}
          durationMs={Math.max(
            0,
            Math.floor(Number(testMetaData?.testMeta.testDuration)) * 60_000
          )}
          currentSectionId={currentSection!}
          setCurrentSection={setCurrentSection}
        />
      )}

      {/* Test Area */}
      <div className="w-full h-full overflow-auto flex flex-row pb-9">
        {/* Main */}
        <main className="w-full flex-1 p-2 flex flex-col gap-2 relative overflow-y-auto">
          <div className="w-full h-full">
            {question && (
              <div className="w-full h-full bg-white rounded-md shadow-md border border-gray-300 flex flex-col justify-between flex-1">
                <div className="w-full h-full overflow-hidden border-b border-b-gray-300 px-4 py-2">
                  <AssessmentAreaHeader
                    question={question}
                    currentIndex={currentIndex}
                  />
                  <div className="w-full h-full flex gap-5 pt-2">
                    <div className="relative w-3/4 h-full border-r border-r-gray-300">
                      <QuestionArea question={question} />
                    </div>
                    {errorMessage && (
                      <div className="mb-4 text-sm text-red-600 font-medium">
                        {errorMessage}
                      </div>
                    )}
                    <div className="relative w-1/4">
                      <AnswerArea
                        question={question}
                        setQuestion={setQuestion}
                      />
                      <ScrollToggleButton containerSelector="#answerBox" />
                    </div>
                  </div>
                </div>
                <AssessmentFooter
                  clearResponse={clearResponse}
                  handleNextQuestion={handleNextQuestion}
                  toggleMarkForReview={toggleMarkForReview}
                />
              </div>
            )}
          </div>
        </main>

        {/* Sidebar */}
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          questionsMeta={currentSection?.questions!}
          handleSubmit={handleSubmit}
          handleJumpTo={handleJumpTo}
          currentIndex={currentIndex}
        />
      </div>

      {/* Modals */}
      <SubmitExamModal
        sections={testMetaData?.sections!}
        showModal={showModal}
        confirmSubmit={submitTest}
        cancelSubmit={cancelSubmit}
      />

      <SubmitSectionModal
        sections={testMetaData?.sections!}
        showModal={showSubmitSectionModal}
        confirmSubmit={() => {
          goToNextSection();
          setSubmitSectionModal(false);
        }}
        cancelSubmit={cancelSubmitSectionModalSubmit}
        currentSectionId={currentSection?.sectionId}
      />
    </div>
  );
}
