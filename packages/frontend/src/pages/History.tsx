import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon, Calendar, Music, Users } from "lucide-react";

const History = () => {
  const pastScales = [
    {
      id: 1,
      date: "2024-11-10",
      service: "Culto de Celebração",
      minister: "João Silva",
      songsCount: 6,
      participantsCount: 8,
    },
    {
      id: 2,
      date: "2024-11-03",
      service: "Culto de Domingo",
      minister: "Maria Santos",
      songsCount: 7,
      participantsCount: 10,
    },
    {
      id: 3,
      date: "2024-10-27",
      service: "Culto de Oração",
      minister: "Carlos Lima",
      songsCount: 4,
      participantsCount: 6,
    },
    {
      id: 4,
      date: "2024-10-20",
      service: "Culto de Celebração",
      minister: "Ana Oliveira",
      songsCount: 6,
      participantsCount: 9,
    },
    {
      id: 5,
      date: "2024-10-13",
      service: "Culto de Domingo",
      minister: "Pedro Costa",
      songsCount: 7,
      participantsCount: 8,
    },
    {
      id: 6,
      date: "2024-10-06",
      service: "Culto de Oração",
      minister: "João Silva",
      songsCount: 5,
      participantsCount: 7,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Histórico
        </h1>
        <p className="text-muted-foreground mt-1">
          Consulte escalas e cultos anteriores
        </p>
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5 text-primary" />
            Escalas Realizadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pastScales.map((scale) => (
              <div
                key={scale.id}
                className="p-5 rounded-lg bg-gradient-card border border-border hover:shadow-soft transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Calendar className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {scale.service}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(scale.date).toLocaleDateString('pt-BR', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Music className="h-4 w-4" />
                        Músicas
                      </div>
                      <p className="text-2xl font-bold text-primary">
                        {scale.songsCount}
                      </p>
                    </div>

                    <div className="text-center">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Users className="h-4 w-4" />
                        Equipe
                      </div>
                      <p className="text-2xl font-bold text-secondary">
                        {scale.participantsCount}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Badge variant="outline" className="justify-center">
                        Ministro: {scale.minister}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default History;
