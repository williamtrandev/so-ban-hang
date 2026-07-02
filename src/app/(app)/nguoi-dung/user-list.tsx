"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { approveUser, rejectUser } from "./actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/domain/types";

export type UserRow = {
  id: string;
  full_name: string;
  role: "admin" | "seller";
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

const STATUS_LABEL: Record<UserRow["status"], string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};

const STATUS_VARIANT: Record<UserRow["status"], "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
};

export function UserList({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<string | null>, ok: string) {
    startTransition(async () => {
      const error = await action();
      if (error) toast.error(error);
      else toast.success(ok);
    });
  }

  if (users.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có người dùng nào.</p>;
  }

  return (
    <ul className="space-y-2">
      {users.map((u) => {
        const isSelf = u.id === currentUserId;
        return (
          <li
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">{u.full_name}</span>
                {u.role === "admin" && <Badge variant="outline">Admin</Badge>}
                <Badge variant={STATUS_VARIANT[u.status]}>{STATUS_LABEL[u.status]}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tạo lúc {formatDateTime(u.created_at)}
              </p>
            </div>
            {!isSelf && (
              <div className="flex shrink-0 items-center gap-2">
                {u.status !== "approved" && (
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => approveUser(u.id), `Đã duyệt ${u.full_name}`)}
                  >
                    Duyệt
                  </Button>
                )}
                {u.status !== "rejected" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => run(() => rejectUser(u.id), `Đã từ chối ${u.full_name}`)}
                  >
                    Từ chối
                  </Button>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
