import BrieflyApp from "./briefly-app";
import { getHomepageData } from "@/lib/supabase-data";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [homepageData, headersList] = await Promise.all([
    getHomepageData(),
    headers(),
  ]);
  const host = headersList.get("host") ?? "";
  const isOfficialSite =
    host === "everything-important-briefly.today" ||
    host === "www.everything-important-briefly.today";

  return (
    <BrieflyApp
      homepageData={homepageData}
      isOfficialSite={isOfficialSite}
    />
  );
}
