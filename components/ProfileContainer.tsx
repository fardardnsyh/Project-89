"use client";

import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import React, { useState } from 'react'
import DifficultyCard from './DifficultyCard';
import { ChallengePreferences } from '@prisma/client'

const difficulties = [
  {
    id: "EASY",
    level: "Easy",
    description:
      "This challenge level is for people who are new to programming. Receive 3 challenges per day (7:30AM, 12PM, & 5:30PM EST).",
  },
  {
    id: "MEDIUM",
    level: "Medium",
    description:
      "This challenge level is for people who are familiar with programming. Receive 4 challenges per day (7AM, 12PM, 5PM, & 8PM EST).",
  },
  {
    id: "HARD",
    level: "Hard",
    description:
      "This challenge level is for people who are experienced with programming. Receive 5 challenges per day (6AM, 9AM, 12PM, 5PM, & 8PM EST).",
  },
];

type Difficulties = "EASY" | "MEDIUM" | "HARD";

interface ProfileContainerProps {
	challengePreferences: ChallengePreferences;
};

function ProfileContainer({
	challengePreferences
}: ProfileContainerProps) {
	const [saving, setSaving] = useState(false);
	const [selectedDifficulty, setSelectedDifficulty] = useState(challengePreferences.challengeId);

	const handleSelectDifficulty = (difficultyId: Difficulties) => {
		setSelectedDifficulty(difficultyId);
	};

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.post<{
        success: boolean;
        data?: ChallengePreferences;
        message?: string;
      }>("/api/challenge-preferences", {
        id: challengePreferences.id,
        challengeId: selectedDifficulty,
        sendNotifications: false,
      });

      if (!response.data.success || !response.data.data) {
        console.error(response.data.message ?? "Something went wrong");
        toast.error(response.data.message ?? "Something went wrong");
        return;
      }

      toast.success("Preferences saved!");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

	return (
		<div className="flex flex-col">
			<div className="flex flex-row justify-between items-center">
				<h1 className="font-bold text-2xl">Challenge Level</h1>
				<Button onClick={handleSave}>{ saving ? "Saving..." : "Save" }</Button>
			</div>
			<div className="grid grid-col-1 md:grid-cols-3 gap-4 mt-5">
				{difficulties.map((difficulty) => (
					<DifficultyCard
						key={difficulty.id}
						level={difficulty.level}
						description={difficulty.description}
						selected={difficulty.id === selectedDifficulty}
						onSelect={() => handleSelectDifficulty(difficulty.id as Difficulties)}
					/>
				))}
			</div>
		</div>
	)
}

export default ProfileContainer