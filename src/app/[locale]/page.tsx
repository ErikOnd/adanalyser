import { Hero } from "@/app/Components/Hero/Hero";
import { Navigation } from "@/app/Components/Navigation/Navigation";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import styles from "./page.module.scss";

type Props = {
	params: Promise<{ locale: string }>;
};

export default function Home({ params }: Props) {
	const { locale } = use(params);
	setRequestLocale(locale);

	return (
		<main className={styles.page}>
			<Navigation />
			<Hero />
		</main>
	);
}
