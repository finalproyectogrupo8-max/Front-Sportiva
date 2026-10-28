// La API todavía responde las validaciones en inglés (APP_LOCALE=en, sin traducciones).
// Mientras tanto, los formularios admin traducen acá los mensajes que pueden aparecer.

const TRANSLATIONS: [RegExp, string][] = [
  [/^The (slug|email|admin\.email) has already been taken\.$/, 'Ya está en uso. Elegí otro.'],
  [/^The slug field format is invalid\.$/, 'Solo minúsculas, números y guion bajo (_).'],
  [/^The slug field must not be greater than (\d+) characters\.$/, 'Máximo $1 caracteres.'],
  [/^The (admin\.)?password field must be at least (\d+) characters\.$/, 'La contraseña debe tener al menos $2 caracteres.'],
  [/^The (admin\.)?email field must be a valid email address\.$/, 'Ingresá un email válido.'],
  [/^The ([\w.]+) field is required( when admin is present)?\.$/, 'Este campo es obligatorio.'],
]

/** Primer error de un campo de un 422, en español cuando hay traducción. */
export function fieldError(errors: Record<string, string[]>, field: string): string | undefined {
  const message = errors[field]?.[0]
  if (!message) return undefined

  for (const [pattern, translation] of TRANSLATIONS) {
    if (pattern.test(message)) return message.replace(pattern, translation)
  }
  return message
}
