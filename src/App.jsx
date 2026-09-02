import Header from './components/Header'
import Hero from './components/Hero'
import Challenge from './components/Challenge'
import Origin from './components/Origin'
import Mechanism from './components/Mechanism'
import Combination from './components/Combination'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-ivory text-espresso">
      <Header />
      <main>
        <Hero />
        <Challenge />
        <Origin />
        <Mechanism />
        <Combination />
        {/* Light→dark seam: soft gradient band into the contact section */}
        <div className="seam-band-ivory-to-espresso h-24 md:h-32" aria-hidden="true" />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
