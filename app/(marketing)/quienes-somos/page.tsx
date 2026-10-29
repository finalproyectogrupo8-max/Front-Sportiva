import type { Metadata } from 'next'
import InternalPage from '@/components/marketing/InternalPage'
import { Equipo } from '@/components/marketing/Equipo'

export const metadata: Metadata = {
  title: 'Quiénes somos',
  description: 'Conocé la visión y el equipo detrás de Sportiva.',
}

const items = [
  { index: '01', title: 'Nacimos en el club', description: 'Conocemos los vestuarios, las reuniones tarde y el enorme trabajo invisible detrás de cada fecha.', detail: 'Experiencia real' },
  { index: '02', title: 'Diseñamos para personas', description: 'Tecnología clara y accesible para dirigentes, profes, médicos y colaboradores.', detail: 'Sin curva de aprendizaje' },
  { index: '03', title: 'Construimos en equipo', description: 'Escuchamos a cada club y transformamos sus problemas diarios en soluciones concretas.', detail: 'Mejora continua' },
  { index: '04', title: 'Cuidamos el esfuerzo', description: 'Cada automatización devuelve tiempo a quienes sostienen la institución todos los días.', detail: 'Horas recuperadas' },
]

export default function QuienesSomosPage() {
  return (
    <InternalPage
      eyebrow="Tecnología con espíritu de club"
      title="ENTENDEMOS EL ESFUERZO"
      outline="DE HACER CLUB."
      description="Somos un equipo que combina deporte, producto y tecnología para profesionalizar la gestión sin perder la identidad que hace único a cada club."
      items={items}
      statement="AUTOMATIZAMOS LO ABURRIDO."
      statementAccent="POTENCIAMOS LO HUMANO."
    >
      <Equipo />
    </InternalPage>
  )
}