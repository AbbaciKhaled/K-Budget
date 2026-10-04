"use client";

import { useEffect } from "react";
import { Page } from "@/components/layout/Page";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Page>
      <Card className="mt-10">
        <EmptyState
          icon="⚠️"
          title="Something went wrong"
          description="We couldn't load this screen. Check your connection and try again."
          action={<Button onClick={reset}>Try again</Button>}
        />
      </Card>
    </Page>
  );
}
