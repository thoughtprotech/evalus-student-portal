"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useExamMode } from "@/hooks/useExamMode";
import {
  GetQuestionByIdResponse,
  GetTestMetaDataResponse,
  QuestionsMetaDataInterface,
  SectionsMetaDataInterface,
} from "@/utils/api/types";
import Loader from "@/components/Loader";
import { getUserAction } from "@/app/actions/getUser";
import { fetchTestMetaDataAction } from "@/app/actions/exam/questions/getTestMetaData";
import toast from "react-hot-toast";
import { endCandidateSessionAction } from "@/app/actions/exam/session/endCandidateSession";
import {
  QUESTION_STATUS,
  QUESTION_TYPES,
  TEST_TEMPLATE_MAPPING,
} from "@/utils/constants";
import { submitQuestionAction } from "@/app/actions/exam/session/submitQuestion";
import { signalRClient } from "@/utils/signalR/signalrClient";
import { LogLevel } from "@microsoft/signalr";
import { sendHeartbeatAck } from "@/utils/signalR/calls/heartbeat";
import DefaultTemplate from "./templates/default/page";
import SSCTemplate from "./templates/ssc/page";

export default function ExamPage() {
  const { id, testResponseId } = useParams();

  // Prevent auto-logout during exam
  useExamMode();

  const [loaded, setLoaded] = useState<boolean>(false);

  const [question, setQuestion] = useState<QuestionsMetaDataInterface>();
  const [showModal, setShowModal] = useState(false);
  const [showSubmitSectionModal, setSubmitSectionModal] = useState(false);
  const [errorMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const router = useRouter();

  // const fetchQuestionById = async (questionId: number) => {
  //   const res = await fetchSessionQuestionByIdAction(
  //     questionId,
  //     Number(testResponseId)
  //   );
  //   const { data, status } = res;
  //   if (status === 200) {
  //     setQuestion(data!);
  //   } else {
  //     toast.error("Something Went Wrong");
  //   }
  // };

  const handleSubmit = () => setShowModal(true);

  const cancelSubmit = () => setShowModal(false);

  const cancelSubmitSectionModalSubmit = () => setSubmitSectionModal(false);

  const handleNextQuestion = async () => {
    if (!question?.answer) {
      return toast.error("Provide An Answer");
    }

    const valid = validateResponse();

    if (valid) {
      const userName = await getUserAction();
      let status;

      if (question.status === QUESTION_STATUS.TO_REVIEW) {
        status = QUESTION_STATUS.TO_REVIEW;
      } else {
        status = QUESTION_STATUS.ATTEMPTED;
      }

      if (userName) {
        const response = await submitQuestionAction(
          testMetaData?.testMeta.testId!,
          Number(testResponseId),
          question?.questionId!,
          question?.answer!,
          status,
          "",
          userName
        );

        if (response.status === 202) {
          await fetchTestMetaData();
          if (currentSection?.questions[currentIndex + 1]) {
            // fetchQuestionById(
            //   currentSection?.questions[currentIndex + 1].questionId!
            // );
            setCurrentIndex(currentIndex + 1);
            setQuestion(currentSection?.questions[currentIndex + 1]);
          } else {
            setSubmitSectionModal(true);
          }
        } else {
          toast.error("Something Went Wrong");
        }
      } else {
        toast.error("Something Went Wrong");
      }
    } else {
      toast.error("Provide An Answer");
    }
  };

  const handlePreviousQuestion = async () => {
    const userName = await getUserAction();
    if (!currentSection?.questions[currentIndex - 1]) {
      return;
    }

    if (userName) {
      const response = await submitQuestionAction(
        testMetaData?.testMeta.testId!,
        Number(testResponseId),
        question?.questionId!,
        question?.answer!,
        QUESTION_STATUS.ATTEMPTED,
        "",
        userName
      );

      if (response.status === 202) {
        // fetchQuestionById(
        //   currentSection?.questions[currentIndex - 1].questionId!
        // );
        setCurrentIndex(currentIndex - 1);

        setQuestion(currentSection?.questions[currentIndex - 1]);
      } else {
        toast.error("Something Went Wrong");
      }
      fetchTestMetaData();
    } else {
      toast.error("Something Went Wrong");
    }
  };

  const clearResponse = async () => {
    if (!validateResponse()) return;
    let nextAnswerSerialized: string;
    switch (question!.questionType) {
      case QUESTION_TYPES.SINGLE_MCQ:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            answer: JSON.stringify([]),
          };
        });
        nextAnswerSerialized = JSON.stringify([]);
        break;
      case QUESTION_TYPES.MULTIPLE_MCQ:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            answer: JSON.stringify([]),
          };
        });
        nextAnswerSerialized = JSON.stringify([]);
        break;
      case QUESTION_TYPES.MATCH_PAIRS_SINGLE:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            answer: JSON.stringify([]),
          };
        });
        nextAnswerSerialized = JSON.stringify([]);
        break;
      case QUESTION_TYPES.MATCH_PAIRS_MULTIPLE:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          let emptyArr: string[][] = [];

          JSON.parse(question!.options)[0].map(() => {
            emptyArr.push([]);
          });
          nextAnswerSerialized = JSON.stringify(emptyArr);

          return {
            ...prev,
            answer: JSON.stringify(emptyArr),
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
            answer: "",
          };
        });
        nextAnswerSerialized = JSON.stringify("");
        break;
      case QUESTION_TYPES.NUMERIC:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            answer: "",
          };
        });
        nextAnswerSerialized = JSON.stringify("");
        break;
      case QUESTION_TYPES.TRUEFALSE:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            answer: "",
          };
        });
        nextAnswerSerialized = JSON.stringify("");
        break;
      case QUESTION_TYPES.FILL_ANSWER:
        setQuestion((prev) => {
          if (!prev) {
            return prev;
          }

          return {
            ...prev,
            answer: "",
          };
        });
        nextAnswerSerialized = JSON.stringify("");
        break;
    }

    const userName = await getUserAction();

    if (userName) {
      const response = await submitQuestionAction(
        testMetaData?.testMeta.testId!,
        Number(testResponseId),
        question?.questionId!,
        nextAnswerSerialized!,
        QUESTION_STATUS.UNATTEMPTED,
        "",
        userName
      );

      if (response.status === 202) {
        fetchTestMetaData();
        // fetchQuestionById(question?.questionId!);
      } else {
        toast.error("Something Went Wrong");
      }
    } else {
      toast.error("Something Went Wrong");
    }
  };

  const validateResponse = (): boolean => {
    switch (question!.questionType) {
      case QUESTION_TYPES.SINGLE_MCQ:
        if (question?.answer === "[]") {
          return false;
        }
        break;
      case QUESTION_TYPES.MULTIPLE_MCQ:
        if (question?.answer === "[]") {
          return false;
        }
        break;
      case QUESTION_TYPES.MATCH_PAIRS_SINGLE:
        if (question?.answer === "[]") {
          return false;
        }
        break;
      case QUESTION_TYPES.MATCH_PAIRS_MULTIPLE:
        if (question?.answer === "[]") {
          return false;
        }
        break;
      case QUESTION_TYPES.WRITE_UP:
        if (question?.answer === "") {
          return false;
        }
        break;
      case QUESTION_TYPES.NUMERIC:
        if (question?.answer === "") {
          return false;
        }
        break;
      case QUESTION_TYPES.TRUEFALSE:
        if (question?.answer === "") {
          return false;
        }
        break;
      case QUESTION_TYPES.FILL_ANSWER:
        if (question?.answer === "") {
          return false;
        }
        break;
    }

    if (!question?.answer) {
      return false;
    }

    return true;
  };

  const handleJumpTo = async (index: number, questionId: number) => {
    // await fetchQuestionById(questionId);
    setCurrentIndex(index);
    fetchTestMetaData();
    setQuestion(currentSection?.questions[index]);
  };

  const toggleMarkForReview = async () => {
    // TODO: Implement API here to update question status
    const userName = await getUserAction();

    if (userName) {
      const isValid = validateResponse();
      let status;
      if (question?.status === QUESTION_STATUS.TO_REVIEW) {
        status = QUESTION_STATUS.ATTEMPTED;
      } else {
        status = QUESTION_STATUS.TO_REVIEW;
      }

      // if (isValid) {
      const response = await submitQuestionAction(
        testMetaData?.testMeta.testId!,
        Number(testResponseId),
        question?.questionId!,
        question?.answer!,
        status,
        "",
        userName
      );

      if (response.status === 202) {
        // if (currentSection?.questions[currentIndex + 1]) {
        //   // fetchQuestionById(
        //   //   currentSection?.questions[currentIndex + 1].questionId!
        //   // );
        //   setCurrentIndex(currentIndex + 1);
        // } else {
        //   setSubmitSectionModal(true);
        // }
        await fetchTestMetaData();
        if (currentSection) {
          setQuestion(currentSection.questions[currentIndex]);
        }
      } else {
        toast.error("Something Went Wrong");
      }
      // fetchTestMetaData();
      // } else {
      //   const response = await submitQuestionAction(
      //     testMetaData?.testMeta.testId!,
      //     Number(testResponseId),
      //     question?.questionId!,
      //     question?.answer!,
      //     QUESTION_STATUS.TO_REVIEW,
      //     "",
      //     userName
      //   );

      //   if (response.status === 202) {
      //     // if (currentSection?.questions[currentIndex + 1]) {
      //     //   // fetchQuestionById(
      //     //   //   currentSection?.questions[currentIndex + 1].questionId!
      //     //   // );
      //     //   setCurrentIndex(currentIndex + 1);
      //     // } else {
      //     //   setSubmitSectionModal(true);
      //     // }
      //     fetchTestMetaData();
      //   } else {
      //     toast.error("Something Went Wrong");
      //   }
      // }
    }
  };

  const submitTest = async () => {
    const username = await getUserAction();
    if (!username) {
      toast.error("Something Went Wrong");
      return;
    }
    if (!testMetaData?.testMeta?.testId) {
      toast.error("Test not ready");
      return;
    }
    const response = await endCandidateSessionAction(
      testMetaData.testMeta.testId,
      username
    );

    if (response.status === 200) {
      const targetUrl = `/dashboard`;

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
    const userName = await getUserAction();
    if (!userName) {
      toast.error("Unable to determine user");
      return;
    }

    const res = await fetchTestMetaDataAction(
      Number(id),
      Number(testResponseId),
      userName
    );
    const { data, status } = res;
    if (status === 200 && data) {
      setTestMetaData(data);
      if (!currentSection) {
        setCurrentSection(data?.sections[0]);
        // fetchQuestionById(data?.sections[0].questions[0].questionId);
        if (!question) {
          setQuestion(data?.sections[0].questions[0]);
        }
      } else {
        const curSec = data.sections.find(
          (sec) => sec.sectionId === currentSection.sectionId
        );
        setCurrentSection(curSec!);
        const qs = curSec?.questions.find(
          (q) => q.questionId === question?.questionId
        );
        // setQuestion(currentSection.questions[currentIndex]);
        // fetchQuestionById(question!.questionId);
      }
      setLoaded(true);
    } else {
      setLoaded(true);
      toast.error("Something Went Wrong");
    }
  };

  // useEffect(() => {
  //   if (currentSection) {
  //     if (question) {
  //       fetchQuestionById(question.questionId!);
  //     } else {
  //       fetchQuestionById(currentSection?.questions[0]?.questionId!);
  //     }
  //   }
  // }, []);

  const handleTimeout = async () => {
    await submitTest();
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
      // fetchQuestionById(nextSection?.questions[0]?.questionId!);
      setCurrentIndex(0);
      setQuestion(nextSection?.questions[0]);
    }
  };

  useEffect(() => {
    fetchTestMetaData();
  }, []);

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
    <div className="w-full h-full">
      {testMetaData?.testMeta.testTemplateName === TEST_TEMPLATE_MAPPING.SSC ? (
        <SSCTemplate
          cancelSubmit={cancelSubmit}
          cancelSubmitSectionModalSubmit={cancelSubmitSectionModalSubmit}
          clearResponse={clearResponse}
          currentIndex={currentIndex}
          currentSection={currentSection}
          goToNextSection={goToNextSection}
          handleJumpTo={handleJumpTo}
          handleNextQuestion={handleNextQuestion}
          handleSectionTimeout={handleSectionTimeout}
          handleSubmit={handleSubmit}
          handleTimeout={handleTimeout}
          loaded={loaded}
          question={question}
          setCurrentSection={setCurrentSection}
          setQuestion={setQuestion}
          setSidebarOpen={setSidebarOpen}
          setSubmitSectionModal={setSubmitSectionModal}
          showModal={showModal}
          showSubmitSectionModal={showSubmitSectionModal}
          sidebarOpen={sidebarOpen}
          submitTest={submitTest}
          testMetaData={testMetaData}
          toggleMarkForReview={toggleMarkForReview}
          errorMessage={errorMessage}
          handlePreviousQuestion={handlePreviousQuestion}
        />
      ) : (
        <DefaultTemplate
          cancelSubmit={cancelSubmit}
          cancelSubmitSectionModalSubmit={cancelSubmitSectionModalSubmit}
          clearResponse={clearResponse}
          currentIndex={currentIndex}
          currentSection={currentSection}
          goToNextSection={goToNextSection}
          handleJumpTo={handleJumpTo}
          handleNextQuestion={handleNextQuestion}
          handleSectionTimeout={handleSectionTimeout}
          handleSubmit={handleSubmit}
          handleTimeout={handleTimeout}
          loaded={loaded}
          question={question}
          setCurrentSection={setCurrentSection}
          setQuestion={setQuestion}
          setSidebarOpen={setSidebarOpen}
          setSubmitSectionModal={setSubmitSectionModal}
          showModal={showModal}
          showSubmitSectionModal={showSubmitSectionModal}
          sidebarOpen={sidebarOpen}
          submitTest={submitTest}
          testMetaData={testMetaData}
          toggleMarkForReview={toggleMarkForReview}
          errorMessage={errorMessage}
        />
      )}
    </div>
  );
}
