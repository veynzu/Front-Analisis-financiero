import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { Text } from "@/components/atoms/Text";

export function HeroSection() {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-16 sm:py-20">
      <Heading level={1}>Diseño atómico con Next.js</Heading>
      <Text>
        Los átomos, moléculas y organismos viven en{" "}
        <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
          src/components
        </code>
        . Las rutas y páginas del App Router siguen en{" "}
        <code className="rounded bg-zinc-200 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
          src/app
        </code>{" "}
        e importan plantillas y organismos.
      </Text>
      <div className="flex flex-wrap gap-3">
        <Button type="button">Acción principal</Button>
        <Button type="button" variant="ghost">
          Secundaria
        </Button>
      </div>
    </section>
  );
}
