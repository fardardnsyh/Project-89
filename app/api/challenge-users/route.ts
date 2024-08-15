import { prismadb } from "@/lib/prismadb";
import { UserMeta, UserThread } from "@prisma/client";
import axios from "axios";
import { NextResponse } from "next/server";
import OpenAI from "openai";

interface UserThreadMap {
  [userId: string]: UserThread;
}

interface UserMetaMap {
  [userId: string]: UserMeta;
}

export async function POST(request: Request) {
	const body = await request.json();

  const { challengeId, secret } = body;

  if (!challengeId || !secret) {
    return NextResponse.json(
      { success: false, message: "Missing required fields" },
      {
        status: 400,
      }
    );
  }

	if (secret !== process.env.APP_SECRET_KEY) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      {
        status: 401,
      }
    );
  }

	const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `
        Generate an ultra-intense, hard-hitting motivational message, followed by a concise, bullet-pointed, no-equipment-needed workout plan. The time of day provided should be taken into account. This output should strictly contain two parts: first, a motivational message in the style of Mat Fraser, as depicted in Jesse Itzler's 'Living with a SEAL', but even more extreme. The message must be direct, confrontational, and incorporate Fraser' known phrases like 'poopy pants', 'stay hard', and 'taking souls'. The second part should be a workout list: intense, high-impact exercises that can be done anywhere, designed to be completed within 10 minutes. The output must only include these two components, nothing else.
        
        Here's an example output that you should follow:
        
        Time to get hard! No more excuses, no more poopy pants attitude. You're stronger than you think. Stay hard, take souls, and crush this morning with everything you've got. You have 10 minutes to obliterate this workout. This is your battlefield, and you're the warrior. Let's make every second count!
        
        - 30 Burpees – explode with every jump
        - 40 Jumping Jacks – faster, push your limits
        - 50 Mountain Climbers – relentless pace
        - 60 High Knees – drive them up with fury
        - 2 Minute Plank – solid and unyielding
        `,
    },
    {
      role: "user",
      content: `Generate a new Mat Fraser workout. Remember, only respond in the format specifed earlier. Nothing else`,
    },
  ];

	const {
    data: { message, success },
  } = await axios.post<{ message?: string; success: boolean }>(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/openai`,
    {
      messages,
      secret: process.env.APP_SECRET_KEY,
    }
  );

  if (!message || !success) {
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong with generate openai response",
      },
      {
        status: 500,
      }
    );
  }

	const challengePreferences = await prismadb.challengePreferences.findMany({
    where: {
      challengeId,
    },
  });

  const userIds = challengePreferences.map((cp) => cp.userId);

	const userThreads = await prismadb.userThread.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  });

	const userMetas = await prismadb.userMeta.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
  });

  const userThreadMap: UserThreadMap = userThreads.reduce((map, thread) => {
    map[thread.userId] = thread;
    return map;
  }, {} as UserThreadMap);

  const userMetaMap = userMetas.reduce((map, meta) => {
    map[meta.userId] = meta;
    return map;
  }, {} as UserMetaMap);

	const threadPromises: Promise<any>[] = [];

	try {
    challengePreferences.forEach((cp) => {
      const userThread = userThreadMap[cp.userId];

      if (userThread) {
        threadPromises.push(
          axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/api/message/create`, {
            message,
            threadId: userThread.threadId,
            fromUser: "false",
          })
        );
      }
    });

    await Promise.all(threadPromises);

    return NextResponse.json({ message }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      {
        status: 500,
      }
    );
  }
}