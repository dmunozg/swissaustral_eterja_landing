import { Container } from './ui'

const fields = [
  {
    id: 'name',
    label: 'Your name.',
    type: 'text',
    placeholder: 'Jane Doe',
  },
  {
    id: 'company',
    label: 'The company you formulate for.',
    type: 'text',
    placeholder: 'Studio Formule LLC',
  },
  {
    id: 'role',
    label: 'Your role',
    type: 'text',
    placeholder: 'e.g., R&D, Formulation, Product Development, Procurement, Founder',
  },
  {
    id: 'email',
    label: 'Work email',
    type: 'email',
    placeholder: 'jane.doe@studio.example',
    helper: 'We will reply as soon as possible.',
  },
]

const inputClass =
  'w-full rounded-md border border-espresso/20 bg-ivory px-4 py-3.5 text-[15px] text-espresso placeholder:text-taupe-light focus:border-glacial focus:outline-none focus:ring-2 focus:ring-glacial/30'

export default function Contact() {
  return (
    <section id="contact" className="bg-espresso text-ivory">
      <Container className="py-24 md:py-32">
        <div className="mx-auto max-w-[640px]">
          <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ivory md:text-[2.4rem]">
            Send your message.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-ivory/70">
            If Eterja SC fits a formulation you are developing, we would like
            to hear about it. Tell us what you are building and our technical
            team will reply.
          </p>

          <form
            className="mt-12 space-y-7"
            onSubmit={(event) => event.preventDefault()}
            noValidate
          >
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2">
              <Field {...fields[0]} />
              <Field {...fields[1]} />
            </div>
            <Field {...fields[2]} />
            <Field {...fields[3]} />

            <div>
              <label
                htmlFor="message"
                className="mb-2 block font-display text-sm font-semibold tracking-wide text-ivory"
              >
                Your message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="A short paragraph is enough."
                className={`${inputClass} resize-y`}
              />
              <p className="mt-2 text-xs text-ivory/50">
                A short paragraph is enough.
              </p>
            </div>

            {/* Turnstile placeholder */}
            <div
              className="flex h-[65px] w-full items-center justify-center rounded-md border border-dashed border-ivory/25 text-xs uppercase tracking-[0.18em] text-ivory/40"
              role="note"
            >
              Turnstile placeholder — Cloudflare bot challenge
            </div>

            <button
              type="button"
              className="highlight-cta w-full rounded-full bg-glacial-deep px-9 py-4 font-display text-lg font-bold tracking-wide text-ivory transition-colors hover:bg-glacial"
            >
              Send your message
            </button>
          </form>

          {/* Claims and process */}
          <div className="mt-12 space-y-6 border-t border-ivory/15 pt-8 text-xs leading-relaxed text-ivory/50">
            <div>
              <p className="font-display font-semibold uppercase tracking-[0.18em] text-ivory/70">
                What happens next
              </p>
              <p className="mt-2">
                A member of our technical team will reply within two business
                days, usually with a short set of follow-up questions about
                your formulation. We will not make claims about
                finished-product performance, clinical outcomes, or skin
                benefits; those depend on your specific base, processing, and
                intended use.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}

function Field({ id, label, type, placeholder, helper }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block font-display text-sm font-semibold tracking-wide text-ivory"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        className={inputClass}
      />
      {helper && <p className="mt-2 text-xs text-ivory/50">{helper}</p>}
    </div>
  )
}
