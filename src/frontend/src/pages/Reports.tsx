import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Music, Calendar } from "lucide-react";

const Reports = () => {
  const topSongs = [
    { name: "Reckless Love", plays: 24 },
    { name: "Goodness of God", plays: 21 },
    { name: "Way Maker", plays: 19 },
    { name: "Oceans", plays: 16 },
    { name: "What a Beautiful Name", plays: 14 },
  ];

  const monthlyStats = [
    { month: "Jul", services: 8, songs: 48 },
    { month: "Ago", services: 9, songs: 54 },
    { month: "Set", services: 8, songs: 48 },
    { month: "Out", services: 10, songs: 60 },
    { month: "Nov", services: 7, songs: 42 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Relatórios
        </h1>
        <p className="text-muted-foreground mt-1">
          Análise e estatísticas do ministério
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Músicas Mais Tocadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSongs.map((song, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <span className="font-medium text-foreground">{song.name}</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      {song.plays} vezes
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary transition-all duration-500"
                      style={{ width: `${(song.plays / topSongs[0].plays) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Atividade Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyStats.map((stat, index) => (
                <div key={index} className="p-4 rounded-lg bg-gradient-card border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-foreground">{stat.month}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {stat.services} cultos
                      </span>
                      <span className="text-primary font-medium">
                        {stat.songs} músicas
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-primary transition-all duration-500"
                      style={{ width: `${(stat.songs / 60) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Music className="h-5 w-5 text-primary" />
              Total de Músicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              124
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              +12 novas este mês
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-primary" />
              Cultos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              42
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Nos últimos 6 meses
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              Média por Culto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              6.2
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Músicas por culto
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
