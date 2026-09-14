import { useEffect, useRef, useState } from 'react'
import { Container } from './ui'

const fields = [
  {
    id: 'name',
    label: 'Your name.',
    type: 'text',
    placeholder: 'Jane Doe',
    required: true,
    maxLength: 100,
  },
  {
    id: 'company',
    label: 'The company you formulate for.',
    type: 'text',
    placeholder: 'Studio Formule LLC',
    maxLength: 150,
  },
  {
    id: 'role',
    label: 'Your role',
    type: 'text',
    placeholder: 'e.g., R&D, Formulation, Product Development, Procurement, Founder',
    maxLength: 150,
  },
  {
    id: 'email',
    label: 'Work email',
    type: 'email',
    placeholder: 'jane.doe@studio.example',
    helper: 'We will reply as soon as possible.',
    required: true,
    maxLength: 254,
  },
]

const MESSAGE_MAX_LENGTH = 5000
const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'
const CONTACT_API_URL =
  import.meta.env.VITE_CONTACT_API_URL ??
  `${import.meta.env.BASE_URL}api/contact`

const inputClass =
  'w-full rounded-md border border-espresso/20 bg-ivory px-4 py-3.5 text-[15px] text-espresso placeholder:text-taupe-light focus:border-glacial focus:outline-none focus:ring-2 focus:ring-glacial/30'

const statusStyles = {
  idle: '',
  pending: 'text-ivory/70',
  success: 'text-glacial-soft',
  error: 'text-ivory',
}

export default function Contact() {
  const turnstileRef = useRef(null)
  const widgetIdRef = useRef(null)
  const statusRef = useRef(null)
  const [status, setStatus] = useState({ state: 'idle', message: '' })

  useEffect(() => {
    let disposed = false
    let timer = null

    const renderWidget = () => {
      if (disposed) return
      if (!window.turnstile) {
        timer = setTimeout(renderWidget, 150)
        return
      }
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action: 'contact',
        size: 'flexible',
        theme: 'dark',
      })
    }

    renderWidget()

    return () => {
      disposed = true
      if (timer !== null) clearTimeout(timer)
      if (widgetIdRef.current !== null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (status.state !== 'idle') statusRef.current?.focus()
  }, [status])

  const resetWidget = () => {
    if (widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (status.state === 'pending') return
    const form = event.currentTarget
    const token =
      widgetIdRef.current !== null && window.turnstile
        ? window.turnstile.getResponse(widgetIdRef.current)
        : ''
    if (!token) {
      resetWidget()
      setStatus({
        state: 'error',
        message: 'Please complete the security check, then send your message.',
      })
      return
    }
    setStatus({ state: 'pending', message: 'Sending your message…' })
    try {
      const response = await fetch(CONTACT_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(new FormData(form).entries()),
          turnstileToken: token,
        }),
      })
      if (response.ok) {
        form.reset()
        setStatus({
          state: 'success',
          message: 'Thank you — your message has been sent.',
        })
      } else if (response.status === 429) {
        setStatus({
          state: 'error',
          message: 'Too many recent requests. Please wait a few minutes, then try again.',
        })
      } else {
        setStatus({
          state: 'error',
          message: 'We could not send your message. Please try again.',
        })
      }
    } catch {
      setStatus({
        state: 'error',
        message: 'We could not send your message. Please try again.',
      })
    } finally {
      resetWidget()
    }
  }

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
            onSubmit={handleSubmit}
            aria-busy={status.state === 'pending'}
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
                required
                maxLength={MESSAGE_MAX_LENGTH}
                placeholder="A short paragraph is enough."
                className={`${inputClass} resize-y`}
              />
              <p className="mt-2 text-xs text-ivory/50">
                A short paragraph is enough.
              </p>
            </div>

            <div ref={turnstileRef} className="w-full min-h-[65px]" />

            <p
              ref={statusRef}
              role={status.state === 'error' ? 'alert' : 'status'}
              tabIndex={-1}
              className={`min-h-5 text-sm font-semibold focus:outline-none ${statusStyles[status.state]}`}
            >
              {status.message}
            </p>

            <button
              type="submit"
              disabled={status.state === 'pending'}
              className="highlight-cta w-full rounded-full bg-glacial-deep px-9 py-4 font-display text-lg font-bold tracking-wide text-ivory transition-colors hover:bg-glacial disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status.state === 'pending' ? 'Sending…' : 'Send your message'}
            </button>
          </form>

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

function Field({ id, label, type, placeholder, helper, required, maxLength }) {
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
        required={required}
        maxLength={maxLength}
        className={inputClass}
      />
      {helper && <p className="mt-2 text-xs text-ivory/50">{helper}</p>}
    </div>
  )
}
