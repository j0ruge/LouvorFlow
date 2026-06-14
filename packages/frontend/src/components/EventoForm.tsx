/**
 * Formulário de criação/edição de evento (escala) em dialog.
 *
 * Usa react-hook-form com resolver Zod para validação,
 * popula o select de tipos de evento via hook `useTiposEventos`,
 * e redireciona para a página de detalhe após sucesso na criação.
 * Suporta modo edição via prop `evento`. Inclui o campo opcional de URL da lista
 * CifraClub (`cifraclub_list_url`), normalizado para `null` quando vazio, com
 * preview debounced (500ms) da lista via `fetchListPreview` (cancelável por
 * `AbortController`) e guarda de permissão `escalas.write`.
 */

import { useEffect, useState } from "react";
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
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { DateTimePicker } from "@/components/DateTimePicker";
import { useCreateEvento, useUpdateEvento } from "@/hooks/use-eventos";
import { useTiposEventos } from "@/hooks/use-support";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useCan } from "@/hooks/use-can";
import {
  fetchListPreview,
  validateCifraclubListUrl,
  type ListPreview,
} from "@/lib/cifraclub-list-url";
import {
  CreateEventoFormSchema,
  type CreateEventoForm,
} from "@/schemas/evento";
import type { EventoIndex } from "@/schemas/evento";
import { toDatetimeLocalValue, localDatetimeToISO } from "@/lib/utils";

/**
 * Estado do preview da lista CifraClub no formulário de evento.
 * `idle`: nada a exibir; `loading`: busca em andamento; `system`: lista do
 * sistema (sem preview); `error`: preview indisponível; `loaded`: dados obtidos.
 */
type CifraclubPreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "system" }
  | { status: "error" }
  | { status: "loaded"; data: ListPreview };

/**
 * Renderiza o preview da lista CifraClub abaixo do campo de URL.
 *
 * Exibe o estado de carregamento, a indisponibilidade (lista do sistema ou
 * erro) ou os metadados da lista (nome, dono, total de músicas e visibilidade),
 * com aviso quando a lista não está marcada como pública. Empilha verticalmente
 * (mobile-first) e protege textos longos com `break-words` + `min-w-0`.
 *
 * @param props - Propriedades do componente.
 * @param props.state - Estado atual do preview.
 * @returns Bloco de preview, ou `null` quando ocioso.
 */
