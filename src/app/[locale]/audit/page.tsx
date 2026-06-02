import { AuditUploadPage } from "@/app/Components/AuditUploadPage/AuditUploadPage";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";

type Props = {
	params: Promise<{ locale: string }>;
};

export default function Audit({ params }: Props) {
	const { locale } = use(params);
	setRequestLocale(locale);

	return <AuditUploadPage />;
}
