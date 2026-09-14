import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ArrowRight, Check, Globe2, Search, ShoppingBag, ShieldCheck, X, Zap } from 'lucide-react'

type Product = {
  slug: string
  name: string
  brand: string
  category: string
  price: number
  oldPrice?: number
  edition: string
  platforms: string
  accent: string
}

const products: Product[] = [
  { slug: 'windows-11-pro', name: 'Windows 11 Pro', brand: 'Microsoft', category: 'Sistema operativo', price: 19.9, oldPrice: 29.9, edition: 'Licenza perpetua', platforms: 'PC · 1 dispositivo', accent: 'from-amber-500/30 to-orange-950' },
  { slug: 'office-2021-pro', name: 'Office 2021 Professional Plus', brand: 'Microsoft', category: 'Produttività', price: 24.9, oldPrice: 39.9, edition: 'Licenza perpetua', platforms: 'Windows · 1 PC', accent: 'from-sky-500/25 to-slate-950' },
  { slug: 'office-365-personal', name: 'Microsoft 365 Personal', brand: 'Microsoft', category: 'Produttività', price: 18, edition: '12 mesi', platforms: 'PC + Mac · 1 persona', accent: 'from-blue-500/25 to-indigo-950' },
  { slug: 'kaspersky-security', name: 'Internet Security 2026', brand: 'Kaspersky', category: 'Sicurezza', price: 14.9, oldPrice: 24.9, edition: '12 mesi', platforms: 'PC + Mac + Mobile', accent: 'from-emerald-500/25 to-teal-950' },
  { slug: 'autocad-12-months', name: 'AutoCAD', brand: 'Autodesk', category: 'Design & CAD', price: 149, edition: '12 mesi', platforms: 'Windows + Mac', accent: 'from-rose-500/25 to-red-950' },
  { slug: 'coreldraw-graphics', name: 'CorelDRAW Graphics Suite', brand: 'Corel', category: 'Creatività', price: 59, oldPrice: 89, edition: 'Licenza perpetua', platforms: 'Windows · 1 dispositivo', accent: 'from-fuchsia-500/25 to-purple-950' },
]

export const Route = createFileRoute('/')({
  head: () => ({ meta: [
    { title: 'LicenzPol · Software licenses, clearly' },
    { name: 'description', content: 'LicenzPol makes choosing verified software licenses simple, transparent, and fast.' },
  ] }),
  component: Storefront,
})