function CifraclubListPreview({ state }: { state: CifraclubPreviewState }) {
  if (state.status === "idle") return null;

  if (state.status === "loading") {
    return <p className="text-sm text-muted-foreground">Carregando preview…</p>;
  }

  if (state.status === "system") {
    return (
      <p className="text-sm text-muted-foreground">
        Lista do sistema — preview indisponível
      </p>
    );
  }

  if (state.status === "error") {
    return <p className="text-sm text-muted-foreground">Preview indisponível</p>;
  }

  const { name, ownerName, totalSongs, isPublic } = state.data;
  return (
    <div className="min-w-0 space-y-1 rounded-md border border-border bg-muted/40 p-3 text-sm">
      <p className="min-w-0 break-words">
        Lista: <span className="font-medium">{name || "—"}</span>
        {ownerName ? ` · por ${ownerName}` : ""}
        {` · ${totalSongs} ${totalSongs === 1 ? "música" : "músicas"}`}
        {` · ${isPublic ? "pública" : "privada"}`}
      </p>
      {!isPublic && (
        <p className="text-amber-600 dark:text-amber-500">
          ⚠ Lista não marcada como pública
        </p>
      )}
    </div>
  );
}

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
      cifraclub_list_url: null,
    },
  });

  const createMutation = useCreateEvento();
  const updateMutation = useUpdateEvento();
  const { data: tiposEventos, isLoading: tiposLoading, isError: tiposError, error: tiposErrorObj } = useTiposEventos();
  const { can: canWrite } = useCan("escalas.write");

  const isPending = createMutation.isPending || updateMutation.isPending;

  /** Estado do preview da lista CifraClub exibido abaixo do campo de URL. */
  const [listPreview, setListPreview] = useState<CifraclubPreviewState>({
    status: "idle",
  });

  /** Valor atual do campo de URL, debounceado em 500ms para evitar buscas a cada tecla. */
  const debouncedListUrl = useDebouncedValue(
    form.watch("cifraclub_list_url"),
    500,
  );

  useEffect(
    /**
     * Busca o preview da lista CifraClub sempre que a URL debounceada muda.
     * Ignora URLs vazias/inválidas (`idle`) e listas-sistema (`system`). Para
     * listas válidas, dispara `fetchListPreview` com um `AbortController` cujo
     * cleanup cancela a requisição anterior ao mudar a URL ou desmontar.
     */
    function fetchCifraclubListPreview() {
      const url = (debouncedListUrl ?? "").trim();
      if (!url) {
        setListPreview({ status: "idle" });
        return;
      }

      const { valid, isSystemList } = validateCifraclubListUrl(url);
      if (!valid) {
        setListPreview({ status: "idle" });
        return;
      }
      if (isSystemList) {
        setListPreview({ status: "system" });
        return;
      }

      const controller = new AbortController();
      setListPreview({ status: "loading" });

      fetchListPreview(url, controller.signal).then(function applyPreview(result) {
        if (controller.signal.aborted) return;
        setListPreview(
          result ? { status: "loaded", data: result } : { status: "error" },
        );
      });

      return function cancelPreviewFetch() {
        controller.abort();
      };
    },
    [debouncedListUrl],
  );

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
          data: toDatetimeLocalValue(evento.data),
          fk_tipo_evento: evento.tipoEvento?.id ?? "",
          descricao: evento.descricao,
          cifraclub_list_url: evento.cifraclub_list_url ?? null,
        });
      } else {
        form.reset({
          data: "",
          fk_tipo_evento: "",
          descricao: "",
          cifraclub_list_url: null,
        });
      }
    },
    [open, isEditing, evento, form],
  );

  /**
   * Submete o formulário de criação ou edição de evento.
   *
   * No modo edição, atualiza o evento existente e fecha o dialog.
   * No modo criação, cria o evento, fecha o dialog e redireciona
   * para `/escalas/:id` para associação de músicas e integrantes.
   *
   * @param dados - Dados validados do formulário.
   */
  function onSubmit(dados: CreateEventoForm) {
    const payload = {
      ...dados,
      data: localDatetimeToISO(dados.data),
    };

    if (isEditing && evento) {
      updateMutation.mutate(
        {
          id: evento.id,
          dados: {
            data: payload.data,
            fk_tipo_evento: payload.fk_tipo_evento,
            descricao: payload.descricao,
            cifraclub_list_url: payload.cifraclub_list_url || null,
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
      createMutation.mutate(payload, {
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
                  <FormLabel>Data *</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione a data e hora"
                    />
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
                  <FormLabel>Tipo de Evento *</FormLabel>
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
                  <FormLabel>Descrição (opcional)</FormLabel>
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
            <FormField
              control={form.control}
              name="cifraclub_list_url"
              render={({ field }) => {
                /** Input de URL reutilizado nas variantes com e sem permissão. */
                const urlInput = (
                  <Input
                    type="url"
                    placeholder="https://www.cifraclub.com.br/musico/.../repertorio/..."
                    className="w-full"
                    value={field.value ?? ""}
                    disabled={!canWrite}
                    onChange={(e) => field.onChange(e.target.value.trim() || null)}
                  />
                );

                return (
                  <FormItem>
                    <FormLabel>Lista no CifraClub (opcional)</FormLabel>
                    <FormControl>
                      {canWrite ? (
                        urlInput
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span tabIndex={0} className="block w-full">
                              {urlInput}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Sem permissão</TooltipContent>
                        </Tooltip>
                      )}
                    </FormControl>
                    <CifraclubListPreview state={listPreview} />
                    <FormMessage />
                  </FormItem>
                );
              }}
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
