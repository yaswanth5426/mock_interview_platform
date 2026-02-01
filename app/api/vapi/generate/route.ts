import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { getRandomInterviewCover } from "@/lib/utils";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { db } from "@/firebase/admin";

export async function GET() {
  return Response.json({ success: true, data: "THANK YOU!" });
}

const googleStable = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1", // Forces the stable API
});

export async function POST(request: Request) {
  try {
  
    const { type, role, level, techstack, amount, userid } = await request.json();

    // 1. Switched to gemini-1.5-flash for better stability on Free Tier
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"), 
      prompt: `Prepare a JSON array of interview questions.
        Role: ${role}, Level: ${level}, Tech: ${techstack}, Type: ${type}, Count: ${amount}.
        Return ONLY a plain JSON array of strings. No markdown, no backticks, no special characters.
        Example: ["Question 1", "Question 2"]`,
    });

    // 2. Defensive Parsing: Clean the AI response of potential markdown backticks
    const cleanedQuestions = JSON.parse(questions.replace(/```json|```/g, "").trim());

    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(",").map((s: string) => s.trim()), // Clean spaces
      questions: cleanedQuestions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("interviews").add(interview);

    return Response.json({ success: true, id: docRef.id }, { status: 200 });

  } catch (error: any) {
    console.error("Error generating content:", error);
    
    // If it's a quota error (429), return a specific message
    const status = error.statusCode === 429 ? 429 : 500;
    return Response.json(
      { success: false, message: error.message || "Internal Server Error" }, 
      { status }
    );
  }
}