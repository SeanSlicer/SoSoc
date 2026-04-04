import { type Metadata } from "next";
import SearchPage from "~/app/components/search/SearchPage";

export const metadata: Metadata = { title: "Search — sosoc" };

export default function Search() {
  return <SearchPage />;
}
