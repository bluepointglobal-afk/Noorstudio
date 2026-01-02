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
import { Users, BookOpen, Loader2 } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";

interface CreditConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  creditCost: number;
  creditType: "character" | "book";
  isLoading?: boolean;
}

export function CreditConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  creditCost,
  creditType,
  isLoading = false,
}: CreditConfirmModalProps) {
  const { credits } = useCredits();
  const creditsAvailable = creditType === "character" ? credits.characterCredits : credits.bookCredits;
  const hasEnough = creditsAvailable >= creditCost;
  const Icon = creditType === "character" ? Users : BookOpen;
  const creditLabel = creditType === "character" ? "Character Credits" : "Book Credits";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>{description}</p>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium">{creditLabel}</span>
                </div>
                <div className="text-right">
                  <span className={hasEnough ? "text-foreground" : "text-destructive"}>
                    {creditCost} required
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
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          {hasEnough ? (
            <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Confirm (${creditCost} credits)`
              )}
            </AlertDialogAction>
          ) : (
            <AlertDialogAction asChild>
              <a href={`/app/billing?need=${creditType}`}>
                Buy {creditLabel}
              </a>
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
