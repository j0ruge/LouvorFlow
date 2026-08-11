/**
 * Formulário de criação/edição de versão de música em dialog.
 *
 * Usa react-hook-form com resolver Zod para validação. Permite selecionar
 * artista (na criação), informar BPM, cifras, letras e link da versão.
 */

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ResponsiveFormDialog } from "@/components/ResponsiveFormDialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { IntensidadeSelector } from "@/components/IntensidadeSelector";
import { CreatableCombobox } from "@/components/CreatableCombobox";
import { useArtistas, useCreateArtista } from "@/hooks/use-artistas";
import { useAuth } from "@/hooks/use-auth";
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
  const { isAdmin, isSuperAdmin } = useAuth();
  /**
   * Indica se o usuário pode trocar o artista de uma versão já vinculada.
   * Por padrão o campo Artista fica imutável após cadastrado para evitar
   * mudanças acidentais; admins/super-admins podem corrigir o vínculo.
   */
  const podeAlterarArtistaExistente = isAdmin || isSuperAdmin;
  const artistaBloqueado = isEditing && !!versao?.artista && !podeAlterarArtistaExistente;
  const exibirAvisoAlteracaoArtista =
    isEditing && !!versao?.artista && podeAlterarArtistaExistente;
  const { data: artistas, isLoading: artistasLoading } = useArtistas();
  const createArtista = useCreateArtista();

  /** Opções do combobox de artistas mapeadas para { value, label }. */
  const artistaOptions = useMemo(
    () => (artistas ?? []).map((a) => ({ value: a.id, label: a.nome })),
    [artistas],
  );

  const form = useForm<CreateVersaoForm>({
    resolver: zodResolver(CreateVersaoFormSchema),
    defaultValues: {
      artista_id: "",
      bpm: "",
      cifras: "",
      lyrics: "",
      link_versao: "",
      cifraclub_url: "",
      intensidade: "",
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
          artista_id: versao.artista?.id ?? "",
          bpm: versao.bpm ?? "",
          cifras: versao.cifras ?? "",
          lyrics: versao.lyrics ?? "",
          link_versao: versao.link_versao ?? "",
          cifraclub_url: versao.cifraclub_url ?? "",
          intensidade: versao.intensidade ?? "",
        });
      } else {
        form.reset({
          artista_id: "",
          bpm: "",
          cifras: "",
          lyrics: "",
          link_versao: "",
          cifraclub_url: "",
          intensidade: "",
        });
      }
    },
    [open, isEditing, versao, form],
  );

  /**
   * Cria um artista inline via CreatableCombobox e retorna seu UUID.
   *
   * @param input - Nome digitado pelo usuário.
   * @returns UUID do artista criado ou `undefined` em caso de falha.
   */
  async function handleCreateArtista(input: string): Promise<string | undefined> {
    try {
      const result = await createArtista.mutateAsync({ nome: input });
      return result.artista.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar artista";
      toast.error(message);
      return undefined;
    }
  }

  return (
    <Form {...form}>
      <ResponsiveFormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={isEditing ? "Editar Versão" : "Nova Versão"}
        description={
          isEditing
            ? "Altere os dados da versão."
            : "Preencha os dados da nova versão da música."
        }
        onSubmit={form.handleSubmit(onSubmit)}
        contentClassName="sm:max-w-[500px]"
        footer={
          <>
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
          </>
        }
      >
        <FormField
          control={form.control}
          name="artista_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artista (opcional)</FormLabel>
              <FormControl>
                <CreatableCombobox
                  options={artistaOptions}
                  value={field.value || undefined}
                  onSelect={field.onChange}
                  onCreate={handleCreateArtista}
                  placeholder="Não informado (opcional)"
                  searchPlaceholder="Buscar artista..."
                  isLoading={artistasLoading}
                  disabled={artistaBloqueado}
                  aria-describedby={
                    exibirAvisoAlteracaoArtista
                      ? "versao-artista-aviso"
                      : undefined
                  }
                />
              </FormControl>
              {exibirAvisoAlteracaoArtista && (
                <p
                  id="versao-artista-aviso"
                  className="text-xs text-muted-foreground"
                >
                  Alterar o artista move esta versão para outro artista. Use apenas para corrigir cadastros.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="intensidade"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intensidade (opcional)</FormLabel>
              <FormControl>
                <IntensidadeSelector
                  value={field.value}
                  onChange={field.onChange}
                />
              </FormControl>
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
                  min={30}
                  max={220}
                  inputMode="numeric"
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
        <FormField
          control={form.control}
          name="cifraclub_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link CifraClub (opcional)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://www.cifraclub.com.br/artista/musica/"
                  className="w-full"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </ResponsiveFormDialog>
    </Form>
  );
}
