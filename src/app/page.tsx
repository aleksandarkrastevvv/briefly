import BrieflyApp from "./briefly-app";
import { getHomepageData } from "@/lib/supabase-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const homepageData = await getHomepageData();

  return <BrieflyApp homepageData={homepageData} />;
}
