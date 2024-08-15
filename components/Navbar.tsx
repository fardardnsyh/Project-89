"use client";
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const routes = [
	{
		name: "Chat",
		path: "/"
	},
	{
		name: "Profile",
		path: "/profile"
	}
]

function Navbar() {
	const pathname = usePathname();

	return (
		<div className="p-4 flex justify-between items-center bg-black text-white">
			<Link href="/">
				<h1 className="text-2xl font-bold">Mat AI</h1>
			</Link>

			<div className="flex gap-x-6 text-lg items-center">
				{routes.map((route, idx) => (
					<Link
						key={idx}
						href={route.path}
						className={
							pathname === route.path ? "border-b-2 border-yellow-500" : ""
						}
					>
						{route.name}
					</Link>
				))}
				<SignedIn><UserButton /></SignedIn>
				<SignedOut><SignInButton /></SignedOut>
			</div>
		</div>
	)
}

export default Navbar