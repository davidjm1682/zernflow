import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  GitBranch,
  MessageSquare,
  Users,
  Radio,
  MessageCircle,
  Zap,
  CheckCircle,
  TrendingUp,
  Heart,
  Github,
  X,
  Check,
  Sparkles,
  ListOrdered,
  Link2,
} from "lucide-react";
import { PlatformIcon } from "@/components/platform-icon";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="ZernFlow" width={28} height={28} className="rounded-lg" />
            <span className="text-base font-bold text-gray-900">ZernFlow</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="https://github.com/zernio-dev/zernflow"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-900 sm:inline-flex"
            >
              <Github className="h-4 w-4" />
              Danos una estrella en GitHub
            </Link>
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm text-gray-500 hover:text-gray-900"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Empieza gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-20 sm:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5">
            <span className="text-xs font-medium text-indigo-700">Licencia MIT</span>
            <Link
              href="https://github.com/zernio-dev/zernflow"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-700"
            >
              Ver en GitHub <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            La alternativa{" "}
            <span className="text-indigo-600">open source a ManyChat</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-gray-500">
            Automatiza mensajes directos, comentarios y flujos en Instagram, Facebook, WhatsApp,
            Telegram, X, Bluesky y Reddit. Gratis, autoalojable y pensado para desarrolladores.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 sm:w-auto"
            >
              Empieza gratis
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="https://github.com/zernio-dev/zernflow"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
            >
              <Github className="h-4 w-4" />
              Ver código fuente
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">Licencia MIT. Autoalójalo o usa nuestra nube. Sin tarjeta de crédito.</p>
        </div>

        {/* Flow builder preview */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-xl">
            <div className="flex items-center gap-2 border-b border-gray-200 bg-white px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-300" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-300" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-300" />
              <span className="ml-3 text-xs text-gray-400">Flujo de bienvenida</span>
            </div>
            <div className="relative flex min-h-[300px] items-center justify-center gap-4 p-8 sm:gap-6 sm:p-12"
              style={{
                backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            >
              {/* Trigger */}
              <div className="w-40 rounded-xl border-2 border-indigo-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50">
                    <MessageCircle className="h-3.5 w-3.5 text-indigo-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-900">Disparador de comentario</span>
                </div>
                <p className="text-[10px] text-gray-500">Palabra clave: &quot;info&quot;</p>
              </div>

              <div className="hidden h-0.5 w-6 bg-gray-300 sm:block" />

              {/* Send DM */}
              <div className="hidden w-44 rounded-xl border-2 border-emerald-200 bg-white p-4 shadow-sm sm:block">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50">
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-900">Enviar DM</span>
                </div>
                <p className="text-[10px] text-gray-500">&quot;¡Hola! Aquí tienes el enlace...&quot;</p>
              </div>

              <div className="hidden h-0.5 w-6 bg-gray-300 sm:block" />

              {/* Tag */}
              <div className="w-36 rounded-xl border-2 border-amber-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50">
                    <Users className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-900">Etiquetar como lead</span>
                </div>
                <p className="text-[10px] text-gray-500">Etiqueta: &quot;interesado&quot;</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platforms */}
      <section className="border-y border-gray-100 bg-gray-50/60 py-10">
        <div className="mx-auto max-w-6xl px-6">
          <p className="mb-4 text-center text-xs font-medium uppercase tracking-wider text-gray-400">Funciona con 7 plataformas (ManyChat solo admite 2)</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { name: "Instagram", platform: "instagram" },
              { name: "Facebook", platform: "facebook" },
              { name: "WhatsApp", platform: "whatsapp" },
              { name: "Telegram", platform: "telegram" },
              { name: "X / Twitter", platform: "twitter" },
              { name: "Bluesky", platform: "bluesky" },
              { name: "Reddit", platform: "reddit" },
            ].map((p) => (
              <span key={p.platform} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500">
                <PlatformIcon platform={p.platform} size={18} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ManyChat comparison */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Por qué los equipos se cambian desde ManyChat
            </h2>
            <p className="mt-3 text-base text-gray-500">
              Las mismas funciones en las que confías. Más plataformas. Sin cuota mensual.
            </p>
          </div>
          <div className="mx-auto mt-12 max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-gray-200">
              {/* Header */}
              <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50">
                <div className="px-6 py-4" />
                <div className="border-l border-gray-200 px-6 py-4 text-center">
                  <p className="text-sm font-semibold text-gray-400">ManyChat</p>
                </div>
                <div className="border-l border-gray-200 bg-indigo-50 px-6 py-4 text-center">
                  <p className="text-sm font-semibold text-indigo-600">ZernFlow</p>
                </div>
              </div>
              {/* Rows */}
              {[
                { feature: "Instagram y Facebook", manychat: true, zernflow: true },
                { feature: "WhatsApp", manychat: true, zernflow: true },
                { feature: "Telegram", manychat: false, zernflow: true },
                { feature: "X / Twitter", manychat: false, zernflow: true },
                { feature: "Bluesky y Reddit", manychat: false, zernflow: true },
                { feature: "Constructor visual de flujos", manychat: true, zernflow: true },
                { feature: "Respuestas con IA (con tu propia clave)", manychat: true, zernflow: true },
                { feature: "Elige tu proveedor de IA", manychat: false, zernflow: true },
                { feature: "Comentario a DM", manychat: true, zernflow: true },
                { feature: "Bandeja de chat en vivo", manychat: true, zernflow: true },
                { feature: "Secuencias / campañas de goteo", manychat: true, zernflow: true },
                { feature: "CRM de contactos", manychat: true, zernflow: true },
                { feature: "Código abierto", manychat: false, zernflow: true },
                { feature: "Autoalojable", manychat: false, zernflow: true },
                { feature: "Gratis para siempre", manychat: false, zernflow: true },
              ].map((row) => (
                <div key={row.feature} className="grid grid-cols-3 border-b border-gray-100 last:border-b-0">
                  <div className="px-6 py-3">
                    <p className="text-sm text-gray-700">{row.feature}</p>
                  </div>
                  <div className="flex items-center justify-center border-l border-gray-100 px-6 py-3">
                    {row.manychat ? (
                      <Check className="h-4 w-4 text-gray-300" />
                    ) : (
                      <X className="h-4 w-4 text-gray-300" />
                    )}
                  </div>
                  <div className="flex items-center justify-center border-l border-gray-100 bg-indigo-50/30 px-6 py-3">
                    <Check className="h-4 w-4 text-indigo-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Todo lo que necesitas para crecer en redes
            </h2>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: MessageCircle,
                title: "Comentario a DM",
                desc: "¿Alguien comenta una palabra clave? Envíale al instante por DM tu enlace, oferta o lead magnet.",
              },
              {
                icon: GitBranch,
                title: "Constructor visual de flujos",
                desc: "Flujos de conversación de arrastrar y soltar. Mensajes de bienvenida, seguimientos, embudos de venta. Sin código.",
              },
              {
                icon: Sparkles,
                title: "Respuestas con IA",
                desc: "Deja que la IA atienda las conversaciones. Elige tu proveedor: OpenAI, Anthropic o Google. Tu API key, tu decisión.",
              },
              {
                icon: MessageSquare,
                title: "Bandeja de chat en vivo",
                desc: "Todos tus DMs en un solo lugar. El bot se encarga de lo sencillo y tú entras cuando importa.",
              },
              {
                icon: Users,
                title: "CRM de contactos",
                desc: "Etiqueta a tu audiencia, crea segmentos y sigue las interacciones. El mensaje correcto para las personas correctas.",
              },
              {
                icon: Radio,
                title: "Difusiones",
                desc: "Envía promociones y novedades a tu audiencia. Segmenta por etiquetas, plataforma o segmentos.",
              },
              {
                icon: ListOrdered,
                title: "Secuencias",
                desc: "Campañas de goteo en piloto automático. Mensaje, espera, mensaje. Inscribe contactos desde los flujos.",
              },
              {
                icon: Link2,
                title: "Herramientas de crecimiento",
                desc: "Genera enlaces de inicio de DM para cada plataforma. Compártelos donde quieras para iniciar conversaciones.",
              },
              {
                icon: Zap,
                title: "Webhooks y API",
                desc: "Conéctate con cualquier herramienta. Envía leads a Google Sheets, activa Zapier, llama a APIs externas.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white p-6">
                  <Icon className="mb-3 h-5 w-5 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open source section */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1">
                <Github className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-500">Licencia MIT</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Código abierto de verdad. Sin falsas promesas.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-500">
                ZernFlow es totalmente de código abierto bajo la licencia MIT. Lee cada línea de código,
                autoalójalo en tu propia infraestructura o haz un fork y hazlo tuyo.
                Sin trucos de &ldquo;open core&rdquo;, sin funciones solo para empresas detrás de un muro de pago.
              </p>
              <p className="mt-3 text-base leading-relaxed text-gray-500">
                Tus automatizaciones, tus contactos, tus datos. Todo es tuyo.
                Sin dependencia de proveedor, nunca.
              </p>
              <div className="mt-6">
                <Link
                  href="https://github.com/zernio-dev/zernflow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Github className="h-4 w-4" />
                  Danos una estrella en GitHub
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: "7 plataformas, una sola herramienta", detail: "Instagram, Facebook, WhatsApp, Telegram, X, Bluesky, Reddit. ManyChat solo hace 3." },
                { label: "Gratis para siempre", detail: "Sin cuotas mensuales. Sin cargos por cuenta. Sin límites de funciones." },
                { label: "Autoalojable", detail: "Clona el repositorio, define tus variables de entorno y despliega. Tu servidor, tus reglas." },
                { label: "Impulsado por la comunidad", detail: "Construido en público. Los PRs son bienvenidos. La hoja de ruta la marcan los usuarios, no los inversores." },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-gray-200 px-5 py-4">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="mt-0.5 text-sm text-gray-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100 bg-gray-50/60 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Funcionando en 5 minutos
          </h2>
          <div className="mx-auto mt-14 grid max-w-3xl gap-10 sm:grid-cols-3">
            {[
              {
                step: "1",
                icon: CheckCircle,
                title: "Conecta tus cuentas",
                desc: "Vincula tu Instagram, Facebook, WhatsApp, Telegram o cualquier otra plataforma en unos clics.",
              },
              {
                step: "2",
                icon: GitBranch,
                title: "Crea un flujo",
                desc: "Usa el constructor visual para crear tu automatización. Elige un disparador, añade mensajes y define condiciones.",
              },
              {
                step: "3",
                icon: TrendingUp,
                title: "Míralo crecer",
                desc: "Tus flujos funcionan 24/7. Capta leads, responde preguntas y vende mientras duermes.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50">
                    <Icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
            Pensado para creadores, negocios y agencias
          </h2>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
            {[
              {
                icon: Heart,
                title: "Creadores",
                desc: "Responde comentarios automáticamente, envía lead magnets por DM y haz crecer tu lista de correo desde redes.",
              },
              {
                icon: TrendingUp,
                title: "Pequeños negocios",
                desc: "Califica leads mediante conversaciones por DM, responde preguntas frecuentes al instante y agenda citas en piloto automático.",
              },
              {
                icon: Users,
                title: "Agencias",
                desc: "Gestiona las cuentas de todos tus clientes en un solo espacio de trabajo. Crea flujos una vez y reutilízalos en varias marcas.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-6">
                  <Icon className="mb-3 h-5 w-5 text-indigo-500" />
                  <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-2xl bg-indigo-600 p-10 sm:p-14">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                Deja de pagar por automatización de chat
              </h2>
              <p className="mt-3 text-sm text-indigo-100">
                Cámbiate desde ManyChat en minutos. Importa tus flujos, conecta tus cuentas y sal en vivo.
                Gratis para siempre, código abierto, licencia MIT.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-indigo-600 shadow-sm hover:bg-indigo-50"
                >
                  Empieza gratis
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="https://github.com/zernio-dev/zernflow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-indigo-400 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-500"
                >
                  <Github className="h-4 w-4" />
                  Danos una estrella en GitHub
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">ZernFlow</span>
            <span className="text-sm text-gray-300">|</span>
            <Link
              href="https://github.com/zernio-dev/zernflow"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </Link>
            <Link
              href="https://zernio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/powered-by-zernio.svg" alt="Powered by Zernio" className="h-10" />
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            Código abierto, licencia MIT
          </p>
        </div>
      </footer>
    </div>
  );
}
