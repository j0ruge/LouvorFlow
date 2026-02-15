import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Plus, Search, Mail, Phone } from "lucide-react";

const Members = () => {
  const members = [
    {
      id: "1",
      nome: "João Silva",
      doc_id: "123.456.789-00",
      email: "joao@exemplo.com",
      telefone: "(11) 98765-4321",
      funcoes: [{ id: "f1", nome: "Ministro" }, { id: "f2", nome: "Violão" }],
    },
    {
      id: "2",
      nome: "Maria Santos",
      doc_id: "234.567.890-11",
      email: "maria@exemplo.com",
      telefone: "(11) 98765-4322",
      funcoes: [{ id: "f3", nome: "Vocal" }],
    },
    {
      id: "3",
      nome: "Pedro Costa",
      doc_id: "345.678.901-22",
      email: "pedro@exemplo.com",
      telefone: "(11) 98765-4323",
      funcoes: [{ id: "f4", nome: "Bateria" }, { id: "f5", nome: "Percussão" }],
    },
    {
      id: "4",
      nome: "Ana Oliveira",
      doc_id: "456.789.012-33",
      email: "ana@exemplo.com",
      telefone: "(11) 98765-4324",
      funcoes: [{ id: "f3", nome: "Vocal" }, { id: "f6", nome: "Teclado" }],
    },
    {
      id: "5",
      nome: "Carlos Lima",
      doc_id: "567.890.123-44",
      email: "carlos@exemplo.com",
      telefone: "(11) 98765-4325",
      funcoes: [{ id: "f7", nome: "Guitarra" }, { id: "f8", nome: "Baixo" }],
    },
    {
      id: "6",
      nome: "Lucas Pereira",
      doc_id: "678.901.234-55",
      email: "lucas@exemplo.com",
      telefone: "(11) 98765-4326",
      funcoes: [{ id: "f6", nome: "Teclado" }, { id: "f9", nome: "Piano" }],
    },
  ];

  const getInitials = (nome: string) => {
    return nome
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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
                      {getInitials(member.nome)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">{member.nome}</h3>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{member.email}</span>
                      </div>
                      {member.telefone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{member.telefone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {member.funcoes.map((funcao) => (
                        <Badge
                          key={funcao.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {funcao.nome}
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
