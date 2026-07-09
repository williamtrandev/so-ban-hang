import type { SoLuong } from "@/lib/domain/types";
import { cn } from "@/lib/utils";

// Chips số lượng gộp theo nhóm sản phẩm, chỉ hiện loại > 0, wrap tự nhiên
// nên không bao giờ gây tràn ngang (thay cho nhãn text dài 7 loại).
function buildGroups(q: SoLuong) {
  const groups: { label: string; parts: [string, number][] }[] = [
    {
      label: "Nem ăn liền",
      parts: [
        ["lá", q.so_luong_nem_an_lien_la],
        ["hộp", q.so_luong_nem_an_lien_hop],
      ],
    },
    {
      label: "Nem mới",
      parts: [
        ["lá", q.so_luong_nem_moi_la],
        ["hộp", q.so_luong_nem_moi_hop],
      ],
    },
    {
      label: "Bì",
      parts: [
        ["lá", q.so_luong_bi_la],
        ["hộp", q.so_luong_bi_hop],
      ],
    },
    { label: "Chả", parts: [["", q.so_luong_cha]] },
  ];
  return groups
    .map((g) => ({ ...g, parts: g.parts.filter(([, n]) => n > 0) }))
    .filter((g) => g.parts.length > 0);
}

export function SoLuongChips({ q, className }: { q: SoLuong; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {buildGroups(q).map((g) => (
        <span
          key={g.label}
          className="inline-flex items-baseline gap-1.5 rounded-md bg-muted/70 px-2 py-1 text-xs"
        >
          <span className="text-muted-foreground">{g.label}</span>
          {g.parts.map(([unit, n]) => (
            <span key={unit} className="font-medium tabular-nums">
              {unit ? `${unit} ${n}` : n}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
