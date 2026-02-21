/**
 * Formulário de criação/edição completa de música em dialog.
 *
 * Usa react-hook-form com resolver Zod para validação.
 * Inclui 7 campos: nome, tonalidade (CreatableCombobox), artista (CreatableCombobox),
 * BPM, cifras, lyrics e link da versão.
 * Suporta modo edição via prop `musica`, pré-populando com `versoes[0]`.
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CreatableCombobox } from "@/components/CreatableCombobox";
import { useCreateMusicaComplete, useUpdateMusicaComplete } from "@/hooks/use-musicas";
import { useTonalidades, useCreateTonalidade } from "@/hooks/use-support";
import { useArtistas, useCreateArtista } from "@/hooks/use-artistas";
import {
  CreateMusicaCompleteFormSchema,
  type CreateMusicaCompleteForm,
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
 * Dialog com formulário para criar ou editar uma música com todos os campos.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o dialog do formulário expandido.
 */
export function MusicaForm({ open, onOpenChange, musica }: MusicaFormProps) {
  const isEditing = !!musica;
  /** Versão default (mais antiga por created_at) para pré-popular no modo edição. */
  const versaoDefault = musica?.versoes?.[0] ?? null;

  const form = useForm<CreateMusicaCompleteForm>({
    resolver: zodResolver(CreateMusicaCompleteFormSchema),
    defaultValues: {
      nome: "",
      fk_tonalidade: "",
      artista_id: "",
      bpm: "",
      cifras: "",
      lyrics: "",
      link_versao: "",
    },
  });

  const createMutation = useCreateMusicaComplete();
  const updateMutation = useUpdateMusicaComplete();
  const { data: tonalidades, isLoading: tonLoading } = useTonalidades();
  const { data: artistas, isLoading: artLoading } = useArtistas();
  const createTonalidade = useCreateTonalidade();
  const createArtista = useCreateArtista();

  const isPending = createMutation.isPending || updateMutation.isPending;

  /** Opções do combobox de tonalidades mapeadas para { value, label }. */
  const tonalidadeOptions = (tonalidades ?? []).map((t) => ({
    value: t.id,
    label: t.tom,
  }));

  /** Opções do combobox de artistas mapeadas para { value, label }. */
  const artistaOptions = (artistas ?? []).map((a) => ({
    value: a.id,
    label: a.nome,
  }));

  useEffect(
    /**
     * Reseta ou preenche o formulário ao abrir o dialog.
     * No modo edição, carrega os dados da música existente e da versão default;
     * no modo criação, reseta os campos para os valores padrão.
     */
    function resetOrPopulateForm() {
      if (!open) return;

      if (isEditing && musica) {
        form.reset({
          nome: musica.nome,
          fk_tonalidade: musica.tonalidade?.id ?? "",
          artista_id: versaoDefault?.artista?.id ?? "",
          bpm: versaoDefault?.bpm ?? "",
          cifras: versaoDefault?.cifras ?? "",
          lyrics: versaoDefault?.lyrics ?? "",
          link_versao: versaoDefault?.link_versao ?? "",
        });
      } else {
        form.reset({
          nome: "",
          fk_tonalidade: "",
          artista_id: "",
          bpm: "",
          cifras: "",
          lyrics: "",
          link_versao: "",
        });
      }
    },
    [open, isEditing, musica, versaoDefault, form],
  );

  /**
   * Submete o formulário, chamando a mutation de criação ou edição conforme o modo.
   *
   * @param dados - Dados validados do formulário.
   */
  function onSubmit(dados: CreateMusicaCompleteForm) {
    if (isEditing && musica) {
      updateMutation.mutate(
        {
          id: musica.id,
          dados: {
            ...dados,
            versao_id: versaoDefault?.id ?? "",
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
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      });
    }
  }

  /**
   * Cria uma tonalidade inline via CreatableCombobox e retorna seu UUID.
   *
   * @param input - Tom digitado pelo usuário.
   * @returns UUID da tonalidade criada ou `undefined` em caso de falha.
   */
  async function handleCreateTonalidade(input: string): Promise<string | undefined> {
    try {
      const result = await createTonalidade.mutateAsync({ tom: input });
      return result.tonalidade.id;
    } catch {
      return undefined;
    }
  }

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
    } catch {
      return undefined;
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Música" : "Nova Música"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados da música e da versão."
              : "Preencha os dados da nova música para o catálogo."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="max-h-[70vh] overflow-y-auto space-y-4 px-1">
              {/* Nome */}
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

              {/* Tonalidade (CreatableCombobox) */}
              <FormField
                control={form.control}
                name="fk_tonalidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tonalidade</FormLabel>
                    <FormControl>
                      <CreatableCombobox
                        options={tonalidadeOptions}
                        value={field.value || undefined}
                        onSelect={field.onChange}
                        onCreate={handleCreateTonalidade}
                        placeholder="Selecione uma tonalidade"
                        searchPlaceholder="Buscar tonalidade..."
                        createLabel={(input) => `Criar "${input}"`}
                        isLoading={tonLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Artista (CreatableCombobox) */}
              <FormField
                control={form.control}
                name="artista_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artista</FormLabel>
                    <FormControl>
                      <CreatableCombobox
                        options={artistaOptions}
                        value={field.value || undefined}
                        onSelect={field.onChange}
                        onCreate={handleCreateArtista}
                        placeholder="Selecione um artista"
                        searchPlaceholder="Buscar artista..."
                        createLabel={(input) => `Criar "${input}"`}
                        isLoading={artLoading}
                        disabled={isEditing && !!versaoDefault}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* BPM */}
              <FormField
                control={form.control}
                name="bpm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BPM</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Ex: 120"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cifras */}
              <FormField
                control={form.control}
                name="cifras"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cifras</FormLabel>
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

              {/* Lyrics */}
              <FormField
                control={form.control}
                name="lyrics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Letra</FormLabel>
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

              {/* Link da Versão */}
              <FormField
                control={form.control}
                name="link_versao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link da Versão</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
