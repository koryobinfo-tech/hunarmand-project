import { Suspense } from "react";
import CatalogClient from "./CatalogClient";

export default function CatalogPage() {
  return (
    <Suspense fallback={<div className="p-10">Боргирӣ...</div>}>
      <CatalogClient />
    </Suspense>
  );
}
