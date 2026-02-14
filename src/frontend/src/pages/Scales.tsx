import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Users, Music } from "lucide-react";

const Scales = () => {
  const scales = [
    {
      id: 1,
      date: "2024-11-17",
      service: "Culto de Celebração",
      minister: "João Silva",
      singers: ["Maria Santos", "Pedro Costa"],
      musicians: ["Carlos Lima", "Ana Oliveira", "Lucas Pereira"],
      songs: 6,
      status: "Confirmada",
    },
    {
      id: 2,
      date: "2024-11-20",
      service: "Culto de Oração",
      minister: "Maria Santos",
      singers: ["João Silva", "Ana Oliveira"],
      musicians: ["Pedro Costa", "Lucas Pereira"],
      songs: 4,
      status: "Pendente",
    },
    {
      id: 3,
      date: "2024-11-24",
      service: "Culto de Domingo",
      minister: "Carlos Lima",
      singers: ["Maria Santos", "Ana Oliveira", "Lucas Pereira"],
      musicians: ["João Silva", "Pedro Costa", "Carlos Lima"],
      songs: 7,
      status: "Confirmada",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Escalas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as escalas de culto
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft">
          <Plus className="mr-2 h-4 w-4" />
          Nova Escala
        </Button>
      </div>

      <div className="space-y-4">
        {scales.map((scale) => (
          <Card key={scale.id} className="shadow-soft border-0 hover:shadow-medium transition-all duration-300">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{scale.service}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(scale.date).toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={scale.status === "Confirmada" ? "default" : "secondary"}
                  className={
                    scale.status === "Confirmada"
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent text-accent-foreground"
                  }
                >
                  {scale.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Ministro
                  </div>
                  <p className="text-sm font-medium text-foreground pl-6">{scale.minister}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Cantores ({scale.singers.length})
                  </div>
                  <div className="pl-6 space-y-1">
                    {scale.singers.map((singer, index) => (
                      <p key={index} className="text-sm text-foreground">
                        {singer}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Music className="h-4 w-4" />
                    Músicos ({scale.musicians.length})
                  </div>
                  <div className="pl-6 space-y-1">
                    {scale.musicians.map((musician, index) => (
                      <p key={index} className="text-sm text-foreground">
                        {musician}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Music className="h-4 w-4" />
                  {scale.songs} músicas selecionadas
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    Compartilhar
                  </Button>
                  <Button variant="default" size="sm" className="bg-gradient-primary">
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Scales;
