/**
 * Formulário de criação/edição de integrante em dialog.
 *
 * Usa react-hook-form com resolver Zod para validação,
 * preserva dados no formulário em caso de erro de envio,
 * e reseta apenas após sucesso da mutation.
 * Suporta modo edição via prop `integranteId`.
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
import { Button } from "@/components/ui/button";
import {
  useCreateIntegrante,
  useIntegrante,
  useUpdateIntegrante,
} from "@/hooks/use-integrantes";
import {
  CreateIntegranteFormSchema,
  UpdateIntegranteFormSchema,
  type UpdateIntegranteForm,
} from "@/schemas/integrante";

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

  const form = useForm<UpdateIntegranteForm>({
    resolver: zodResolver(
      isEditing ? UpdateIntegranteFormSchema : CreateIntegranteFormSchema,
    ),
    defaultValues: {
      nome: "",
      doc_id: "",
      email: "",
      senha: "",
      telefone: "",
    },
  });

  const { data: integrante, isLoading: isLoadingIntegrante } =
    useIntegrante(integranteId ?? null);
  const createMutation = useCreateIntegrante();
  const updateMutation = useUpdateIntegrante();

  const isPending = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;

    if (isEditing && integrante) {
      form.reset({
        nome: integrante.nome,
        doc_id: integrante.doc_id,
        email: integrante.email,
        senha: "",
        telefone: integrante.telefone ?? "",
      });
    } else if (!isEditing) {
      form.reset({
        nome: "",
        doc_id: "",
        email: "",
        senha: "",
        telefone: "",
      });
    }
  }, [open, isEditing, integrante, form]);

  /** Envia os dados do formulário para criação ou atualização. */
  function onSubmit(dados: UpdateIntegranteForm) {
    if (isEditing && integranteId) {
      const payload = { ...dados };
      if (!payload.senha) {
        delete payload.senha;
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
            {isEditing ? "Editar Integrante" : "Novo Integrante"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Altere os dados do integrante."
              : "Preencha os dados do novo integrante do ministério."}
          </DialogDescription>
        </DialogHeader>

        {isEditing && isLoadingIntegrante ? (
          <p className="py-4 text-center text-muted-foreground">
            Carregando dados...
          </p>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="doc_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Documento</FormLabel>
                    <FormControl>
                      <Input placeholder="CPF ou RG" {...field} />
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
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
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
                    <FormLabel>
                      Senha{isEditing ? " (opcional)" : ""}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={
                          isEditing
                            ? "Deixe em branco para manter"
                            : "Mínimo 6 caracteres"
                        }
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
        )}
      </DialogContent>
    </Dialog>
  );
}
