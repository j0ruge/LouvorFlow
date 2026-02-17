/**
 * Formulário de criação/edição de música em dialog.
 *
 * Usa react-hook-form com resolver Zod para validação,
 * popula o select de tonalidades via hook `useTonalidades`,
 * e reseta apenas após sucesso da mutation.
 * Suporta modo edição via prop `musica`.
 */

import { useEffect } from "react";
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
import { useCreateMusica, useUpdateMusica } from "@/hooks/use-musicas";
import { useTonalidades } from "@/hooks/use-support";
import {
  CreateMusicaFormSchema,
  type CreateMusicaForm,
} from "@/schemas/musica";
import type { Musica } from "@/schemas/musica";

/** Propriedades do componente MusicaForm. */
interface MusicaFormProps {
  /** Controla a visibilidade do dialog. */
  open: boolean;
  /** Callback para alterar a visibilidade do dialog. */
  onOpenChange: (open: boolean) => void;
  /** Dados da música para modo edição (opcional). */
  musica?: Musica | null;
}

/**
 * Dialog com formulário para criar ou editar uma música.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o dialog do formulário.
 */
export function MusicaForm({ open, onOpenChange, musica }: MusicaFormProps) {
  const isEditing = !!musica;

  const form = useForm<CreateMusicaForm>({
    resolver: zodResolver(CreateMusicaFormSchema),
    defaultValues: {
      nome: "",
      fk_tonalidade: "",
    },
  });

  const createMutation = useCreateMusica();
  const updateMutation = useUpdateMusica();
  const { data: tonalidades, isLoading: tonLoading, isError: tonError, error: tonErrorObj } = useTonalidades();

  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(
    /**
     * Reseta ou preenche o formulário ao abrir o dialog.
     * No modo edição, carrega os dados da música existente;
     * no modo criação, reseta os campos para os valores padrão.
     */
    function resetOrPopulateForm() {
      if (!open) return;

      if (isEditing && musica) {
        form.reset({
          nome: musica.nome,
          fk_tonalidade: musica.tonalidade?.id ?? "",
        });
      } else {
        form.reset({
          nome: "",
          fk_tonalidade: "",
        });
      }
    },
    [open, isEditing, musica, form],
  );

  function onSubmit(dados: CreateMusicaForm) {
    if (isEditing && musica) {
      updateMutation.mutate(
        { id: musica.id, dados },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
    } else {
      createMutation.mutate(dados, {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Música" : "Nova Música"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados da música."
              : "Preencha os dados da nova música para o catálogo."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da música" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fk_tonalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tonalidade</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={tonLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma tonalidade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tonLoading && (
                        <SelectItem value="_loading" disabled>
                          Carregando...
                        </SelectItem>
                      )}
                      {tonalidades?.map((ton) => (
                        <SelectItem key={ton.id} value={ton.id}>
                          {ton.tom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tonError && (
                    <p className="text-sm text-destructive">
                      Falha ao carregar tonalidades: {tonErrorObj?.message ?? "Erro desconhecido"}
                    </p>
                  )}
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
