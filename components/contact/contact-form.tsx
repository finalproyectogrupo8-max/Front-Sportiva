'use client'

import { useActionState, useRef, useState } from 'react'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitTicket } from '@/lib/actions/tickets'
import { INITIAL_ADMIN_ACTION_STATE } from '@/lib/admin-types'

export function ContactForm() {
  const [state, action, pending] = useActionState(submitTicket, INITIAL_ADMIN_ACTION_STATE)
  const formRef = useRef<HTMLFormElement>(null)
  const [resetCount, setResetCount] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  const showSuccess = state.ok && !dismissed

  const handleReset = () => {
    setDismissed(true)
    setResetCount((c) => c + 1)
  }

  const handleSubmit = (formData: FormData) => {
    setDismissed(false)
    action(formData)
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center text-foreground animate-in fade-in-50 duration-200">
        <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-1.5 max-w-md">
          <h3 className="font-display text-2xl font-bold uppercase text-foreground">
            ¡Mensaje enviado!
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {state.message || 'Recibimos tu consulta correctamente. Te responderemos a la brevedad.'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          className="mt-2"
        >
          Enviar otra consulta
        </Button>
      </div>
    )
  }

  const errors = state.errors ?? {}

  return (
    <form key={resetCount} ref={formRef} action={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Honeypot antispam oculto */}
      <input
        type="text"
        name="hp"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Nombre */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-name">
            Nombre y apellido <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            placeholder="Ej. Juan Pérez"
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'contact-name-error' : undefined}
            className="h-11"
          />
          {errors.name?.[0] && (
            <p id="contact-name-error" className="text-xs text-destructive">
              {errors.name[0]}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-email">
            Correo electrónico <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="juan@ejemplo.com"
            required
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            className="h-11"
          />
          {errors.email?.[0] && (
            <p id="contact-email-error" className="text-xs text-destructive">
              {errors.email[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Club (opcional) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="contact-club">Nombre de tu club</Label>
            <span className="text-xs text-muted-foreground">Opcional</span>
          </div>
          <Input
            id="contact-club"
            name="club_name"
            placeholder="Ej. Club Atlético Belgrano"
            aria-invalid={Boolean(errors.club_name)}
            aria-describedby={errors.club_name ? 'contact-club-error' : undefined}
            className="h-11"
          />
          {errors.club_name?.[0] && (
            <p id="contact-club-error" className="text-xs text-destructive">
              {errors.club_name[0]}
            </p>
          )}
        </div>

        {/* Asunto */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="contact-subject">
            Asunto <span className="text-destructive">*</span>
          </Label>
          <Input
            id="contact-subject"
            name="subject"
            placeholder="Ej. Consulta por planes para clubes"
            required
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
            className="h-11"
          />
          {errors.subject?.[0] && (
            <p id="contact-subject-error" className="text-xs text-destructive">
              {errors.subject[0]}
            </p>
          )}
        </div>
      </div>

      {/* Mensaje */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="contact-message">
          Mensaje <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="contact-message"
          name="message"
          rows={5}
          placeholder="Contanos sobre tu club, dudas o necesidades específicas..."
          required
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          className="min-h-32 resize-y"
        />
        {errors.message?.[0] ? (
          <p id="contact-message-error" className="text-xs text-destructive">
            {errors.message[0]}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Entre 10 y 3000 caracteres.</p>
        )}
      </div>

      {state.message && !state.ok && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {state.message}
        </div>
      )}

      <Button type="submit" size="lg" disabled={pending} className="gap-2 self-start font-medium">
        {pending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Enviando mensaje...
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden="true" />
            Enviar consulta
          </>
        )}
      </Button>
    </form>
  )
}
