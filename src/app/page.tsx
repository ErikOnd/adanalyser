import { Hero } from "@/app/Components/Hero/Hero";
import { Navigation } from "@/app/Components/Navigation/Navigation";
import styles from "./page.module.scss";

export default function Home() {
	return (
		<main className={styles.page}>
			<Navigation />
			<Hero />
		</main>
	);
}
