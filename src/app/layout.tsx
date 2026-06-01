import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
	title: "Adanalyser",
	description: "AI ad auditor for short-form video creatives",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
