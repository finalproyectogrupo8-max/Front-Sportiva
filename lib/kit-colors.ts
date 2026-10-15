export const KIT_COLORS = [
  { value: '#1f3fbf', label: 'Azul' },
  { value: '#f4f4f5', label: 'Blanco' },
  { value: '#c1272d', label: 'Rojo' },
  { value: '#111827', label: 'Negro' },
  { value: '#f59e0b', label: 'Amarillo' },
  { value: '#15803d', label: 'Verde' },
]

export function colorName(hex: string) {
  return KIT_COLORS.find((c) => c.value === hex)?.label ?? hex
}
