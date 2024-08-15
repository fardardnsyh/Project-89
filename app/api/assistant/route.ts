import { prismadb } from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET() {
	const assistants = await prismadb.assistant.findMany();

	if (assistants.length === 0) {
		return NextResponse.json({ error: "No assitants found", success: false}, { status: 500 });
	};

	return NextResponse.json({ assistant: assistants[0], success: true }, { status: 200 })
}