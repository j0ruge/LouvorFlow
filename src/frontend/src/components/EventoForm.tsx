/**
 * Formulário de criação/edição de evento (escala) em dialog.
 *
 * Usa react-hook-form com resolver Zod para validação,
 * popula o select de tipos de evento via hook `useTiposEventos`,
 * e redireciona para a página de detalhe após sucesso na criação.
 * Suporta modo edição via prop `evento`.
 */

import { useEffect } from "react";
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
import { useCreateEvento, useUpdateEvento } from "@/hooks/use-eventos";
import { useTiposEventos } from "@/hooks/use-support";
import {
  CreateEventoFormSchema,
  type CreateEventoForm,
} from "@/schemas/evento";
import type { EventoIndex } from "@/schemas/evento";

/** Propriedades do componente EventoForm. */
interface EventoFormProps {
  /** Controla a visibilidade do dialog. */
  open: boolean;
  /** Callback para alterar a visibilidade do dialog. */
  onOpenChange: (open: boolean) => void;
  /** Dados do evento para modo edição (opcional). */
  evento?: EventoIndex | null;
}

/**
 * Dialog com formulário para criar ou editar um evento.
 *
 * Após criação bem-sucedida, redireciona para `/escalas/:id`
 * para que o usuário possa associar músicas e integrantes.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o dialog do formulário.
 */
export function EventoForm({ open, onOpenChange, evento }: EventoFormProps) {
  const isEditing = !!evento;
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
  const updateMutation = useUpdateEvento();
  const { data: tiposEventos, isLoading: tiposLoading, isError: tiposError, error: tiposErrorObj } = useTiposEventos();

  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(
    /**
     * Reseta ou preenche o formulário ao abrir o dialog.
     * No modo edição, carrega os dados do evento existente;
     * no modo criação, reseta os campos para os valores padrão.
     */
    function resetOrPopulateForm() {
      if (!open) return;

      if (isEditing && evento) {
        form.reset({
          data: evento.data.slice(0, 16),
          fk_tipo_evento: evento.tipoEvento?.id ?? "",
          descricao: evento.descricao,
        });
      } else {
        form.reset({
          data: "",
          fk_tipo_evento: "",
          descricao: "",
        });
      }
    },
    [open, isEditing, evento, form],
  );

  function onSubmit(dados: CreateEventoForm) {
    if (isEditing && evento) {
      updateMutation.mutate(
        {
          id: evento.id,
          dados: {
            data: dados.data,
            fk_tipo_evento: dados.fk_tipo_evento,
            descricao: dados.descricao,
          },
        },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
    } else {
      createMutation.mutate(dados, {
        onSuccess: (response) => {
          form.reset();
          onOpenChange(false);
          navigate(`/escalas/${response.evento.id}`);
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Escala" : "Nova Escala"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados da escala."
              : "Preencha os dados do novo evento. Após a criação, você poderá associar músicas e integrantes."}
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
                    value={field.value}
                    disabled={tiposLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tiposLoading && (
                        <SelectItem value="_loading" disabled>
                          Carregando...
                        </SelectItem>
                      )}
                      {tiposEventos?.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id}>
                          {tipo.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tiposError && (
                    <p className="text-sm text-destructive">
                      Falha ao carregar tipos: {tiposErrorObj?.message ?? "Erro desconhecido"}
                    </p>
                  )}
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
              <Button type="submit" disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
