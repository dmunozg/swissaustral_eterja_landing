import { useReveal } from '../hooks/useReveal'

/*
 * <Reveal> — wraps a single element with the scroll-reveal treatment.
 *
 *   as        element to render (default 'div')
 *   className base classes on the element
 *   media     true → scale-in treatment on a child <img> (editorial bands)
 *   stag      true → staggered children (group reveals in sequence)
 *   delay     extra ms transition-delay for manual staggering
 *   threshold / rootMargin / once — forwarded to useReveal
 */
export default function Reveal({
  as: Tag = 'div',
  className = '',
  media = false,
  stag = false,
  delay = 0,
  threshold = 0.15,
  rootMargin,
  once,
  children,
  ...rest
}) {
  const { ref, state } = useReveal({ threshold, rootMargin, once })
  const stateClass =
    state === 'shown' ? 'rvl--shown' : state === 'hidden' ? 'rvl--hidden' : ''
  const kind = media ? 'rvl--media ' : stag ? 'rvl-stag ' : ''
  return (
    <Tag
      ref={ref}
      className={`rvl ${kind}${stateClass} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
