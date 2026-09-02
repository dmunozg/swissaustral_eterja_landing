import iceBand from '../assets/ice-band.jpg'
import { Container, Eyebrow, SectionTitle } from './ui'

const nodes = [
  {
    name: 'SUPEROXIDE',
    formula: 'O₂•⁻',
    micro: 'A reactive oxygen species generated in skin.',
    kind: 'substrate',
  },
  {
    name: 'SOD',
    formula: 'Superoxide dismutase',
    equation: '2 O₂•⁻ + 2 H⁺ → H₂O₂ + O₂',
    micro: 'SOD converts superoxide into hydrogen peroxide and oxygen.',
    kind: 'enzyme',
  },
  {
    name: 'HYDROGEN PEROXIDE',
    formula: 'H₂O₂',
    micro: 'The intermediate product of the first reaction — and the input for the second.',
    kind: 'intermediate',
  },
  {
    name: 'CATALASE',
    formula: null,
    equation: '2 H₂O₂ → 2 H₂O + O₂',
    micro: 'Catalase breaks hydrogen peroxide down into water and oxygen.',
    kind: 'enzyme',
  },
  {
    name: 'WATER + OXYGEN',
    formula: 'H₂O + O₂',
    micro: 'The pathway resolves into water and oxygen.',
    kind: 'endpoint',
  },
]

export default function Mechanism() {
  return (
    <section id="mechanism" className="seam-ivory-to-glacier-pale">
      <Container className="pt-24 md:pt-32">
        <div className="max-w-3xl">
          <SectionTitle>The chemistry of working in tandem.</SectionTitle>
          <p className="mt-6 text-base leading-relaxed text-taupe md:text-lg">
            Superoxide dismutase and catalase act in sequence. The first
            enzyme converts superoxide into hydrogen peroxide; the second then
            breaks hydrogen peroxide down into water and oxygen.
          </p>
        </div>
      </Container>

      {/* Full-bleed glacial band: the ice that the chemistry comes from */}
      <figure className="relative my-14 h-52 w-full overflow-hidden sm:h-64 md:h-80">
        <img
          src={iceBand}
          alt="Glacial ice with deep blue crevasse lanes and pale turquoise meltwater"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-glacier-pale/70 via-transparent to-glacier-pale/70"
          aria-hidden="true"
        />
      </figure>

      <Container className="pb-24 md:pb-32">
        {/* The pathway */}
        <div>
          <PathwayDesktop />
          <PathwayMobile />
        </div>

        <p className="mx-auto mt-14 max-w-3xl text-center text-base leading-relaxed text-espresso">
          SOD begins the conversion of superoxide. Catalase follows by
          processing the hydrogen peroxide formed in that reaction. Together,
          they create a defined two-enzyme pathway for managing connected
          oxidative species.
        </p>

        <details className="group mx-auto mt-10 max-w-3xl border border-espresso/15 bg-ivory">
          <summary className="cursor-pointer list-none px-6 py-4 font-display text-sm font-semibold uppercase tracking-[0.16em] text-espresso select-none">
            Why the sequence matters
            <span className="ml-2 inline-block text-glacial-deep transition-transform group-open:rotate-90">
              ›
            </span>
          </summary>
          <p className="border-t border-espresso/10 px-6 py-5 text-sm leading-relaxed text-taupe">
            SOD changes the reactive species rather than removing oxygen from
            the system. The resulting hydrogen peroxide therefore becomes the
            substrate for catalase. The two reactions are chemically connected,
            which is why the enzymes are presented as a tandem system rather
            than as unrelated antioxidant claims.
          </p>
        </details>

        <p className="mx-auto mt-12 max-w-2xl text-center text-sm leading-relaxed text-taupe">
          A clear mechanism is the starting point. The next question is how the
          system fits into formulation development.
        </p>
      </Container>
    </section>
  )
}

function NodeCard({ node }) {
  const isEndpoint = node.kind === 'endpoint'
  const isEnzyme = node.kind === 'enzyme'
  return (
    <div
      className={`flex h-full flex-col justify-center text-center ${
        isEnzyme
          ? 'rounded-md border border-glacial/40 bg-ivory px-4 py-5'
          : isEndpoint
            ? 'px-4 py-5'
            : 'rounded-md border border-espresso/15 bg-ivory px-4 py-5'
      }`}
    >
      <p
        className={`font-display text-xs font-bold uppercase tracking-[0.14em] ${
          isEndpoint ? 'text-terracotta' : 'text-espresso'
        }`}
      >
        {node.name}
      </p>
      {node.formula && (
        <p className="mt-1.5 text-sm italic text-taupe">{node.formula}</p>
      )}
      {node.equation && (
        <p className="mt-2 font-display text-[13px] font-semibold tracking-tight text-glacial-deep">
          {node.equation}
        </p>
      )}
      <p className="mt-3 text-[13px] leading-snug text-taupe">{node.micro}</p>
    </div>
  )
}

function Arrow({ tone = 'glacial' }) {
  return (
    <span
      className={`pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 rotate-45 border-r border-t ${
        tone === 'terracotta'
          ? 'border-terracotta'
          : 'border-glacial'
      } h-2.5 w-2.5`}
      aria-hidden="true"
    />
  )
}

function Segment({ tone = 'glacial' }) {
  return (
    <div className="relative flex items-center" aria-hidden="true">
      <div
        className={`h-[2px] w-full ${
          tone === 'light' ? 'bg-glacial/40' : 'bg-glacial/70'
        }`}
      />
      <Arrow tone={tone === 'light' ? 'terracotta' : 'glacial'} />
    </div>
  )
}

function PathwayDesktop() {
  return (
    <div className="hidden items-stretch gap-0 lg:flex">
      {nodes.map((node, i) => (
        <div key={node.name} className="contents">
          <div className="w-[17%] shrink-0">
            <NodeCard node={node} />
          </div>
          {i < nodes.length - 1 && (
            <div className="flex min-w-[6%] flex-1 items-center">
              <Segment tone={i === 3 ? 'light' : 'glacial'} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function PathwayMobile() {
  return (
    <div className="flex flex-col items-stretch lg:hidden">
      {nodes.map((node, i) => (
        <div key={node.name} className="contents">
          <NodeCard node={node} />
          {i < nodes.length - 1 && (
            <div className="flex h-12 items-start justify-center" aria-hidden="true">
              <div
                className={`relative h-full w-[2px] ${
                  i === 3 ? 'bg-glacial/40' : 'bg-glacial/70'
                }`}
              >
                <span
                  className={`pointer-events-none absolute -bottom-1 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-[135deg] border-b border-r ${
                    i === 3 ? 'border-terracotta' : 'border-glacial'
                  }`}
                  aria-hidden="true"
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
