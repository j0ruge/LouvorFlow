/**
 * Formulário de criação de evento (escala) em dialog.
 *
 * Usa react-hook-form com resolver Zod para validação,
 * popula o select de tipos de evento via hook `useTiposEventos`,
 * e redireciona para a página de detalhe após sucesso.
 */

import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateEvento } from "@/hooks/use-eventos";
import { useTiposEventos } from "@/hooks/use-support";
import {
  CreateEventoFormSchema,
  type CreateEventoForm,
} from "@/schemas/evento";

/** Propriedades do componente EventoForm. */
interface EventoFormProps {
  /** Controla a visibilidade do dialog. */
  open: boolean;
  /** Callback para alterar a visibilidade do dialog. */
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog com formulário para criar um novo evento.
 *
 * Após criação bem-sucedida, redireciona para `/escalas/:id`
 * para que o usuário possa associar músicas e integrantes.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o dialog do formulário.
 */
export function EventoForm({ open, onOpenChange }: EventoFormProps) {
  const navigate = useNavigate();
  const form = useForm<CreateEventoForm>({
    resolver: zodResolver(CreateEventoFormSchema),
    defaultValues: {
      data: "",
      fk_tipo_evento: "",
      descricao: "",
    },
  });

  const createMutation = useCreateEvento();
  const { data: tiposEventos } = useTiposEventos();

  function onSubmit(dados: CreateEventoForm) {
    createMutation.mutate(dados, {
      onSuccess: (response) => {
        form.reset();
        onOpenChange(false);
        navigate(`/escalas/${response.evento.id}`);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Escala</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo evento. Após a criação, você poderá
            associar músicas e integrantes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fk_tipo_evento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Evento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposEventos?.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Descrição do evento"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
