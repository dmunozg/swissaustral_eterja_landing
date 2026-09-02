import challengeBand from '../assets/challenge-band.jpg'
import Reveal from './Reveal'
import { Container, CiteMark, Eyebrow, SectionTitle } from './ui'

const sources = [
  {
    label: 'UV radiation',
    text: 'UVA and UVB drive ROS generation in skin; UV is the dominant external source of oxidative skin damage.',
  },
  {
    label: 'Environmental pollutants',
    text: 'Particulates and photo-reactive airborne compounds add to the load.',
  },
  {
    label: 'Normal cellular metabolism',
    text: 'Mitochondria and cell enzymes (e.g., NADPH oxidases) produce superoxide as a routine by-product, whether or not the skin has seen any sun today.',
  },
]

const damage = [
  {
    label: 'Oxidation of lipids, proteins, and DNA',
    text: 'The structural and genetic material of skin cells.',
  },
  {
    label: 'Destruction of the extracellular matrix',
    text: 'Collagen and elastin are degraded, producing the visible signs consumers associate with ageing: fine wrinkles, loss of elasticity, hyperpigmentation.',
  },
  {
    label: 'Dysregulated signalling',
    text: 'Oxidative stress drives inflammatory and apoptotic pathways that accelerate the damage cycle.',
  },
]

export default function Challenge() {
  return (
    <section id="challenge" className="seam-ivory-to-ivory-deep">
      <Container className="py-24 md:py-32">
        <Reveal className="max-w-3xl">
          <Eyebrow>The formulation challenge</Eyebrow>
          <SectionTitle className="mt-5">
            In skincare, oxidative stress is never optional.
          </SectionTitle>
          <p className="mt-6 text-base leading-relaxed text-taupe md:text-lg">
            Every skincare formulation has to contend with oxidative stress.
            Skin encounters reactive oxygen species (ROS) every day — from the
            environment and from within its own cells — making oxidative-stress
            management a baseline formulation and claims consideration, not an
            optional add-on.
            <CiteMark n={1} />
            <CiteMark n={2} />
          </p>
        </Reveal>

        {/* Editorial band: skin under warm directional light */}
        <Reveal media className="mt-14">
          <img
            src={challengeBand}
            alt="Shoulder and collarbone under warm directional light, showing natural skin texture"
            className="h-56 w-full rounded-lg object-cover object-[62%_45%] sm:h-72 md:h-80"
          />
        </Reveal>
        <Reveal delay={150} className="mt-3">
          <figcaption className="text-center font-display text-[11px] font-medium uppercase tracking-[0.2em] text-taupe">
            Every day, the skin is under oxidative pressure — visible or not.
          </figcaption>
        </Reveal>

        <Reveal stag className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-espresso/10 bg-espresso/10 md:grid-cols-3">
          <Block
            kicker="What superoxide is"
            copy={
              <>
                <strong className="font-semibold text-espresso">
                  Superoxide (O₂•⁻)
                </strong>{' '}
                is a short-lived oxygen free radical formed when oxygen gains an
                unpaired electron. It is an early ROS in the chain: it can be
                converted into hydrogen peroxide and contribute to the
                formation of more reactive species.
                <CiteMark n={2} />
              </>
            }
          />
          <Block
            kicker="Where it comes from"
            intro="Superoxide is not an occasional external attack; it is a constant background load on the skin."
            items={sources}
          />
          <Block
            kicker="Why it is harmful"
            intro="When superoxide and the ROS derived from it outpace the skin's antioxidant defenses, they cause real, molecular damage:"
            items={damage}
          />
        </Reveal>

        <Reveal className="mt-10 max-w-3xl">
          <p className="text-base leading-relaxed text-espresso md:text-lg">
            Extrinsic (photo-)aging is the visible outcome of this chemistry.
            For the formulator, it is also the reason antioxidant performance is
            a default expectation — not a premium add-on — in product development
            and claims substantiation.
          </p>
        </Reveal>
      </Container>
    </section>
  )
}

function Block({ kicker, copy, intro, items }) {
  return (
    <div className="flex flex-col bg-ivory p-8 md:p-10">
      <p className="font-display text-[11px] font-semibold uppercase tracking-[0.22em] text-glacial-deep">
        {kicker}
      </p>
      {copy && (
        <p className="mt-4 text-sm leading-relaxed text-taupe">{copy}</p>
      )}
      {intro && (
        <p className="mt-4 text-sm leading-relaxed text-espresso">{intro}</p>
      )}
      {items && (
        <ul className="mt-5 space-y-4">
          {items.map((item) => (
            <li key={item.label} className="border-l-2 border-skin pl-4">
              <p className="text-sm font-semibold text-espresso">
                {item.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-taupe">
                {item.text}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
