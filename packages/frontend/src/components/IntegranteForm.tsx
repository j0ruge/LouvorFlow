/**
 * Formulário de criação/edição de integrante em dialog.
 *
 * Usa react-hook-form com resolver Zod para validação,
 * preserva dados no formulário em caso de erro de envio,
 * e reseta apenas após sucesso da mutation.
 * Suporta modo edição via prop `integranteId`.
 * Inclui seção de gestão de funções com badges removíveis e seletor.
 */

import { useEffect, useState } from "react";
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
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CornerDownLeft, X } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateIntegrante,
  useIntegrante,
  useUpdateIntegrante,
  useAddFuncaoIntegrante,
  useRemoveFuncaoIntegrante,
} from "@/hooks/use-integrantes";
import { useFuncoes } from "@/hooks/use-support";
import {
  CreateIntegranteFormSchema,
  UpdateIntegranteFormSchema,
  type UpdateIntegranteForm,
} from "@/schemas/integrante";
import { useDirtyFormGuard } from "@/hooks/use-dirty-form-guard";

/** Propriedades do componente IntegranteForm. */
interface IntegranteFormProps {
  /** Controla a visibilidade do dialog. */
  open: boolean;
  /** Callback para alterar a visibilidade do dialog. */
  onOpenChange: (open: boolean) => void;
  /** UUID do integrante a editar. Quando definido, ativa modo edição. */
  integranteId?: string | null;
}

/**
 * Dialog com formulário para criar ou editar um integrante.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o dialog do formulário.
 */
