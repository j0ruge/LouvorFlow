import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Music, Plus, Search, Guitar } from "lucide-react";

const Songs = () => {
  const songs = [
    {
      id: "1",
      nome: "Reckless Love",
      tonalidade: { id: "t1", tom: "C" },
      versoes: [{ id: "v1", artista: { id: "a1", nome: "Cory Asbury" }, bpm: 72, cifras: null }],
      tags: [{ id: "tg1", nome: "Adoração" }, { id: "tg2", nome: "Lenta" }],
      funcoes: [{ id: "f1", nome: "Vocal" }],
    },
    {
      id: "2",
      nome: "Goodness of God",
      tonalidade: { id: "t2", tom: "G" },
      versoes: [{ id: "v2", artista: { id: "a2", nome: "Bethel Music" }, bpm: 68, cifras: null }],
      tags: [{ id: "tg1", nome: "Adoração" }, { id: "tg3", nome: "Edificação" }],
      funcoes: [{ id: "f1", nome: "Vocal" }, { id: "f2", nome: "Teclado" }],
    },
    {
      id: "3",
      nome: "Way Maker",
      tonalidade: { id: "t3", tom: "D" },
      versoes: [{ id: "v3", artista: { id: "a3", nome: "Sinach" }, bpm: 136, cifras: null }],
      tags: [{ id: "tg4", nome: "Celebração" }, { id: "tg5", nome: "Animada" }],
      funcoes: [{ id: "f1", nome: "Vocal" }, { id: "f3", nome: "Bateria" }],
    },
    {
      id: "4",
      nome: "Oceans",
      tonalidade: { id: "t4", tom: "Dm" },
      versoes: [{ id: "v4", artista: { id: "a4", nome: "Hillsong United" }, bpm: 74, cifras: null }],
      tags: [{ id: "tg1", nome: "Adoração" }, { id: "tg6", nome: "Intimista" }],
      funcoes: [{ id: "f1", nome: "Vocal" }, { id: "f4", nome: "Violão" }],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Músicas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o repertório do ministério
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft">
          <Plus className="mr-2 h-4 w-4" />
          Nova Música
        </Button>
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar músicas por nome, artista ou tom..."
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {songs.map((song) => (
              <div
                key={song.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border hover:shadow-soft transition-all duration-300"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{song.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      {song.versoes[0]?.artista.nome}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Guitar className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{song.tonalidade.tom}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {song.versoes[0]?.bpm} BPM
                  </div>
                  <div className="flex gap-2">
                    {song.tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="secondary"
                        className="bg-primary/10 text-primary hover:bg-primary/20"
                      >
                        {tag.nome}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="outline" size="sm">
                    Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Songs;
