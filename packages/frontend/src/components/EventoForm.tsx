/**
 * Formulário de criação/edição/duplicação de evento (escala) em dialog.
 *
 * Usa react-hook-form com resolver Zod para validação,
 * popula o select de tipos de evento via hook `useTiposEventos`,
 * e redireciona para a página de detalhe após sucesso na criação.
 * Suporta modo edição via prop `evento` e modo duplicação via prop
 * `duplicarDe` — o modo é DERIVADO das props (nunca booleanos acumulados),
 * e os três modos compartilham os mesmos campos, o mesmo select de tipos
 * (com seus estados de erro) e a mesma validação Zod, num lugar só.
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResponsiveFormDialog } from "@/components/ResponsiveFormDialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { FieldLabel } from "@/components/form/FieldLabel";
import { RequiredFieldsLegend } from "@/components/form/RequiredFieldsLegend";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/DateTimePicker";
import {
  useCreateEvento,
  useUpdateEvento,
  useDuplicarEvento,
} from "@/hooks/use-eventos";
import { useTiposEventos } from "@/hooks/use-support";
import {
  CreateEventoFormSchema,
  type CreateEventoForm,
} from "@/schemas/evento";
import type { EventoIndex } from "@/schemas/evento";
import { toDatetimeLocalValue, localDatetimeToISO } from "@/lib/utils";
import { useDirtyFormGuard } from "@/hooks/use-dirty-form-guard";

/** Modo de operação do formulário, derivado das props `evento`/`duplicarDe`. */
type ModoFormulario = "criar" | "editar" | "duplicar";

/** Textos do dialog (título, descrição e CTA) por modo de operação. */
const COPY_POR_MODO: Record<
  ModoFormulario,
  { titulo: string; descricao: string; cta: string; ctaPendente: string }
> = {
  criar: {
    titulo: "Nova Escala",
    descricao:
      "Preencha os dados do novo evento. Após a criação, você poderá associar músicas e integrantes.",
    cta: "Salvar",
    ctaPendente: "Salvando...",
  },
  editar: {
    titulo: "Editar Escala",
    descricao: "Altere os dados da escala.",
    cta: "Salvar",
    ctaPendente: "Salvando...",
  },
  duplicar: {
    titulo: "Duplicar Escala",
    descricao:
      "Revise a data. O repertório e a equipe da escala original serão copiados.",
    cta: "Criar cópia",
    ctaPendente: "Criando cópia...",
  },
};

/** Propriedades do componente EventoForm. */
interface EventoFormProps {
  /** Controla a visibilidade do dialog. */
  open: boolean;
  /** Callback para alterar a visibilidade do dialog. */
  onOpenChange: (open: boolean) => void;
  /** Dados do evento para modo edição (opcional). */
  evento?: EventoIndex | null;
  /**
   * Escala de origem para modo duplicação (opcional). Quando presente (e
   * `evento` ausente), o formulário abre com tipo e descrição pré-preenchidos
   * da origem e a data VAZIA — o usuário revisa a data da cópia.
   */
  duplicarDe?: EventoIndex | null;
}

/**
 * Dialog com formulário para criar, editar ou duplicar um evento.
 *
 * Após criação bem-sucedida, redireciona para `/escalas/:id`
 * para que o usuário possa associar músicas e integrantes.
 * Na duplicação e no rascunho, permanece na página — a cópia já nasce com
 * repertório/equipe e o rascunho é um "guardar para depois"; em ambos os
 * casos o feedback é o item aparecendo na lista.
 *
 * DECISÃO (lacuna do plano, registrada pelo coordenador): o fluxo de
 * rascunho precisa de um ponto de criação. Em vez de um quarto modo, o modo
 * criação ganha apenas um botão secundário "Salvar rascunho" que submete o
 * MESMO formulário (mesma validação Zod) com `status: "rascunho"` — KISS.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o dialog do formulário.
 */
