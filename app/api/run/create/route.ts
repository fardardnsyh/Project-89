import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai";

export async function POST (req: NextRequest) {
	const { threadId, assistantId } = await req.json();

	if(!threadId || !assistantId) {
		return NextResponse.json({
			error: "threadId or assistantId are required", success: false
		}, { status: 400 })
	};

	const openai = new OpenAI({
		apiKey: process.env.OPENAI_API_KEY
	});

	try {
		const run = await openai.beta.threads.runs.create(threadId, {
			assistant_id: assistantId
		});

		return NextResponse.json({ run, success: true }, { status: 201 });

	} catch(e) {
		console.error(e);
		return NextResponse.json({
			error: "Something went wrong", success: false
		}, { status: 500 })
	}
}