import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Calendar, Users, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const stats = [
    {
      title: "Total de Músicas",
      value: "124",
      icon: Music,
      description: "+12 este mês",
      gradient: "from-primary to-primary-light",
    },
    {
      title: "Escalas Ativas",
      value: "8",
      icon: Calendar,
      description: "Próximos 30 dias",
      gradient: "from-secondary to-accent",
    },
    {
      title: "Integrantes",
      value: "32",
      icon: Users,
      description: "15 músicos, 17 cantores",
      gradient: "from-accent to-primary",
    },
    {
      title: "Músicas Populares",
      value: "15",
      icon: TrendingUp,
      description: "Mais tocadas no mês",
      gradient: "from-primary-light to-secondary",
    },
  ];

  const recentScales = [
    { date: "2024-11-17", service: "Culto de Celebração", songs: 6, status: "Confirmada" },
    { date: "2024-11-20", service: "Culto de Oração", songs: 4, status: "Pendente" },
    { date: "2024-11-24", service: "Culto de Domingo", songs: 7, status: "Confirmada" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do ministério de louvor
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden border-0 shadow-medium hover:shadow-glow transition-all duration-300"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximas Escalas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScales.map((scale, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{scale.service}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(scale.date).toLocaleDateString('pt-BR')} • {scale.songs} músicas
                    </p>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      scale.status === "Confirmada"
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/10 text-accent"
                    }`}
                  >
                    {scale.status}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Músicas em Destaque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Reckless Love", "Goodness of God", "Way Maker", "Oceans"].map((song, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{song}</p>
                      <p className="text-sm text-muted-foreground">Tocada {12 - index * 2}x</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
