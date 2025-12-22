"use client";

import { VisualEditing } from "@sanity/visual-editing/react";
import { useRouter } from "next/navigation";

export function VisualEditingWrapper() {
  const router = useRouter();

  return (
    <VisualEditing
      portal={true}
      refresh={(payload) => {
        router.refresh();
      }}
    />
  );
}
