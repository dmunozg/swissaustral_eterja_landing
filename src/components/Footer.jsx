import { Container } from './ui'

const references = [
  {
    id: 'references-1',
    text: 'Rinnerthaler et al., 2015 — DOI 10.3390/biom5020545',
    url: 'https://doi.org/10.3390/biom5020545',
  },
  {
    id: 'references-2',
    text: 'Wei et al., 2024 — DOI 10.1186/s13008-024-00107-z',
    url: 'https://doi.org/10.1186/s13008-024-00107-z',
  },
  {
    id: 'references-3',
    text: 'Brand et al., 2018 — DOI 10.3389/fphar.2018.00920',
    url: 'https://doi.org/10.3389/fphar.2018.00920',
  },
]

export default function Footer() {
  return (
    <footer className="bg-espresso text-ivory">
      <Container className="border-t border-ivory/15 py-12">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-ivory/50">
          References
        </p>
        <ol className="mt-4 space-y-2 text-xs leading-relaxed text-ivory/60">
          {references.map((ref) => (
            <li key={ref.id} id={ref.id}>
              <a
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-ivory/25 underline-offset-2 transition-colors hover:text-ivory/90"
              >
                {ref.text}
              </a>
            </li>
          ))}
        </ol>

        <p className="mt-10 max-w-3xl text-xs leading-relaxed text-ivory/40">
          Eterja SC is a recombinant enzyme system supplied for formulation
          development and evaluation. The mechanism shown is an in vitro
          biochemical rationale; enzyme performance depends on the formulation
          it is incorporated into. This page does not claim finished-product
          efficacy, skin protection, penetration, or clinical outcomes.
        </p>

        <p className="mt-8 text-[11px] uppercase tracking-[0.2em] text-ivory/30">
          SwissAustral® — Eterja SC · Mockup
        </p>
      </Container>
    </footer>
  )
}
