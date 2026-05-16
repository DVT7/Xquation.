import { useListFavorites, useRemoveFavorite, getListFavoritesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Star, ArrowRight, FlaskConical, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Favorites() {
  const { data: favorites, isLoading } = useListFavorites();
  const removeFavorite = useRemoveFavorite();
  const queryClient = useQueryClient();
  const [removing, setRemoving] = useState<number | null>(null);

  const handleRemove = (id: number) => {
    setRemoving(id);
    removeFavorite.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() });
        setRemoving(null);
      },
      onError: () => setRemoving(null),
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-mono mb-2">Your Favorites</h1>
        <p className="text-muted-foreground">
          Saved formulas and constants for quick access.{" "}
          <span className="text-primary/70">Click the star to remove an item.</span>
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : favorites?.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-xl bg-background/50">
          <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
          <div className="text-muted-foreground mb-4">You haven't saved any items yet.</div>
          <div className="flex gap-4 justify-center">
            <Link href="/formulas" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-mono text-sm">
              <FlaskConical className="w-4 h-4" /> Browse Formulas
            </Link>
            <Link href="/constants" className="inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors font-mono text-sm">
              <BookOpen className="w-4 h-4" /> Browse Constants
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites?.map(fav => {
            const isRemoving = removing === fav.id;
            const linkHref = fav.itemType === "formula"
              ? `/formulas?search=${encodeURIComponent(fav.itemName)}`
              : `/constants?search=${encodeURIComponent(fav.itemName)}`;

            return (
              <Card
                key={fav.id}
                className={cn(
                  "bg-card border-border/50 hover:border-primary/30 transition-all group",
                  isRemoving && "opacity-50 pointer-events-none"
                )}
              >
                <CardContent className="p-5 flex items-center gap-4">
                  {/* Unfavorite star button */}
                  <button
                    onClick={() => handleRemove(fav.id)}
                    title="Remove from favorites"
                    disabled={isRemoving}
                    className={cn(
                      "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                      "bg-yellow-500/15 border border-yellow-500/30 text-yellow-400",
                      "hover:bg-red-500/15 hover:border-red-500/40 hover:text-red-400",
                      "shadow-[0_0_10px_rgba(234,179,8,0.2)] hover:shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                    )}
                  >
                    <Star
                      className="w-5 h-5 transition-all"
                      fill={isRemoving ? "none" : "currentColor"}
                    />
                  </button>

                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <Badge
                      variant="secondary"
                      className="mb-1.5 text-[10px] uppercase font-mono tracking-widest bg-primary/10 text-primary border-0"
                    >
                      {fav.itemType}
                    </Badge>
                    <div className="text-base font-semibold text-foreground truncate">{fav.itemName}</div>
                  </div>

                  {/* View link */}
                  <Link href={linkHref}>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="View details"
                      className="flex-shrink-0 text-muted-foreground hover:text-primary"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
