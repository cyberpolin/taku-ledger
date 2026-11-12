/** Axes, grid, and tooltips stay zinc. Series colors are the finance tokens mixed with 60% white. */
const seriesBase = {
  income: '#047857',
  expense: '#e11d48',
  net: '#09090b',
} as const

export const chartZinc = {
  200: '#e4e4e7',
  600: '#52525b',
  950: '#09090b',
} as const

export const chartSeries = {
  income: mixWhite(seriesBase.income),
  expense: mixWhite(seriesBase.expense),
  net: mixWhite(seriesBase.net),
  grid: chartZinc[200],
  axis: chartZinc[600],
  tooltipBg: '#ffffff',
  tooltipBorder: chartZinc[200],
} as const

function mixWhite(hex: string, whiteRatio = 0.6): string {
  const value = Number.parseInt(hex.slice(1), 16)
  const channel = (shift: number) => {
    const channelValue = (value >> shift) & 255
    const mixed = Math.round(
      channelValue * (1 - whiteRatio) + 255 * whiteRatio,
    )
    return mixed.toString(16).padStart(2, '0')
  }
  return `#${channel(16)}${channel(8)}${channel(0)}`
}
