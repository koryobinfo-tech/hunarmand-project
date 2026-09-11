import { Suspense } from "react";
import CatalogClient from "../CatalogClient";

export default function CategoryPage() {
  return (
    <Suspense fallback={<div className="p-10">Боргирӣ...</div>}>
      <CatalogClient />
    </Suspense>
  );
}
