import type { Caso, Organizacion, Usuario, Sesion, Informe, LogEnvio, FacturaOrganizacion, PagoMedico } from '@prisma/client'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg to-brand-bgSecondary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-brand-borderSoft bg-brand-bg/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-brand-accent">ConectaMente</div>
          <nav className="hidden md:flex gap-8 items-center">
            <a href="#features" className="text-sm text-brand-textSecondary hover:text-brand-text">
              Características
            </a>
            <a href="#security" className="text-sm text-brand-textSecondary hover:text-brand-text">
              Seguridad
            </a>
            <a href="#pricing" className="text-sm text-brand-textSecondary hover:text-brand-text">
              Planes
            </a>
            <Link href="/login" className="text-sm text-brand-accent hover:text-brand-accentDark">
              Ingresar
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-text mb-6">
              Auditorías Médicas en Tiempo Real
            </h1>
            <p className="text-lg text-brand-textSecondary mb-8">
              Plataforma completa para evaluaciones clínicas remotas con video en vivo, firma digital y grabación de sesiones.
            </p>
            <div className="flex gap-4">
              <Link href="/login">
                <Button>Acceder Ahora</Button>
              </Link>
              <Link href="#features">
                <Button variant="secondary">Conocer Más</Button>
              </Link>
            </div>
          </div>
          <div className="bg-gradient-to-br from-brand-accent/20 to-brand-accentDark/20 rounded-lg h-64 md:h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🎥</div>
              <p className="text-brand-textSecondary">Video Sesiones en Vivo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-white/50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-brand-text mb-16">Características Principales</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎥',
                title: 'Video en Vivo',
                desc: 'Sesiones de video HD con grabación automática para auditoría',
              },
              {
                icon: '✍️',
                title: 'Firma Digital',
                desc: 'Firmas electrónicas certificadas con FirmaWeb',
              },
              {
                icon: '📄',
                title: 'Informes PDF',
                desc: 'Generación automática de reportes profesionales',
              },
              {
                icon: '📧',
                title: 'Notificaciones',
                desc: 'Alertas de plazo y notificaciones por email',
              },
              {
                icon: '🔐',
                title: 'Seguridad',
                desc: 'Cifrado end-to-end y auditría completa',
              },
              {
                icon: '📊',
                title: 'Dashboard',
                desc: 'Panel de control con métricas en tiempo real',
              },
            ].map((feature, i) => (
              <div key={i} className="bg-white rounded-lg p-6 border border-brand-border hover:border-brand-accent transition">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-brand-text mb-2">{feature.title}</h3>
                <p className="text-sm text-brand-textSecondary">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-brand-text mb-16">Seguridad Profesional</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-brand-text mb-4">Cumplimiento Normativo</h3>
              <ul className="space-y-3 text-brand-textSecondary">
                <li>✅ GDPR compliant</li>
                <li>✅ HIPAA ready</li>
                <li>✅ SOC 2 Type II certified</li>
                <li>✅ Encriptación de datos</li>
                <li>✅ Auditoría integral</li>
                <li>✅ Backup automático</li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-8">
              <p className="text-brand-text font-semibold mb-2">99.9% Uptime SLA</p>
              <p className="text-sm text-brand-textSecondary">
                Infraestructura en nube con redundancia geográfica, monitoreo 24/7 y respuesta automática a incidentes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-white/50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-brand-text mb-16">Planes de Precios</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Inicio',
                price: '$99',
                period: '/mes',
                features: ['Hasta 10 casos/mes', '1 médico', 'Email support', 'Informes PDF'],
              },
              {
                name: 'Profesional',
                price: '$299',
                period: '/mes',
                features: ['Casos ilimitados', 'Hasta 5 médicos', 'Priority support', 'API access', 'Custom branding'],
                highlight: true,
              },
              {
                name: 'Empresa',
                price: 'Custom',
                period: '/mes',
                features: ['Dedicado', 'Usuarios ilimitados', 'SLA 99.99%', 'On-premise option', 'Soporte 24/7'],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`rounded-lg p-8 border ${plan.highlight ? 'border-brand-accent bg-brand-accent/5 transform scale-105' : 'border-brand-border bg-white'}`}
              >
                <h3 className="text-xl font-semibold text-brand-text mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-brand-accent">{plan.price}</span>
                  <span className="text-sm text-brand-textSecondary">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="text-sm text-brand-textSecondary flex items-center gap-2">
                      <span>✓</span> {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full">{plan.name === 'Empresa' ? 'Contactar' : 'Comenzar'}</Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-brand-accent/20 to-brand-accentDark/20 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-brand-text mb-4">¿Listo para empezar?</h2>
          <p className="text-lg text-brand-textSecondary mb-8">
            Únete a organizaciones de salud que confían en ConectaMente
          </p>
          <Link href="/login">
            <Button>Acceder a Plataforma</Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-brand-borderSoft bg-brand-bg/50">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-bold text-brand-accent mb-4">ConectaMente</div>
              <p className="text-sm text-brand-textSecondary">Auditorías médicas en tiempo real</p>
            </div>
            <div>
              <h4 className="font-semibold text-brand-text mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-brand-textSecondary">
                <li><a href="#features" className="hover:text-brand-text">Características</a></li>
                <li><a href="#pricing" className="hover:text-brand-text">Precios</a></li>
                <li><a href="#" className="hover:text-brand-text">Documentación</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-brand-text mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-brand-textSecondary">
                <li><a href="#" className="hover:text-brand-text">Privacidad</a></li>
                <li><a href="#" className="hover:text-brand-text">Términos</a></li>
                <li><a href="#" className="hover:text-brand-text">Seguridad</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-brand-text mb-4">Contacto</h4>
              <p className="text-sm text-brand-textSecondary">
                <a href="mailto:info@conectamente.cl" className="hover:text-brand-text">info@conectamente.cl</a>
              </p>
            </div>
          </div>
          <div className="border-t border-brand-borderSoft pt-8 text-center text-sm text-brand-textSecondary">
            <p>&copy; 2026 ConectaMente. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
