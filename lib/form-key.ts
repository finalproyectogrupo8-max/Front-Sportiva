// Los inputs de Base UI no aceptan que `defaultValue` cambie después de montarse. Cuando una
// Server Action vuelve con errores y los valores cargados, el formulario se vuelve a montar con
// esta key para que los inputs arranquen ya con esos valores.
export function formKey(state: { values?: object; fieldErrors?: object; error?: string }): string {
  return JSON.stringify([state.values ?? null, state.fieldErrors ?? null, state.error ?? null])
}
