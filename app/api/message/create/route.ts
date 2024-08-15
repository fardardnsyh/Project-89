import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  const { message, threadId, fromUser = false } = await req.json();

  if (!threadId || !message) {
    return NextResponse.json(
      { error: "threadId and message are required", success: false },
      { status: 400 }
    );
  }

  const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY
	});

  try {
    const threadMessage = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: message,
      metadata: {
        fromUser,
      }
    });

    return NextResponse.json({ message: threadMessage, success: true }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong", success: false }, { status: 500 });
  }
}