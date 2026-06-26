'use client'

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cbrl/design'
import { propertyKindLabels } from '@tekoa/shared'
import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

type FilterBarProps = {
  neighborhoods: string[]
  kinds: string[]
  totalCount: number
  filteredCount: number
}

type Draft = {
  q: string
  kind: string
  bairro: string
  rooms: string
  max: string
  pet: boolean
  furnished: boolean
  parking: boolean
  sort: string
}

// Widened (key PropertyKind → string) so arbitrary `kind` strings from the URL
// look up without a narrowing assertion; a miss yields `undefined`.
const kindLabels: Record<string, string | undefined> = propertyKindLabels

const ANY = '__any__'
const SORT_LABELS: Record<string, string> = {
  'price-asc': 'Mais barato',
  'price-desc': 'Mais caro',
  'area-desc': 'Maior área',
  'transit-asc': 'Mais perto da via principal',
}

function readDraft(params: URLSearchParams): Draft {
  return {
    q: params.get('q') ?? '',
    kind: params.get('kind') ?? '',
    bairro: params.get('bairro') ?? '',
    rooms: params.get('rooms') ?? '',
    max: params.get('max') ?? '',
    pet: params.get('pet') === '1',
    furnished: params.get('furnished') === '1',
    parking: params.get('parking') === '1',
    sort: params.get('sort') ?? 'price-asc',
  }
}

export function FilterBar({ neighborhoods, kinds, totalCount, filteredCount }: FilterBarProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [draft, setDraft] = useState<Draft>(() => readDraft(params))

  const commit = useCallback(
    (next: Draft) => {
      const sp = new URLSearchParams()
      if (next.q) sp.set('q', next.q)
      if (next.kind) sp.set('kind', next.kind)
      if (next.bairro) sp.set('bairro', next.bairro)
      if (next.rooms) sp.set('rooms', next.rooms)
      if (next.max) sp.set('max', next.max)
      if (next.pet) sp.set('pet', '1')
      if (next.furnished) sp.set('furnished', '1')
      if (next.parking) sp.set('parking', '1')
      if (next.sort && next.sort !== 'price-asc') sp.set('sort', next.sort)
      const qs = sp.toString()
      router.push(qs ? `/imoveis?${qs}` : '/imoveis', { scroll: false })
    },
    [router],
  )

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    const next = { ...draft, [k]: v }
    setDraft(next)
    commit(next)
  }

  const toggle = (k: 'pet' | 'furnished' | 'parking') => set(k, !draft[k])

  const clear = () => {
    const empty: Draft = {
      q: '',
      kind: '',
      bairro: '',
      rooms: '',
      max: '',
      pet: false,
      furnished: false,
      parking: false,
      sort: 'price-asc',
    }
    setDraft(empty)
    commit(empty)
  }

  const hasActive =
    draft.q ||
    draft.kind ||
    draft.bairro ||
    draft.rooms ||
    draft.max ||
    draft.pet ||
    draft.furnished ||
    draft.parking

  return (
    <div className="border-border/60 bg-background sticky top-0 z-[5] -mx-4 border-b px-4 py-3 md:-mx-6 md:px-6 md:py-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex flex-1 items-center gap-2 md:max-w-md">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <Input
              type="search"
              placeholder="Bairro ou palavra-chave"
              value={draft.q}
              onChange={(e) => set('q', e.target.value)}
              className="pl-9"
              aria-label="Busca"
            />
          </div>
          <FilterSelect
            label="Ordenar por"
            value={draft.sort}
            placeholder=""
            onChange={(v) => set('sort', v)}
            options={Object.entries(SORT_LABELS).map(([value, label]) => ({ value, label }))}
            showLabel={false}
            active={false}
          />
        </div>
        <p className="text-muted-foreground text-xs tabular-nums md:text-sm">
          {filteredCount === totalCount
            ? `${totalCount} imóveis`
            : `${filteredCount} de ${totalCount} imóveis`}
        </p>
      </div>

      <div className="-mx-4 mt-3 flex [scrollbar-width:none] items-center gap-2 overflow-x-auto px-4 py-2 md:mx-0 md:flex-wrap md:px-0 md:py-0 [&::-webkit-scrollbar]:hidden">
        <FilterSelect
          label="Tipo"
          value={draft.kind}
          placeholder="Todos"
          onChange={(v) => set('kind', v)}
          options={kinds.map((k) => ({
            value: k,
            label: kindLabels[k] ?? k,
          }))}
        />
        <FilterSelect
          label="Bairro"
          value={draft.bairro}
          placeholder="Todos"
          onChange={(v) => set('bairro', v)}
          options={neighborhoods.map((n) => ({ value: n, label: n }))}
        />
        <FilterSelect
          label="Quartos"
          value={draft.rooms}
          placeholder="Qualquer"
          onChange={(v) => set('rooms', v)}
          options={[
            { value: '1', label: '1+' },
            { value: '2', label: '2+' },
            { value: '3', label: '3+' },
          ]}
        />
        <FilterSelect
          label="Até"
          value={draft.max}
          placeholder="Qualquer"
          onChange={(v) => set('max', v)}
          options={[
            { value: '1500', label: 'R$ 1.500' },
            { value: '2000', label: 'R$ 2.000' },
            { value: '3000', label: 'R$ 3.000' },
            { value: '4000', label: 'R$ 4.000' },
            { value: '5000', label: 'R$ 5.000' },
          ]}
        />
        <Toggle active={draft.pet} onClick={() => toggle('pet')}>
          Aceita pet
        </Toggle>
        <Toggle active={draft.furnished} onClick={() => toggle('furnished')}>
          Mobiliado
        </Toggle>
        <Toggle active={draft.parking} onClick={() => toggle('parking')}>
          Com vaga
        </Toggle>
        {hasActive && (
          <Button
            type="button"
            variant="link"
            onClick={clear}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
  showLabel = true,
  active: activeProp,
}: {
  label: string
  value: string
  placeholder: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  showLabel?: boolean
  active?: boolean
}) {
  const active = activeProp ?? value !== ''
  const current = options.find((o) => o.value === value)?.label ?? placeholder
  return (
    <Select value={value === '' ? ANY : value} onValueChange={(v) => onChange(v === ANY ? '' : v)}>
      <SelectTrigger
        aria-label={label}
        size="sm"
        className={`shrink-0 ${active ? 'border-primary/40 bg-primary/10 text-primary' : ''}`}
      >
        <SelectValue>{showLabel ? `${label}: ${current}` : current}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {placeholder && <SelectItem value={ANY}>{placeholder}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Toggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={`shrink-0 ${
        active
          ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
          : 'hover:bg-secondary hover:text-foreground'
      }`}
    >
      {children}
    </Button>
  )
}
