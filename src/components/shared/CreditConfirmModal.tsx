import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Users, BookOpen, AlertTriangle } from "lucide-react";

interface CreditConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  type: "character" | "book";
  action: string;
  creditsRequired: number;
  creditsAvailable: number;
}

export function CreditConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  type,
  action,
  creditsRequired,
  creditsAvailable,
}: CreditConfirmModalProps) {
  const hasEnough = creditsAvailable >= creditsRequired;
  const Icon = type === "character" ? Users : BookOpen;
  const creditLabel = type === "character" ? "Character Credits" : "Book Credits";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {!hasEnough && <AlertTriangle className="w-5 h-5 text-destructive" />}
            {action}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>This action will consume credits from your account.</p>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">{creditLabel}</span>
              </div>
              <div className="text-right">
                <span className={hasEnough ? "text-foreground" : "text-destructive"}>
                  {creditsRequired} required
                </span>
                <p className="text-sm text-muted-foreground">
                  {creditsAvailable} available
                </p>
              </div>
            </div>
            {!hasEnough && (
              <p className="text-destructive text-sm">
                You don't have enough credits. Please upgrade your plan or purchase more credits.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {hasEnough ? (
            <AlertDialogAction onClick={onConfirm}>
              Confirm ({creditsRequired} credits)
            </AlertDialogAction>
          ) : (
            <AlertDialogAction asChild>
              <a href="/app/billing">Buy Credits</a>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
