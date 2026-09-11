"use client";

import { Suspense } from "react";
import { CustomOrderForm } from "@/components/CustomOrderForm";
import { Header } from "@/components/Header";

export default function NewCustomPage() {
  return (
    <Suspense
      fallback={
        <div className="page-bg">
          <Header />
          <p className="p-10">Боргирӣ...</p>
        </div>
      }
    >
      <CustomOrderForm />
    </Suspense>
  );
}
