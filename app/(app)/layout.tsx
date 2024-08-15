"use client";

import axios from "axios";
import { useAtom } from "jotai";
import { useEffect } from "react"
import toast, { Toaster } from "react-hot-toast";
import Navbar from "@/components/Navbar"
import { Assistant, UserThread } from "@prisma/client";
import { assistantAtom, userThreadAtom } from "@/atoms";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
	const [, setUserThread] = useAtom(userThreadAtom);
	const [assistant, setAssistant] = useAtom(assistantAtom);

	useEffect(() => {
		if (assistant) return;

    async function getAssistant() {
      try {
        const response = await axios.get<{
          success: boolean;
          message?: string;
          assistant: Assistant;
        }>("/api/assistant");

        if (!response.data.success || !response.data.assistant) {
          console.error(response.data.message ?? "Unknown error.");
          toast.error("Failed to fetch assistant.");
          setAssistant(null);
          return;
        }

        setAssistant(response.data.assistant);
      } catch (error) {
        console.error(error);
        setAssistant(null);
      }
    }

    getAssistant();
	}, [setAssistant, assistant]);

	useEffect(() => {
		const getUserThread = async () => {
			try {
				const response = await axios.get<{
					success: boolean;
					message?: string;
					userThread: UserThread;
				}>("/api/user-thread");
	
				if (!response.data.success) {
					console.error(response.data.message ?? "error")
					return ;
				}
	
				setUserThread(response.data.userThread);
			} catch(e) {
				console.error(e);
				setUserThread(null);
			}

		};

		getUserThread();
	}, [setUserThread]); 

  return (
		<div className="flex flex-col w-full h-full">
			<Navbar />
			{children}
			<Toaster />
		</div>
  )
}