import Link from "next/link";
import { CircleAlertIcon, InfoIcon } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { UiFormDemo } from "@/components/ui-lab/form-demo";
import { Container } from "@/components/layout/container";

export const metadata = {
  title: "Design system",
};

const swatches = [
  { name: "primary", className: "bg-primary", token: "217 91% 60%" },
  { name: "secondary", className: "bg-secondary border border-border", token: "0 0% 96%" },
  { name: "muted", className: "bg-muted border border-border", token: "0 0% 96%" },
  { name: "accent", className: "bg-accent border border-border", token: "0 0% 96%" },
  { name: "destructive", className: "bg-destructive", token: "0 84% 60%" },
  { name: "background", className: "bg-background border border-border", token: "0 0% 100%" },
  { name: "foreground", className: "bg-foreground", token: "0 0% 10%" },
  { name: "border", className: "bg-border", token: "0 0% 92%" },
] as const;

export default function UiPage() {
  return (
    <main className="flex-1 py-12 sm:py-16">
      <Container className="space-y-12 animate-rise">
        <header className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Badge>shadcn/ui · Geist · light/dark</Badge>
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Elloot UI
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Tema azul Minimal Light / Dark (Color Lab). Base shadcn — pronta para
            blocos do{" "}
            <a
              className="text-primary underline-offset-4 hover:underline"
              href="https://ui.aceternity.com/"
              target="_blank"
              rel="noreferrer"
            >
              Aceternity
            </a>
            ,{" "}
            <a
              className="text-primary underline-offset-4 hover:underline"
              href="https://21st.dev/"
              target="_blank"
              rel="noreferrer"
            >
              21st
            </a>{" "}
            e{" "}
            <a
              className="text-primary underline-offset-4 hover:underline"
              href="https://reactbits.dev/"
              target="_blank"
              rel="noreferrer"
            >
              React Bits
            </a>
            .
          </p>
          <Link
            href="/"
            className="inline-block text-sm font-medium text-primary hover:underline underline-offset-4"
          >
            ← Voltar ao início
          </Link>
        </header>

        <Separator />

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Cores</h2>
            <p className="text-sm text-muted-foreground">
              Tokens shadcn em <code className="text-foreground">globals.css</code>
              . Primary: <code className="text-foreground">hsl(217 91% 60%)</code>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {swatches.map((s) => (
              <div key={s.name} className="space-y-2">
                <div className={`h-14 rounded-lg ${s.className}`} />
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {s.token}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Tipografia</h2>
            <p className="text-sm text-muted-foreground">
              Geist Sans + Geist Mono (fallback: ui-sans-serif / system-ui)
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Marketplace com escrow
            </p>
            <p className="text-2xl font-semibold tracking-tight">
              Liberação após entrega
            </p>
            <p className="text-base">
              Texto principal para descrições e conteúdo de leitura.
            </p>
            <p className="text-sm text-muted-foreground">
              Secundário para apoio, metadados e hints.
            </p>
            <p className="font-mono text-sm text-muted-foreground">
              Mono: order_id · webhook · PIX
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Botões</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="xs">XS</Button>
            <Button size="sm">SM</Button>
            <Button size="default">Default</Button>
            <Button size="lg">LG</Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Badges</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>default</Badge>
            <Badge variant="secondary">pago</Badge>
            <Badge variant="outline">rascunho</Badge>
            <Badge variant="destructive">disputa</Badge>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight">Alertas</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Alert>
              <InfoIcon />
              <AlertTitle>Pagamento confirmado</AlertTitle>
              <AlertDescription>
                O valor ficou retido no escrow até a confirmação.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Falha no saque</AlertTitle>
              <AlertDescription>
                Verifique a chave PIX e tente de novo.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Card + formulário</h2>
            <p className="text-sm text-muted-foreground">
              Surface interativa com Field, Input, Select e Textarea shadcn.
            </p>
          </div>
          <Card className="max-w-lg">
            <CardHeader>
              <CardTitle>Novo anúncio</CardTitle>
              <CardDescription>
                Exemplo de formulário do MVP Elloot.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UiFormDemo />
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                import {"{ Button }"} from &quot;@/components/ui/button&quot;
              </p>
            </CardFooter>
          </Card>
        </section>

        <Separator />

        <footer className="pb-8 space-y-2">
          <p className="text-sm text-muted-foreground">
            Adicionar componentes:{" "}
            <code className="text-foreground">
              npx shadcn@latest add [nome]
            </code>
          </p>
          <p className="text-sm text-muted-foreground">
            Futuro: registries Aceternity / 21st / React Bits via{" "}
            <code className="text-foreground">components.json</code>.
          </p>
        </footer>
      </Container>
    </main>
  );
}
