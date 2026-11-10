import { Agenda } from "@/components/Agenda";

export default function Inicio() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Agenda de citas</h1>
      <p className="mt-1 text-texto-suave">Atención de 08:00 a 17:00, en bloques de 30 minutos.</p>
      <div className="mt-6">
        <Agenda />
      </div>
    </main>
  );
}