export function IntegranteForm({
  open,
  onOpenChange,
  integranteId,
}: IntegranteFormProps) {
  const isEditing = !!integranteId;
  const [selectedFuncaoId, setSelectedFuncaoId] = useState("");

  const form = useForm<UpdateIntegranteForm>({
    resolver: zodResolver(
      isEditing ? UpdateIntegranteFormSchema : CreateIntegranteFormSchema,
    ),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      telefone: "",
    },
  });

  const { data: integrante, isLoading: isLoadingIntegrante } =
    useIntegrante(integranteId ?? null);
  const createMutation = useCreateIntegrante();
  const updateMutation = useUpdateIntegrante();
  const { data: allFuncoes } = useFuncoes();

  const addFuncao = useAddFuncaoIntegrante(integranteId ?? "");
  const removeFuncao = useRemoveFuncaoIntegrante(integranteId ?? "");

  const isPending =
    createMutation.isPending || updateMutation.isPending || addFuncao.isPending;

  /**
   * Guarda de alterações não salvas: fechar por Esc/backdrop/X/Cancelar com
   * o formulário sujo exibe o veil de confirmação em vez de descartar tudo.
   * Permanece armado durante submit pendente (ver comentário no MusicaForm).
   */
  const guarda = useDirtyFormGuard({
    temAlteracoes: form.formState.isDirty,
    aoFechar: () => onOpenChange(false),
  });

  /** Funções disponíveis para adição (excluindo já atribuídas). */
  const funcoesAtribuidas = integrante?.funcoes ?? [];
  const funcoesAtribuidasIds = new Set(funcoesAtribuidas.map((f) => f.id));
  const funcoesDisponiveis = allFuncoes?.filter((f) => !funcoesAtribuidasIds.has(f.id)) ?? [];

  useEffect(
    /**
     * Reseta ou preenche o formulário ao abrir o dialog.
     * No modo edição, carrega os dados do integrante existente;
     * no modo criação, reseta os campos para os valores padrão.
     */
    function resetOrPopulateForm() {
      if (!open) return;

      if (isEditing && integrante) {
        form.reset({
          nome: integrante.nome,
          email: integrante.email,
          senha: "",
          telefone: integrante.telefone ?? "",
        });
      } else if (!isEditing) {
        form.reset({
          nome: "",
          email: "",
          senha: "",
          telefone: "",
        });
      }
    },
    [open, isEditing, integrante, form],
  );

  /**
   * Envia os dados do formulário para criação ou atualização.
   *
   * No modo edição, se houver uma função selecionada no dropdown
   * que ainda não foi adicionada, adiciona primeiro via `addFuncao`
   * e só depois dispara o `updateMutation`, evitando race condition
   * e garantindo que o dialog só feche após ambas as operações.
   *
   * No modo criação, `CreateIntegranteFormSchema` garante senha
   * obrigatória; o invariant em runtime serve apenas para narrowing
   * de tipo e para surfaceá-lo (toast + console) caso o schema mude
   * sem o `onSubmit` ser atualizado em conjunto.
   */
  async function onSubmit(dados: UpdateIntegranteForm) {
    if (isEditing && integranteId) {
      const payload = { ...dados };
      if (!payload.senha) {
        delete payload.senha;
      }

      if (selectedFuncaoId) {
        try {
          await addFuncao.mutateAsync(selectedFuncaoId);
          setSelectedFuncaoId("");
        } catch {
          return;
        }
      }

      updateMutation.mutate(
        { id: integranteId, dados: payload },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
    } else {
      // Em modo criação, o resolver é `CreateIntegranteFormSchema` (senha
      // obrigatória ≥ 6 chars), então este guard nunca deveria disparar
      // em runtime; existe para estreitar `senha?: string` → `string` sob
      // `strictNullChecks`. Se acionar, é invariant violation — surface.
      if (!dados.senha) {
        console.error(
          "Invariant violation: senha obrigatória ausente em modo criação",
        );
        toast.error("Erro inesperado: senha obrigatória ausente.");
        return;
      }
      createMutation.mutate(
        { ...dados, senha: dados.senha },
        {
          onSuccess: () => {
            form.reset();
            onOpenChange(false);
          },
        },
      );
    }
  }

  /** Adiciona uma função ao integrante. */
  function handleAddFuncao() {
    if (!selectedFuncaoId) return;
    addFuncao.mutate(selectedFuncaoId, {
      onSuccess: () => setSelectedFuncaoId(""),
    });
  }

  return (
    <Form {...form}>
      <ResponsiveFormDialog
        open={open}
        onOpenChange={onOpenChange}
        title={isEditing ? "Editar Integrante" : "Novo Integrante"}
        description={
          isEditing
            ? "Altere os dados do integrante."
            : "Preencha os dados do novo integrante do ministério."
        }
        onSubmit={form.handleSubmit(onSubmit)}
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
            <Button
              type="submit"
              disabled={isPending || (isEditing && isLoadingIntegrante)}
            >
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        {isEditing && isLoadingIntegrante ? (
          <p className="py-4 text-center text-muted-foreground">
            Carregando dados...
          </p>
        ) : (
          <>
              <RequiredFieldsLegend />
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>Nome</FieldLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" aria-required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FieldLabel required>E-mail</FieldLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        aria-required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    {/* Senha só é obrigatória na criação — na edição, vazio mantém a atual. */}
                    <FieldLabel required={!isEditing}>
                      Senha{isEditing ? " (opcional)" : ""}
                    </FieldLabel>
                    <FormControl>
                      <PasswordInput
                        placeholder={
                          isEditing
                            ? "Deixe em branco para manter"
                            : "Mínimo 6 caracteres"
                        }
                        aria-required={!isEditing}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="telefone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="(00) 00000-0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seção de funções (apenas no modo edição) */}
              {isEditing && integranteId && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <FormLabel>Funções</FormLabel>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={selectedFuncaoId}
                      onValueChange={setSelectedFuncaoId}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Adicionar função..." />
                      </SelectTrigger>
                      <SelectContent>
                        {funcoesDisponiveis.map((funcao) => (
                          <SelectItem key={funcao.id} value={funcao.id}>
                            {funcao.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddFuncao}
                      disabled={!selectedFuncaoId || addFuncao.isPending}
                      aria-label="Adicionar função"
                    >
                      <CornerDownLeft className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {funcoesAtribuidas.map((funcao) => (
                      <Badge key={funcao.id} variant="outline" className="gap-1">
                        {funcao.nome}
                        <button
                          type="button"
                          onClick={() => removeFuncao.mutate(funcao.id)}
                          disabled={removeFuncao.isPending}
                          className="ml-1 hover:text-destructive"
                          aria-label={`Remover função ${funcao.nome}`}
                        >
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </Badge>
                    ))}
                    {funcoesAtribuidas.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Nenhuma função atribuída.
                      </p>
                    )}
                  </div>
                </div>
              )}

          </>
        )}
      </ResponsiveFormDialog>
    </Form>
  );
}
