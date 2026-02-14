import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Search, Mail, Phone } from "lucide-react";

const Members = () => {
  const members = [
    {
      id: 1,
      name: "João Silva",
      role: "Ministro",
      email: "joao@exemplo.com",
      phone: "(11) 98765-4321",
      instruments: ["Vocal", "Violão"],
    },
    {
      id: 2,
      name: "Maria Santos",
      role: "Cantora",
      email: "maria@exemplo.com",
      phone: "(11) 98765-4322",
      instruments: ["Vocal"],
    },
    {
      id: 3,
      name: "Pedro Costa",
      role: "Músico",
      email: "pedro@exemplo.com",
      phone: "(11) 98765-4323",
      instruments: ["Bateria", "Percussão"],
    },
    {
      id: 4,
      name: "Ana Oliveira",
      role: "Cantora",
      email: "ana@exemplo.com",
      phone: "(11) 98765-4324",
      instruments: ["Vocal", "Teclado"],
    },
    {
      id: 5,
      name: "Carlos Lima",
      role: "Músico",
      email: "carlos@exemplo.com",
      phone: "(11) 98765-4325",
      instruments: ["Guitarra", "Baixo"],
    },
    {
      id: 6,
      name: "Lucas Pereira",
      role: "Músico",
      email: "lucas@exemplo.com",
      phone: "(11) 98765-4326",
      instruments: ["Teclado", "Piano"],
    },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Ministro":
        return "bg-primary/10 text-primary";
      case "Cantora":
      case "Cantor":
        return "bg-secondary/10 text-secondary";
      case "Músico":
      case "Música":
        return "bg-accent/10 text-accent";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Integrantes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os membros do ministério
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft">
          <Plus className="mr-2 h-4 w-4" />
          Novo Integrante
        </Button>
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar integrantes por nome, função ou instrumento..."
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-lg bg-gradient-card border border-border hover:shadow-soft transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-primary text-white font-semibold text-lg">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{member.name}</h3>
                      <Badge className={`mt-1 ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{member.phone}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {member.instruments.map((instrument) => (
                        <Badge
                          key={instrument}
                          variant="outline"
                          className="text-xs"
                        >
                          {instrument}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Contatar
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

export default Members;
