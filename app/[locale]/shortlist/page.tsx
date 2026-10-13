import { Suspense } from "react";
import { Collection } from "@/components/collection";
export default function Page() {
  return (
    <Suspense>
      <Collection shortlist />
    </Suspense>
  );
}
