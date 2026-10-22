"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QuickAddForm } from "./quick-add-form";
import { BulkAddForm } from "./bulk-add-form";
import { useOrders } from "./orders-provider";
import type { Price, PriceGroup } from "@/lib/domain/types";

export function QuickInputTabs({ prices }: { prices: Record<PriceGroup, Price> }) {
  const { draft } = useOrders();
  const [tab, setTab] = useState("single");

  // "Lặp lại đơn" luôn đổ vào tab Từng đơn.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft !== null) setTab("single");
  }, [draft]);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-4">
      <TabsList>
        <TabsTrigger value="single">Từng đơn</TabsTrigger>
        <TabsTrigger value="bulk">Dán nhiều dòng</TabsTrigger>
      </TabsList>
      <TabsContent value="single">
        <QuickAddForm prices={prices} />
      </TabsContent>
      <TabsContent value="bulk">
        <BulkAddForm prices={prices} />
      </TabsContent>
    </Tabs>
  );
}
