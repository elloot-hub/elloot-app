"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function UiFormDemo() {
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="title">Título do anúncio</FieldLabel>
          <Input
            id="title"
            name="title"
            placeholder="Ex.: Conta Free Fire — 80 passes"
          />
          <FieldDescription>
            Seja específico: jogo, rank e o que está incluso.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="category">Categoria</FieldLabel>
          <Select defaultValue="accounts">
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="accounts">Contas</SelectItem>
              <SelectItem value="items">Itens</SelectItem>
              <SelectItem value="currency">Moedas</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field data-invalid>
          <FieldLabel htmlFor="description">Descrição</FieldLabel>
          <Textarea
            id="description"
            name="description"
            aria-invalid
            placeholder="Detalhes da entrega…"
          />
          <FieldError>Descrição obrigatória (exemplo de erro).</FieldError>
        </Field>
      </FieldGroup>

      <div className="flex flex-row gap-2 pt-1">
        <Button type="submit">Publicar</Button>
        <Button type="button" variant="secondary">
          Salvar rascunho
        </Button>
        <Button type="button" variant="ghost">
          Cancelar
        </Button>
      </div>
    </form>
  );
}
