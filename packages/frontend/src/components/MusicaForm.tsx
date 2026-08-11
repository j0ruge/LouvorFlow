/**
 * Formulário de criação/edição completa de música em dialog.
 *
 * Usa react-hook-form com resolver Zod para validação.
 * Inclui 9 campos: nome, tonalidade (CreatableCombobox), artista (CreatableCombobox),
 * BPM, cifras, lyrics, link da versão, categorias (CreatableMultiCombobox) e
 * funções requeridas (CreatableMultiCombobox).
 * Suporta modo edição via prop `musica`, pré-populando com `versoes[0]`.
 */

import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResponsiveFormDialog } from "@/components/ResponsiveFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { CreatableMultiCombobox } from "@/components/CreatableMultiCombobox";
import { IntensidadeSelector } from "@/components/IntensidadeSelector";
import { useCreateMusicaComplete, useUpdateMusicaComplete } from "@/hooks/use-musicas";
import { useTonalidades, useCreateTonalidade, useCategorias, useCreateCategoria, useFuncoes, useCreateFuncao } from "@/hooks/use-support";
import { useArtistas, useCreateArtista } from "@/hooks/use-artistas";
import {
  CreateMusicaCompleteFormSchema,
  type CreateMusicaCompleteForm,
} from "@/schemas/musica";
import type { Musica } from "@/schemas/musica";
import { useFormDraft } from "@/hooks/use-form-draft";
import { useDirtyFormGuard } from "@/hooks/use-dirty-form-guard";

