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
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
