import { SignInPage } from "@/app/Components/SignInPage/SignInPage";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

type Props = {
	params: Promise<{ locale: string }>;
};

export default function SignIn({ params }: Props) {
	const { locale } = use(params);
	setRequestLocale(locale);

	return <SignInPage locale={locale} />;
}