/** Valores padrão (vazios) para o formulário de criação de música. */
const MUSICA_FORM_DEFAULTS: CreateMusicaCompleteForm = {
  nome: "",
  fk_tonalidade: "",
  artista_id: "",
  bpm: "",
  cifras: "",
  lyrics: "",
  link_versao: "",
  cifraclub_url: "",
  intensidade: "",
  categoria_ids: [],
  funcao_ids: [],
};

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
  const versaoDefault = useMemo(
    () => musica?.versoes?.[0] ?? null,
    [musica],
  );

  const form = useForm<CreateMusicaCompleteForm>({
    resolver: zodResolver(CreateMusicaCompleteFormSchema),
    defaultValues: MUSICA_FORM_DEFAULTS,
  });

  const { draft, hasDraft, saveDraft, clearDraft, clearStorage } = useFormDraft();

  /** Controla a visibilidade do AlertDialog de recuperação de rascunho. */
  const [draftPromptOpen, setDraftPromptOpen] = useState(false);

  /** Indica se o formulário foi submetido com sucesso (evita salvar rascunho ao fechar). */
  const submittedRef = useRef(false);

  /** Indica se o rascunho já foi processado nesta abertura do dialog (evita re-execuções). */
  const draftInitializedRef = useRef(false);

  const createMutation = useCreateMusicaComplete();
  const updateMutation = useUpdateMusicaComplete();
  const { data: tonalidades, isLoading: tonLoading } = useTonalidades();
  const { data: artistas, isLoading: artLoading } = useArtistas();
  const { data: categorias, isLoading: catLoading } = useCategorias();
  const { data: funcoes, isLoading: funLoading } = useFuncoes();
  const createTonalidade = useCreateTonalidade();
  const createArtista = useCreateArtista();
  const createCategoriaMutation = useCreateCategoria();
  const createFuncaoMutation = useCreateFuncao();

  const isPending = createMutation.isPending || updateMutation.isPending;

  /**
   * Guarda de alterações não salvas — **só no modo edição**. No modo criação
   * a proteção continua sendo o rascunho do `useFormDraft` (salvo ao fechar e
   * oferecido no AlertDialog "Recuperar rascunho?"); somar o veil ali seria
   * fazer duas perguntas contraditórias ao usuário.
   *
   * Sem `!isPending` de propósito: com submit in-flight o guard desarmaria
   * (Esc/backdrop fechariam sem confirmação) e uma mutation que falha
   * perderia tudo que foi digitado. O caminho feliz não precisa disso — o
   * `onSuccess` fecha via `onOpenChange(false)` do pai (não passa pelo
   * guard) e o `form.reset()` derruba `temAlteracoes`, fechando o veil
   * sozinho.
   */
  const guarda = useDirtyFormGuard({
    temAlteracoes: isEditing && form.formState.isDirty,
    aoFechar: () => handleOpenChange(false),
  });

  /** Opções do combobox de tonalidades mapeadas para { value, label }. */
  const tonalidadeOptions = useMemo(
    () => (tonalidades ?? []).map((t) => ({ value: t.id, label: t.tom })),
    [tonalidades],
  );

  /** Opções do combobox de artistas mapeadas para { value, label }. */
  const artistaOptions = useMemo(
    () => (artistas ?? []).map((a) => ({ value: a.id, label: a.nome })),
    [artistas],
  );

  /** Opções do multi-combobox de categorias mapeadas para { value, label }. */
  const categoriaOptions = useMemo(
    () => (categorias ?? []).map((c) => ({ value: c.id, label: c.nome })),
    [categorias],
  );

  /** Opções do multi-combobox de funções mapeadas para { value, label }. */
  const funcaoOptions = useMemo(
    () => (funcoes ?? []).map((f) => ({ value: f.id, label: f.nome })),
    [funcoes],
  );

  useEffect(
    /**
     * Reseta ou preenche o formulário ao abrir o dialog.
     * No modo edição, carrega os dados da música existente e da versão default.
     * No modo criação, verifica se existe rascunho salvo: se sim, carrega-o e
     * abre o AlertDialog de recuperação; se não, reseta para os valores padrão.
     * Usa `draftInitializedRef` para evitar re-execuções quando `draft`/`hasDraft`
     * mudam enquanto o dialog já está aberto (ex.: ao descartar rascunho).
     */
    function resetOrPopulateForm() {
      if (!open) {
        draftInitializedRef.current = false;
        return;
      }

      if (draftInitializedRef.current) return;
      draftInitializedRef.current = true;

      if (isEditing && musica) {
        form.reset({
          nome: musica.nome,
          fk_tonalidade: musica.tonalidade?.id ?? "",
          artista_id: versaoDefault?.artista?.id ?? "",
          bpm: versaoDefault?.bpm ?? "",
          cifras: versaoDefault?.cifras ?? "",
          lyrics: versaoDefault?.lyrics ?? "",
          link_versao: versaoDefault?.link_versao ?? "",
          cifraclub_url: versaoDefault?.cifraclub_url ?? "",
          intensidade: versaoDefault?.intensidade ?? "",
          categoria_ids: musica.categorias.map((c) => c.id),
          funcao_ids: musica.funcoes.map((f) => f.id),
        });
      } else if (hasDraft && draft) {
        form.reset(draft);
        setDraftPromptOpen(true);
      } else {
        form.reset(MUSICA_FORM_DEFAULTS);
      }
    },
    [open, isEditing, musica, versaoDefault, form, hasDraft, draft],
  );

  /**
   * Intercepta o fechamento do dialog para salvar rascunho automaticamente.
   * Salva apenas no modo criação e quando o formulário não foi submetido.
   *
   * @param nextOpen - Novo estado de visibilidade do dialog.
   */
  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen && !isEditing && !submittedRef.current) {
      saveDraft(form.getValues());
    }
    if (!nextOpen) {
      submittedRef.current = false;
    }
    onOpenChange(nextOpen);
  }

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
            versao_id: versaoDefault?.id,
          },
        },
        {
          onSuccess: () => {
            submittedRef.current = true;
            form.reset();
            handleOpenChange(false);
          },
        },
      );
    } else {
      createMutation.mutate(dados, {
        onSuccess: () => {
          submittedRef.current = true;
          clearDraft();
          form.reset();
          handleOpenChange(false);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar tonalidade";
      toast.error(message);
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar artista";
      toast.error(message);
      return undefined;
    }
  }

  /**
   * Cria uma categoria inline via CreatableMultiCombobox e retorna seu UUID.
   *
   * @param input - Nome digitado pelo usuário.
   * @returns UUID da categoria criada ou `undefined` em caso de falha.
   */
  async function handleCreateCategoria(input: string): Promise<string | undefined> {
    try {
      const result = await createCategoriaMutation.mutateAsync({ nome: input });
      return result.categoria.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar categoria";
      toast.error(message);
      return undefined;
    }
  }

  /**
   * Cria uma função inline via CreatableMultiCombobox e retorna seu UUID.
   *
   * @param input - Nome digitado pelo usuário.
   * @returns UUID da função criada ou `undefined` em caso de falha.
   */
  async function handleCreateFuncao(input: string): Promise<string | undefined> {
    try {
      const result = await createFuncaoMutation.mutateAsync({ nome: input });
      return result.funcao.id;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao criar função";
      toast.error(message);
      return undefined;
    }
  }

  return (
    <>
    <Form {...form}>
      <ResponsiveFormDialog
        open={open}
        onOpenChange={handleOpenChange}
        title={isEditing ? "Editar Música" : "Nova Música"}
        description={
          isEditing
            ? "Altere os dados da música e da versão."
            : "Preencha os dados da nova música para o catálogo."
        }
        onSubmit={form.handleSubmit(onSubmit)}
        contentClassName="sm:max-w-[600px]"
        dirtyGuard={guarda}
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => guarda.pedirFechamento()}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
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

              {/* Intensidade (pill buttons) */}
              <FormField
                control={form.control}
                name="intensidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Intensidade</FormLabel>
                    <FormControl>
                      <IntensidadeSelector
                        value={field.value as "calma" | "media" | "agitada" | "" | undefined}
                        onChange={field.onChange}
                      />
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
                    <FormLabel>Artista (opcional)</FormLabel>
                    <FormControl>
                      <CreatableCombobox
                        options={artistaOptions}
                        value={field.value || undefined}
                        onSelect={field.onChange}
                        onCreate={handleCreateArtista}
                        placeholder="Selecione um artista"
                        searchPlaceholder="Buscar artista..."
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
                        min={30}
                        max={220}
                        inputMode="numeric"
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

              {/* Link CifraClub */}
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

              {/* Categorias (CreatableMultiCombobox) */}
              <FormField
                control={form.control}
                name="categoria_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categorias</FormLabel>
                    <FormControl>
                      <CreatableMultiCombobox
                        options={categoriaOptions}
                        value={field.value ?? []}
                        onValueChange={field.onChange}
                        onCreate={handleCreateCategoria}
                        placeholder="Selecione categorias"
                        searchPlaceholder="Buscar categoria..."
                        isLoading={catLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Funções Requeridas (CreatableMultiCombobox) */}
              <FormField
                control={form.control}
                name="funcao_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funções Requeridas</FormLabel>
                    <FormControl>
                      <CreatableMultiCombobox
                        options={funcaoOptions}
                        value={field.value ?? []}
                        onValueChange={field.onChange}
                        onCreate={handleCreateFuncao}
                        placeholder="Selecione funções"
                        searchPlaceholder="Buscar função..."
                        isLoading={funLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
      </ResponsiveFormDialog>
    </Form>

    <AlertDialog open={draftPromptOpen} onOpenChange={setDraftPromptOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Recuperar rascunho?</AlertDialogTitle>
          <AlertDialogDescription>
            {draft?.nome
              ? `Você tem um rascunho salvo para "${draft.nome}". Deseja continuar de onde parou?`
              : "Você tem um rascunho salvo. Deseja continuar de onde parou?"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              clearDraft();
              form.reset(MUSICA_FORM_DEFAULTS);
              setDraftPromptOpen(false);
            }}
          >
            Descartar
          </AlertDialogCancel>
          <AlertDialogAction onClick={() => clearStorage()}>
            Recuperar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