export function EventoForm({
  open,
  onOpenChange,
  evento,
  duplicarDe,
}: EventoFormProps) {
  /** Modo derivado das props: `evento` → editar; `duplicarDe` → duplicar; senão criar. */
  const modo: ModoFormulario = evento
    ? "editar"
    : duplicarDe
      ? "duplicar"
      : "criar";
  const copy = COPY_POR_MODO[modo];
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
  const duplicarMutation = useDuplicarEvento();
  const { data: tiposEventos, isLoading: tiposLoading, isError: tiposError, error: tiposErrorObj } = useTiposEventos();

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    duplicarMutation.isPending;

  /**
   * Guarda de alterações não salvas: fechar por Esc/backdrop/X/Cancelar com
   * o formulário sujo exibe o veil de confirmação em vez de descartar tudo.
   * Permanece armado durante submit pendente (ver comentário no MusicaForm).
   */
  const guarda = useDirtyFormGuard({
    temAlteracoes: form.formState.isDirty,
    aoFechar: () => onOpenChange(false),
  });

  useEffect(
    /**
     * Reseta ou preenche o formulário ao abrir o dialog conforme o modo.
     * Edição carrega os dados do evento existente; duplicação pré-preenche
     * tipo e descrição da origem com a data vazia (o usuário revisa a data);
     * criação reseta os campos para os valores padrão.
     */
    function resetOrPopulateForm() {
      if (!open) return;

      if (modo === "editar" && evento) {
        form.reset({
          data: toDatetimeLocalValue(evento.data),
          fk_tipo_evento: evento.tipoEvento?.id ?? "",
          descricao: evento.descricao,
        });
      } else if (modo === "duplicar" && duplicarDe) {
        form.reset({
          data: "",
          fk_tipo_evento: duplicarDe.tipoEvento?.id ?? "",
          descricao: duplicarDe.descricao,
        });
      } else {
        form.reset({
          data: "",
          fk_tipo_evento: "",
          descricao: "",
        });
      }
    },
    [open, modo, evento, duplicarDe, form],
  );

  /**
   * Submete o formulário conforme o modo derivado.
   *
   * Edição atualiza o evento e fecha o dialog. Duplicação cria a cópia (o
   * backend copia repertório e equipe da origem) e fecha, sem navegar — a
   * cópia aparece na lista. Criação cria o evento e, quando publicado,
   * redireciona para `/escalas/:id` para associar músicas e integrantes;
   * como rascunho, apenas fecha (o rascunho é um "guardar para depois").
   *
   * @param dados - Dados validados do formulário.
   * @param opcoes - `comoRascunho` cria o evento com `status: "rascunho"` (só no modo criação).
   */
  function submeter(dados: CreateEventoForm, opcoes?: { comoRascunho?: boolean }) {
    const payload = {
      ...dados,
      data: localDatetimeToISO(dados.data),
    };

    if (modo === "editar" && evento) {
      updateMutation.mutate(
        {
          id: evento.id,
          dados: {
            data: payload.data,
            fk_tipo_evento: payload.fk_tipo_evento,
            descricao: payload.descricao,
          },
        },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
    } else if (modo === "duplicar" && duplicarDe) {
      duplicarMutation.mutate(
        { id: duplicarDe.id, dados: payload },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
    } else {
      const dadosCriacao = opcoes?.comoRascunho
        ? { ...payload, status: "rascunho" as const }
        : payload;
      createMutation.mutate(dadosCriacao, {
        onSuccess: (response) => {
          form.reset();
          onOpenChange(false);
          if (!opcoes?.comoRascunho) {
            navigate(`/escalas/${response.evento.id}`);
          }
        },
      });
    }
  }

  /**
   * Submit alternativo do modo criação: valida com o MESMO resolver Zod e,
   * válido, cria o evento com `status: "rascunho"`.
   */
  const submeterRascunho = form.handleSubmit((dados) =>
    submeter(dados, { comoRascunho: true }),
  );

  return (
    <Form {...form}>
      <ResponsiveFormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={copy.titulo}
        description={copy.descricao}
        onSubmit={form.handleSubmit((dados) => submeter(dados))}
        contentClassName="sm:max-w-[425px]"
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
            {modo === "criar" && (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => submeterRascunho()}
              >
                Salvar rascunho
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? copy.ctaPendente : copy.cta}
            </Button>
          </>
        }
      >
            <RequiredFieldsLegend />
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FieldLabel required>Data</FieldLabel>
                  <FormControl>
                    {/*
                      `aria-required` não é aplicado aqui: o DateTimePicker não
                      encaminha props ao controle interno (dívida de a11y
                      registrada em .claude/rules/frontend-react.md).
                    */}
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
                  <FieldLabel required>Tipo de Evento</FieldLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={tiposLoading}
                  >
                    <FormControl>
                      <SelectTrigger aria-required>
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
      </ResponsiveFormDialog>
    </Form>
  );
}
