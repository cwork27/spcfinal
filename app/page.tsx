import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf, Package, Recycle, Shield, DollarSign, MessageCircle } from "lucide-react"
import Spline from '@splinetool/react-spline/next';


export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-black px-4 sm:px-6 lg:px-8 py-4 ">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Leaf className="h-8 w-8 text-green-400" />
              <h1 className="text-2xl font-bold text-white">TeamNovaForge </h1>
            </div>
            <nav className="hidden md:flex space-x-8">



            </nav>
          </div>
      </header>

      {/* Hero Section */}
      <section className="pt-10 pb-0 px-4 sm:px-6 lg:px-8 bg-black text-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-green-600 mb-6">
            Sustainable Packaging
            <span className="text-white block mt-4">
              Made Simple
            </span>
          </h2>
          <p className="text-2xl text-white mt-12 mb-8 max-w-3xl mx-auto">
            Sustainable packaging solutions, tailored for your product and budget, powered by AI
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chatbot">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-12 py-6 text-lg">
                <MessageCircle className="mr-2 h-5 w-5" />
                Try Our Chatbot
              </Button>
            </Link>
            
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="h-[500px] px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-black" >
        <Spline
          scene="https://prod.spline.design/CUuiHRXJEvMSY3Tb/scene.splinecode"
        />
      </section>




    </div>
  )
}
