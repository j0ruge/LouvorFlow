/**
 * Formulário de criação/edição de versão de música em dialog.
 *
 * Usa react-hook-form com resolver Zod para validação. Permite selecionar
 * artista (na criação), informar BPM, cifras, letras e link da versão.
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useArtistas } from "@/hooks/use-artistas";
import {
  CreateVersaoFormSchema,
  type CreateVersaoForm,
} from "@/schemas/musica";
import type { Versao } from "@/schemas/musica";

/** Propriedades do componente VersaoForm. */
interface VersaoFormProps {
  /** Controla a visibilidade do dialog. */
  open: boolean;
  /** Callback para alterar a visibilidade do dialog. */
  onOpenChange: (open: boolean) => void;
  /** Callback executado ao submeter o formulário. */
  onSubmit: (dados: CreateVersaoForm) => void;
  /** Indica se a operação está em andamento. */
  isPending: boolean;
  /** Dados da versão para modo edição (opcional). */
  versao?: Versao | null;
}

/**
 * Dialog com formulário para criar ou editar uma versão de música.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o dialog do formulário de versão.
 */
export function VersaoForm({
  open,
  onOpenChange,
  onSubmit,
  isPending,
  versao,
}: VersaoFormProps) {
  const isEditing = !!versao;
  const { data: artistas, isLoading: artistasLoading } = useArtistas();

  const form = useForm<CreateVersaoForm>({
    resolver: zodResolver(CreateVersaoFormSchema),
    defaultValues: {
      artista_id: "",
      bpm: "",
      cifras: "",
      lyrics: "",
      link_versao: "",
    },
  });

  useEffect(
    /**
     * Reseta ou preenche o formulário ao abrir o dialog.
     * No modo edição, carrega os dados da versão existente;
     * no modo criação, reseta os campos para os valores padrão.
     */
    function resetOrPopulateForm() {
      if (!open) return;

      if (isEditing && versao) {
        form.reset({
          artista_id: versao.artista.id,
          bpm: versao.bpm ?? "",
          cifras: versao.cifras ?? "",
          lyrics: versao.lyrics ?? "",
          link_versao: versao.link_versao ?? "",
        });
      } else {
        form.reset({
          artista_id: "",
          bpm: "",
          cifras: "",
          lyrics: "",
          link_versao: "",
        });
      }
    },
    [open, isEditing, versao, form],
  );

  /**
   * Delega a submissão dos dados validados ao callback `onSubmit`.
   *
   * @param dados - Dados validados do formulário de versão.
   */
  function handleSubmit(dados: CreateVersaoForm) {
    onSubmit(dados);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Versão" : "Nova Versão"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados da versão."
              : "Preencha os dados da nova versão da música."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="artista_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Artista</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={artistasLoading || isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um artista" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {artistasLoading && (
                        <SelectItem value="_loading" disabled>
                          Carregando...
                        </SelectItem>
                      )}
                      {artistas?.map((artista) => (
                        <SelectItem key={artista.id} value={artista.id}>
                          {artista.nome}
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
              name="bpm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>BPM (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex.: 120"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cifras"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cifras (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cole as cifras aqui..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lyrics"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Letras (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Cole a letra aqui..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="link_versao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://youtube.com/..."
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
