import { useListConstants, useListFavorites, useAddFavorite, useRemoveFavorite, getListFavoritesQueryKey } from "@workspace/api-client-react";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search, Star, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BlockMath } from "@/components/ui/math";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Constants() {
  const searchParams = new URLSearchParams(window.location.search);
  const matchQuery = searchParams.get("match") || "";
  const [glowId, setGlowId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  const { data: constants, isLoading } = useListConstants({
    search: search || undefined
  });

  /* glow the card that "matched" from smart search */
  useEffect(() => {
    if (!matchQuery || !constants?.length) return;
    const q = matchQuery.toLowerCase();
    const hit = constants.find(c =>
      c.name.toLowerCase().includes(q) ||
      c.symbol?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
    if (hit) {
      setGlowId(hit.id);
      setTimeout(() => setGlowId(null), 3200);
    }
  }, [matchQuery, constants]);

  const { data: favorites } = useListFavorites();
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();

  const favoriteConstantIds = useMemo(() => {
    return new Set((favorites || []).filter(f => f.itemType === 'constant').map(f => f.itemId));
  }, [favorites]);

  const toggleFavorite = (constant: any) => {
    const isFav = favoriteConstantIds.has(constant.id);
    if (isFav) {
      const fav = favorites?.find(f => f.itemType === 'constant' && f.itemId === constant.id);
      if (fav) {
        removeFavorite.mutate({ id: fav.id }, {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() })
        });
      }
    } else {
      addFavorite.mutate({
        data: { itemType: 'constant', itemId: constant.id, itemName: constant.name }
      }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListFavoritesQueryKey() })
      });
    }
  };

  const copyValue = (id: number, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-mono mb-2">Constants Library</h1>
        <p className="text-muted-foreground">Fundamental physical and astronomical constants.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search constants..." 
          className="pl-9 font-mono max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-[250px] w-full" />)
        ) : constants?.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No constants found matching your criteria.
          </div>
        ) : (
          constants?.map(constant => (
            <Card key={constant.id} className={cn("border-border/50 bg-card overflow-hidden flex flex-col hover:border-primary/50 transition-colors", glowId === constant.id && "match-glow")}>
              <CardHeader className="bg-muted/20 border-b border-border/50 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg mb-1">{constant.name}</CardTitle>
                    {constant.category && (
                      <Badge variant="secondary" className="font-mono text-xs">{constant.category}</Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => toggleFavorite(constant)}
                    className={favoriteConstantIds.has(constant.id) ? "text-yellow-500 hover:text-yellow-600" : "text-muted-foreground hover:text-yellow-500"}
                  >
                    <Star className="w-4 h-4" fill={favoriteConstantIds.has(constant.id) ? "currentColor" : "none"} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 flex-1 flex flex-col">
                <div className="flex-1 flex flex-col justify-center mb-6">
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <div className="text-2xl font-mono text-primary font-bold">
                       <BlockMath math={constant.symbol} />
                    </div>
                  </div>
                  <div className="bg-background rounded p-4 text-center border border-border/50 relative group">
                    <div className="font-mono text-lg mb-1 break-all">{constant.value}</div>
                    <div className="font-mono text-sm text-muted-foreground">{constant.units}</div>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                      onClick={() => copyValue(constant.id, constant.value)}
                    >
                      {copiedId === constant.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-foreground/80 mt-auto">{constant.description}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
