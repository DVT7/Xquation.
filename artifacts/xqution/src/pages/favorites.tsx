import { useListFavorites, useRemoveFavorite, getListFavoritesQueryKey } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function Favorites() {
  const { data: favorites, isLoading } = useListFavorites();
  const removeFavorite = useRemoveFavorite();
  const queryClient = useQueryClient();

  const handleRemove = (id: number) => {
    removeFavorite.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() })
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-mono mb-2">Your Favorites</h1>
        <p className="text-muted-foreground">Saved formulas and constants for quick access.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : favorites?.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-xl bg-background/50">
          <div className="text-muted-foreground mb-4">You haven't saved any items yet.</div>
          <Link href="/formulas" className="inline-flex items-center text-primary hover:text-primary/80 transition-colors font-mono">
            Explore Formulas <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites?.map(fav => (
            <Card key={fav.id} className="bg-card border-border/50 hover:border-primary/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <Badge variant="secondary" className="mb-2 text-[10px] uppercase font-mono tracking-widest bg-primary/10 text-primary">
                    {fav.itemType}
                  </Badge>
                  <CardTitle className="text-lg">{fav.itemName}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Link href={`/${fav.itemType}s?search=${encodeURIComponent(fav.itemName)}`}>
                    <Button variant="ghost" size="icon" title="View details">
                      <ArrowRight className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(fav.id)} title="Remove from favorites">
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
