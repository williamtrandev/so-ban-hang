"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QuickAddForm } from "./quick-add-form";
import { BulkAddForm } from "./bulk-add-form";
import type { Price, PriceGroup } from "@/lib/domain/types";

export function QuickInputTabs({ prices }: { prices: Record<PriceGroup, Price> }) {
  return (
    <Tabs defaultValue="single" className="gap-4">
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
