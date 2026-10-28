'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { PageShell } from './SiteChrome'
import { ArrowUpRight, CheckIcon } from './icons'

type Item = {
  index: string
  title: string
  description: string
  detail?: string
}

type InternalPageProps = {
  eyebrow: string
  title: string
  outline: string
  description: string
  items: Item[]
  statement: string
  statementAccent: string
}

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
}

export default function InternalPage({
  eyebrow,
  title,
  outline,
  description,
  items,
  statement,
  statementAccent,
}: InternalPageProps) {
  return (
    <PageShell>
      <section className="route-hero">
        <div className="route-grid" aria-hidden="true" />
        <motion.div
          className="route-hero-copy"
          initial="hidden"
          animate="visible"
          variants={reveal}
          transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="route-eyebrow"><i />{eyebrow}</span>
          <h1>{title}<br /><em>{outline}</em></h1>
          <p>{description}</p>
          <Link className="primary-cta" href="/contacto">
            <span>Conocé Sportiva en acción</span><ArrowUpRight />
          </Link>
        </motion.div>
        <motion.div
          className="route-panel"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: .7, delay: .15 }}
        >
          <div className="route-panel-top"><span>Operación del club</span><b>En vivo</b></div>
          {items.slice(0, 3).map((item) => (
            <div className="route-panel-row" key={item.index}>
              <span><CheckIcon /></span>
              <div><b>{item.title}</b><small>{item.detail ?? 'Todo actualizado'}</small></div>
            </div>
          ))}
        </motion.div>
      </section>

      <section className="route-list-section">
        <div className="route-section-head">
          <span>Lo que cambia</span>
          <h2>TODO CONECTADO.<br /><em>NADA LIBRADO AL AZAR.</em></h2>
        </div>
        <div className="route-items">
          {items.map((item, index) => (
            <motion.article
              key={item.index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: .35 }}
              transition={{ delay: index * .08 }}
            >
              <span>{item.index}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <i><ArrowUpRight /></i>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="route-statement">
        <span>Sportiva</span>
        <h2>{statement}<br /><em>{statementAccent}</em></h2>
        <Link href="/contacto">Empezar ahora <ArrowUpRight /></Link>
      </section>
    </PageShell>
  )
}