function Storefront() {
  const [lang, setLang] = useState<'it' | 'en'>('it')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Tutti')
  const [cart, setCart] = useState<Product[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const it = lang === 'it'
  const categories = ['Tutti', ...Array.from(new Set(products.map(p => p.category)))]
  const visible = useMemo(() => products.filter(p => {
    const matchesCategory = category === 'Tutti' || p.category === category
    const haystack = `${p.name} ${p.brand} ${p.category}`.toLowerCase()
    return matchesCategory && haystack.includes(query.toLowerCase())
  }), [category, query])
  const total = cart.reduce((sum, item) => sum + item.price, 0)

  const addToCart = (product: Product) => {
    setCart(current => current.some(item => item.slug === product.slug) ? current : [...current, product])
    setCartOpen(true)
    toast.success(it ? `${product.name} aggiunto al carrello` : `${product.name} added to cart`)
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-5 lg:px-8">
          <a href="#top" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">LP</span>
            <span className="text-lg">LicenzPol</span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#catalog" className="transition-colors hover:text-foreground">{it ? 'Catalogo' : 'Catalog'}</a>
            <a href="#why" className="transition-colors hover:text-foreground">{it ? 'Perché noi' : 'Why us'}</a>
            <a href="#support" className="transition-colors hover:text-foreground">{it ? 'Supporto' : 'Support'}</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setLang(it ? 'en' : 'it')} className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"><Globe2 className="size-4" />{lang.toUpperCase()}</button>
            <button type="button" onClick={() => setCartOpen(true)} className="relative rounded-full p-2.5 transition hover:bg-muted" aria-label={it ? 'Apri carrello' : 'Open cart'}><ShoppingBag className="size-5" />{cart.length > 0 && <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{cart.length}</span>}</button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden border-b border-border px-5 py-20 lg:px-8 lg:py-28">
          <div className="absolute -right-32 -top-32 size-[32rem] rounded-full bg-primary/10 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary"><Zap className="size-3.5" />{it ? 'SOFTWARE, SENZA COMPLICAZIONI' : 'SOFTWARE, WITHOUT FRICTION'}</div>
              <h1 className="max-w-4xl text-5xl font-bold leading-[.98] tracking-[-.06em] sm:text-7xl lg:text-8xl">{it ? <>La licenza giusta.<br /><span className="text-primary">Senza fatica.</span></> : <>The right license.<br /><span className="text-primary">No fuss.</span></>}</h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">{it ? 'Edizioni chiare, prezzi onesti e chiavi verificabili. Scegli il software che ti serve e ricevi tutto via email.' : 'Clear editions, honest pricing and verifiable keys. Pick what you need and receive everything by email.'}</p>
              <a href="#catalog" className="mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3.5 font-semibold text-primary-foreground transition hover:-translate-y-0.5 hover:shadow-lg">{it ? 'Esplora il catalogo' : 'Explore catalog'} <ArrowRight className="size-4" /></a>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['01', it ? 'Consegna immediata' : 'Instant delivery'], ['02', it ? 'Fattura UE' : 'EU invoice'], ['03', it ? 'Supporto reale' : 'Real support'], ['04', it ? 'Checkout demo' : 'Demo checkout']].map(([number, label]) => <div key={number} className="rounded-2xl border border-border bg-card/70 p-5"><span className="font-mono text-xs text-primary">{number}</span><p className="mt-12 font-semibold">{label}</p></div>)}
            </div>
          </div>
        </section>

        <section id="catalog" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="font-mono text-xs uppercase tracking-[.22em] text-primary">01 / Catalogo</p><h2 className="mt-3 text-4xl font-bold tracking-tight">{it ? 'Scegli con chiarezza.' : 'Choose with clarity.'}</h2></div><div className="relative w-full lg:max-w-xs"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder={it ? 'Cerca software o brand...' : 'Search software or brand...'} className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary" /></div></div>
          <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2">{categories.map(item => <button type="button" key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${category === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground'}`}>{item}</button>)}</div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visible.map(product => <article key={product.slug} className="group overflow-hidden rounded-2xl border border-border bg-card transition duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl"><div className={`relative flex h-48 items-end bg-gradient-to-br ${product.accent} p-5`}><span className="text-5xl font-bold tracking-[-.08em] text-foreground/80">{product.brand.slice(0, 2).toUpperCase()}</span><span className="absolute right-4 top-4 rounded-full border border-border/70 bg-background/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{product.category}</span></div><div className="p-5"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{product.brand}</p><h3 className="mt-2 text-xl font-bold">{product.name}</h3><p className="mt-2 text-sm text-muted-foreground">{product.edition} · {product.platforms}</p><div className="mt-6 flex items-end justify-between border-t border-border pt-4"><div><span className="text-2xl font-bold">€{product.price.toFixed(2)}</span>{product.oldPrice && <span className="ml-2 text-xs text-muted-foreground line-through">€{product.oldPrice.toFixed(2)}</span>}</div><button type="button" onClick={() => addToCart(product)} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:scale-105 active:scale-95">{it ? 'Aggiungi' : 'Add'}</button></div></div></article>)}</div>
          {visible.length === 0 && <div className="rounded-2xl border border-dashed border-border py-20 text-center text-muted-foreground">{it ? 'Nessun prodotto trovato.' : 'No products found.'}</div>}
        </section>

        <section id="why" className="border-y border-border bg-card/40 px-5 py-16 lg:px-8"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="font-mono text-xs uppercase tracking-[.22em] text-primary">02 / Fiducia</p><h2 className="mt-3 text-4xl font-bold tracking-tight">{it ? 'Tutto quello che serve. Niente di nascosto.' : 'Everything you need. Nothing hidden.'}</h2></div><div className="grid gap-4 sm:grid-cols-3">{[['Prezzi chiari', 'Nessun timer o scarsità inventata.'], ['Chiavi verificabili', 'Informazioni e compatibilità sempre visibili.'], ['Aiuto umano', 'Supporto in italiano e inglese.']].map(([title, text]) => <div key={title} className="border-l-2 border-primary/50 pl-5"><ShieldCheck className="size-5 text-primary" /><h3 className="mt-4 font-bold">{it ? title : title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it ? text : text}</p></div>)}</div></div></section>
      </main>

      <footer id="support" className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><p>© 2026 LicenzPol</p><p>{it ? 'Progetto in modalità demo · Nessun pagamento reale' : 'Demo mode · No real payments processed'}</p></footer>

      {cartOpen && <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" onClick={() => setCartOpen(false)}><aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card p-6 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{it ? 'Il tuo carrello' : 'Your cart'}</h2><button type="button" onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-muted"><X className="size-5" /></button></div>{cart.length === 0 ? <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground"><ShoppingBag className="mb-4 size-10" /><p>{it ? 'Il carrello è vuoto.' : 'Your cart is empty.'}</p></div> : <><div className="mt-8 flex-1 space-y-3 overflow-y-auto">{cart.map(item => <div key={item.slug} className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"><div><p className="font-semibold">{item.name}</p><p className="text-xs text-muted-foreground">{item.edition}</p></div><div className="text-right"><p className="font-bold">€{item.price.toFixed(2)}</p><button type="button" onClick={() => setCart(current => current.filter(x => x.slug !== item.slug))} className="text-xs text-destructive hover:underline">{it ? 'Rimuovi' : 'Remove'}</button></div></div>)}</div><div className="border-t border-border pt-5"><div className="mb-4 flex justify-between"><span className="text-muted-foreground">{it ? 'Totale' : 'Total'}</span><strong className="text-xl">€{total.toFixed(2)}</strong></div><button type="button" onClick={() => { toast.success(it ? 'Ordine demo registrato' : 'Demo order registered'); setCart([]); setCartOpen(false) }} className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-semibold text-primary-foreground"><Check className="size-4" />{it ? 'Conferma ordine demo' : 'Confirm demo order'}</button></div></>}
    </aside></div>}
    </div>
  )
}
