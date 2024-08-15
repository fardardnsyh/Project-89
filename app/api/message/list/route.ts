import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  const { threadId } = await req.json();

  if (!threadId) {
    return NextResponse.json(
      { error: "threadId is required", success: false },
      { status: 400 }
    );
  }

	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY
	});

	try {
		const response = await openai.beta.threads.messages.list(threadId);

		return NextResponse.json({ messages: response.data, success: true}, { status: 200 })
	} catch(e) {
		console.error(e);
		return NextResponse.json({ error: "Somethind went wrong", success: false }, { status: 500 })
	}
}