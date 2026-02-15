import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Users, Music } from "lucide-react";

const Scales = () => {
  const scales = [
    {
      id: "1",
      data: "2024-11-17T10:00:00Z",
      descricao: "Culto matutino de celebração",
      tipoEvento: { id: "te1", nome: "Culto de Celebração" },
      musicas: [
        { id: "m1", nome: "Reckless Love" },
        { id: "m2", nome: "Goodness of God" },
        { id: "m3", nome: "Way Maker" },
      ],
      integrantes: [
        { id: "i1", nome: "João Silva", funcoes: [{ id: "f1", nome: "Ministro" }] },
        { id: "i2", nome: "Maria Santos", funcoes: [{ id: "f3", nome: "Vocal" }] },
        { id: "i3", nome: "Carlos Lima", funcoes: [{ id: "f7", nome: "Guitarra" }] },
        { id: "i4", nome: "Ana Oliveira", funcoes: [{ id: "f3", nome: "Vocal" }] },
        { id: "i5", nome: "Lucas Pereira", funcoes: [{ id: "f6", nome: "Teclado" }] },
      ],
    },
    {
      id: "2",
      data: "2024-11-20T19:00:00Z",
      descricao: "Culto de oração semanal",
      tipoEvento: { id: "te2", nome: "Culto de Oração" },
      musicas: [
        { id: "m4", nome: "Oceans" },
        { id: "m1", nome: "Reckless Love" },
      ],
      integrantes: [
        { id: "i2", nome: "Maria Santos", funcoes: [{ id: "f1", nome: "Ministro" }] },
        { id: "i1", nome: "João Silva", funcoes: [{ id: "f3", nome: "Vocal" }] },
        { id: "i3", nome: "Pedro Costa", funcoes: [{ id: "f4", nome: "Bateria" }] },
        { id: "i5", nome: "Lucas Pereira", funcoes: [{ id: "f6", nome: "Teclado" }] },
      ],
    },
    {
      id: "3",
      data: "2024-11-24T10:00:00Z",
      descricao: "Culto dominical principal",
      tipoEvento: { id: "te3", nome: "Culto de Domingo" },
      musicas: [
        { id: "m2", nome: "Goodness of God" },
        { id: "m3", nome: "Way Maker" },
        { id: "m4", nome: "Oceans" },
        { id: "m1", nome: "Reckless Love" },
      ],
      integrantes: [
        { id: "i3", nome: "Carlos Lima", funcoes: [{ id: "f1", nome: "Ministro" }] },
        { id: "i2", nome: "Maria Santos", funcoes: [{ id: "f3", nome: "Vocal" }] },
        { id: "i4", nome: "Ana Oliveira", funcoes: [{ id: "f3", nome: "Vocal" }] },
        { id: "i1", nome: "João Silva", funcoes: [{ id: "f2", nome: "Violão" }] },
        { id: "i5", nome: "Pedro Costa", funcoes: [{ id: "f4", nome: "Bateria" }] },
        { id: "i6", nome: "Lucas Pereira", funcoes: [{ id: "f6", nome: "Teclado" }] },
      ],
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
                    <CardTitle className="text-xl">{scale.tipoEvento.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(scale.data).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="default"
                  className="bg-primary text-primary-foreground"
                >
                  {scale.tipoEvento.nome}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Integrantes ({scale.integrantes.length})
                  </div>
                  <div className="pl-6 space-y-1">
                    {scale.integrantes.map((integrante) => (
                      <div key={integrante.id} className="flex items-center gap-2">
                        <p className="text-sm text-foreground">{integrante.nome}</p>
                        {integrante.funcoes.map((f) => (
                          <Badge key={f.id} variant="outline" className="text-xs">
                            {f.nome}
                          </Badge>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Music className="h-4 w-4" />
                    Músicas ({scale.musicas.length})
                  </div>
                  <div className="pl-6 space-y-1">
                    {scale.musicas.map((musica) => (
                      <p key={musica.id} className="text-sm text-foreground">
                        {musica.nome}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Music className="h-4 w-4" />
                  {scale.musicas.length} músicas selecionadas
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
