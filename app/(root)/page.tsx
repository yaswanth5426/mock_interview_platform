import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import InterviewCard from "@/components/InterviewCard";
import Image from "next/image";
import { getCurrentUser} from "@/lib/actions/auth.action";
import { getInterviewsByUserId, getLatestInterviews } from "@/lib/actions/general.action";

const Page = async () => {
  const user = await getCurrentUser();

  const [userInterviews, allInterview] = await Promise.all([
    getInterviewsByUserId(user?.id!),
    getLatestInterviews({ userId: user?.id!, limit: 20 }),
  ]);

  // Helper function to check if feedback exists
  const checkFeedback = async (interviewId: string) => {
    try {
      const { getFeedbackByInterviewId } = await import("@/lib/actions/general.action");
      const feedback = await getFeedbackByInterviewId({
        interviewId,
        userId: user?.id!,
      });
      return !!feedback;
    } catch {
      return false;
    }
  };

  // Split interviews based on feedback existence
  const interviewsWithFeedbackStatus = await Promise.all(
    (userInterviews || []).map(async (interview) => ({
      ...interview,
      hasFeedback: await checkFeedback(interview.id),
    }))
  );

  const completedInterviews = interviewsWithFeedbackStatus.filter(
    (interview) => interview.hasFeedback
  );

  const pendingInterviews = interviewsWithFeedbackStatus.filter(
    (interview) => !interview.hasFeedback
  );

  const hasPastInterviews = completedInterviews.length > 0;
  const hasUpcomingInterviews = pendingInterviews.length > 0;

  return (
    <>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice on real interview questions & get instant feedback
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Your Interviews</h2>

        <div className="interviews-section">
          {hasPastInterviews ? (
            completedInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>You haven&apos;t taken any interviews yet</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-6 mt-8">
        <h2>Take an Interview</h2>

        <div className="interviews-section">
          {hasUpcomingInterviews ? (
            pendingInterviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                userId={user?.id}
                interviewId={interview.id}
                role={interview.role}
                type={interview.type}
                techstack={interview.techstack}
                createdAt={interview.createdAt}
              />
            ))
          ) : (
            <p>No interviews ready to take. Generate one first!</p>
          )}
        </div>
      </section>
    </>
  );
};

export default Page;