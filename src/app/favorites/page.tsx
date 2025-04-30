import { Suspense } from "react";
import FavoritesClient from "./FavoritesClient";
import PageLoading from "@/components/ui/PageLoading";

export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <FavoritesClient />
    </Suspense>
  );
}