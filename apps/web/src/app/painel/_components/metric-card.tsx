import { Card, CardContent } from '@cbrl/design'

type TrendDirection = 'up' | 'down' | 'flat'

type Props = {
  label: string
  value: string | number
  hint?: string
  trend?: { direction: TrendDirection; label: string }
}

function trendColorFor(direction: TrendDirection): string {
  if (direction === 'up') return 'text-primary'
  if (direction === 'down') return 'text-destructive'
  return 'text-muted-foreground'
}

function trendArrowFor(direction: TrendDirection): string {
  if (direction === 'up') return '↑'
  if (direction === 'down') return '↓'
  return '→'
}

export function MetricCard({ label, value, hint, trend }: Props) {
  const trendColor = trend ? trendColorFor(trend.direction) : 'text-muted-foreground'

  return (
    <Card className="rounded-xl">
      <CardContent className="p-5">
        <p className="text-muted-foreground text-xs tracking-wider uppercase">{label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
        {(trend || hint) && (
          <div className="mt-3 flex items-baseline justify-between gap-2 text-xs">
            {trend && (
              <span className={`${trendColor} font-medium tabular-nums`}>
                {trendArrowFor(trend.direction)} {trend.label}
              </span>
            )}
            {hint && <span className="text-muted-foreground">{hint}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
