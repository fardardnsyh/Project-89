"use client";
import axios from 'axios';
import { useAtom } from 'jotai';
import toast from "react-hot-toast";
import { assistantAtom, userThreadAtom } from '@/atoms';
import React, { FormEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { Message } from "openai/resources/beta/threads/messages";
import { Run } from 'openai/resources/beta/threads/runs/runs.mjs';

const POLLING_FREQUENCY_MS = 1000;

const usePrevious = <T extends any>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

function ChatPage() {
	const [userThread] = useAtom(userThreadAtom);
	const [assistant] = useAtom(assistantAtom);

	const scrollableChatRef = useRef<HTMLDivElement>(null);
	const [fetching, setFetching] = useState(true);
	const [messages, setMessages] = useState<Message[]>([]);
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);
	const [pollingRun, setPollingRun] = useState(false);
	const prevMessages = usePrevious(messages);

  useEffect(() => {
    if (messages.length && !prevMessages?.length) {
      scrollToBottom();
    }
  }, [messages, prevMessages])

	const fetchMessages = useCallback(
		async () => {
			if (!userThread) return;
		
			try {
				const response = await axios.post<{ success: true, error?: string, messages?: Message[] }>(
					"/api/message/list",
					{ threadId: userThread.threadId }
				);
	
				if (!response.data.success || !response.data.messages) {
					console.error(response.data.error ?? "Unknown error.");
					setFetching(false);
					return;
				}
		
				let newMessages = response.data.messages;
		
				newMessages = newMessages?.sort((a, b) => {
					return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
				}).filter((message) => {
					const { content } = message;
					return content[0]?.type === "text" && content[0]?.text?.value.trim() !== ""
				});
				if (newMessages) {
					setMessages(newMessages);
				}
			} catch(e) {
				console.error(e);
				setMessages([]);
			} finally {
				setFetching(false);
			}
		}, [userThread]
	);

	useEffect(() => {
		const intervalId = setInterval(fetchMessages, POLLING_FREQUENCY_MS);

		return () => clearInterval(intervalId);
	}, [fetchMessages]);

	const scrollToBottom = () => {
    if (scrollableChatRef.current) {
      scrollableChatRef.current.scrollTo({
        top: scrollableChatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

	useEffect(() => {
    if (messages.length && !prevMessages?.length) {
      scrollToBottom();
    }
  }, [messages, prevMessages])

	const startRun = async (threadId: string, assistantId: string): Promise<string> => {
		try {
      const {
        data: { success, run, error },
      } = await axios.post<{
        success: boolean;
        error?: string;
        run?: Run;
      }>("/api/run/create", {
        threadId,
        assistantId,
      });

      if (!success || !run) {
        console.error(error);
        toast.error("Failed to start run.");
        return "";
      }

      return run.id;
    } catch (error) {
      console.error(error);
      toast.error("Failed to start run.");
      return "";
    }
  };
	const pollRunStatus = async (threadId: string, runId: string) => {
		setPollingRun(true);

		const intervalId = setInterval(async () => {
			try {
				const { data: { run, success, error }} = await axios.post<{ success: boolean; error?: string; run?: Run; }>("/api/run/retrieve", {
					threadId,
					runId,
				});

				if (!success || !run) {
					console.error(error);
					toast.error("Faield to poll run status");
					return;
				}


				if (run.status === "completed") {
					clearInterval(intervalId);
					setPollingRun(false);
					fetchMessages();
					scrollToBottom();
					return;
				} else if (run.status === "failed") {
					clearInterval(intervalId);
					setPollingRun(false);
					toast.error("Run failed.");
					return;
				}
			} catch(e) {
        console.error(e);
        toast.error("Failed to poll run status.");
        clearInterval(intervalId);
			}
		}, POLLING_FREQUENCY_MS);

		return () => clearInterval(intervalId);
	};

	const sendMessage: FormEventHandler<any> | undefined = async (e) => {
		e.preventDefault();
		if (!userThread || sending || !assistant) {
			toast.error("Failed to send message");
			return;
		}

		setSending(true);

		try {
			const { data: { message: newMessages }} = await axios.post<{
				success: boolean;
				message?: Message;
				error?: string;
			}>("/api/message/create", {
				message,
				threadId: userThread.threadId,
				fromUser: "true"
			});
	
			if (!newMessages) {
				console.error("No message");
				toast.error("Failed to send message.");
				return;
			}
			setMessages((prev) => [...prev, newMessages]);
			setMessage("");
			toast.success("Message sent");

			const runId = await startRun(userThread.threadId, assistant.assistantId);

			pollRunStatus(userThread.threadId, runId);
		} catch(e) {
			console.error(e);
			toast.error("Failed to send message.");
		} finally {
			setSending(false);
			scrollToBottom();
		}
	}

	return (
		<div className="w-screen h-[calc(100vh-64px)] flex flex-col bg-black text-white">
			<div className="flex-grow overflow-y-scroll p-8 space-y-2" ref={scrollableChatRef}>
				{fetching && messages.length === 0 && (
					<div className="text-center font-bold">Fetching....</div>
				)}
				{messages.length === 0 && !fetching && (
					<div className="text-center font-bold">No messages</div>
				)}
				{messages.map((message) => (
					<div
						key={message.id}
						className={`px-4 py-2 mb-3 rounded-lg w-fit text-lg ${
							["true", "True"].includes(
								(message.metadata as { fromUser?: string }).fromUser ?? ""
							)
								? "bg-yellow-500 ml-auto"
								: "bg-gray-700"
						}`}
					>
						{message.content[0].type === "text" ? (
							message.content[0].text.value.split("\n").map((text, index) => (
								<p key={index}>{text}</p>
							))
						 ) : null}
					</div>
				))} 
			</div>
			<div className="mt-auto p-4 bg-gray-800">
				<form onSubmit={sendMessage}>
					<div className="flex items-center bg-white p-2">
						<input
							type="text"
							className="flex-grow bg-transparent text-black focus:outline-none"
							placeholder="Message..."
							value={message}
							onChange={(e) => setMessage(e.target.value)}
						/>
						<button
							className="ml-4 bg-yellow-500 text-white px-4 py-2 rounded-full focus:outline-none disabled:bg-yellow-700"
							disabled={!userThread?.threadId || !assistant || sending || !message.trim()}
						>
							{ sending ? "Sending..." : pollingRun ? "Polling Run..." : "Send" }
						</button>
					</div>
				</form>
			</div>
		</div>
	)
}

export default ChatPage