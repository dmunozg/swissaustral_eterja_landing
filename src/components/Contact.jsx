import { Container } from './ui'

const fields = [
  {
    id: 'name',
    label: 'Your name.',
    type: 'text',
    placeholder: 'Ana Petrović',
  },
  {
    id: 'company',
    label: 'The company you formulate for.',
    type: 'text',
    placeholder: 'Studio Formule SA',
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
    placeholder: 'ana.petrovic@studio.example',
    helper: 'We reply within two business days.',
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

            {/* Consent */}
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="consent"
                className="mt-1 h-4 w-4 shrink-0 accent-glacial"
              />
              <span className="text-sm leading-relaxed text-ivory/80">
                I agree that SwissAustral may contact me about my request and
                store the information I provided for that purpose.{' '}
                <a
                  href="#privacy"
                  className="text-ivory/50 underline decoration-ivory/30 underline-offset-2 transition-colors hover:text-ivory/80"
                >
                  Read our privacy notice — we do not share your details with
                  third parties.
                </a>
              </span>
            </label>

            {/* Turnstile placeholder */}
            <div
              className="flex h-[65px] w-full items-center justify-center rounded-md border border-dashed border-ivory/25 text-xs uppercase tracking-[0.18em] text-ivory/40"
              role="note"
            >
              Turnstile placeholder — Cloudflare bot challenge
            </div>

            <button
              type="button"
              className="w-full rounded-full bg-glacial px-7 py-4 font-display text-sm font-semibold tracking-wide text-ivory transition-colors hover:bg-glacial-deep"
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
            <div>
              <p className="font-display font-semibold uppercase tracking-[0.18em] text-ivory/70">
                What this form is not
              </p>
              <p className="mt-2">
                It is not a clinical-trial registration, a finished-product
                claim, or a guarantee of activity in any specific formulation.
                Enzyme performance depends on the system it is incorporated
                into.
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
