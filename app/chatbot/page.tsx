"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, Package, Loader2 } from "lucide-react"
import Link from "next/link"

interface ChatMessage {
  id: string
  type: "user" | "bot" | "system"
  content: string
}

interface ProductInfo {
  dimensions?: string
  weight?: string
  fragility?: string
  quantity?: string
}

const steps = ["dimensions", "weight", "fragility", "quantity", "complete"] as const;
type Step = typeof steps[number];

const prompts = {
  dimensions: "Enter dimensions (L x W x H in inches):",
  weight: "Enter weight (lbs):",
  fragility: "Fragility level (1-5):\n1:VeryLow 2:Low 3:Med 4:High 5:VeryHigh",
  quantity: "How many units?",
  complete: 'Type "restart" to begin again'
};

const placeholders = {
  dimensions: "10x5x3",
  weight: "5",
  fragility: "1-5",
  quantity: "100",
  complete: "restart"
};

const validation = {
  dimensions: (v: string) => {
    const parts = v.trim().split(/[x×]/);
    return parts.length === 3 && parts.every(p => !isNaN(parseFloat(p)));
  },
  weight: (v: string) => {
    const num = parseFloat(v.trim().replace(/(lbs|pounds|lb)$/gi, ""));
    return !isNaN(num) && num > 0;
  },
  fragility: (v: string) => ["1", "2", "3", "4", "5"].includes(v.trim()),
  quantity: (v: string) => /^\d+$/.test(v.trim()) && parseInt(v.trim()) > 0
};

const errorMessages = {
  dimensions: "Format: 10x5x3",
  weight: "Enter valid weight > 0",
  fragility: "Enter 1-5",
  quantity: "Enter whole number > 0"
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "1", type: "system", content: "🌱 Sustainable Packaging Bot - Find eco-friendly packaging solutions!" },
    { id: "2", type: "bot", content: prompts.dimensions }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>("dimensions")
  const [productInfo, setProductInfo] = useState<ProductInfo>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(3)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const addMessage = (type: "user" | "bot" | "system", content: string) => {
    setMessages(prev => [...prev, {
      id: (nextId.current++).toString(),
      type,
      content
    }])
  }

  const generateRecommendation = async (info: ProductInfo) => {
    try {
      console.log('Making API request with data:', info);
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(info),
      });

      console.log('Response received:', response);
      console.log('Response status:', response?.status);
      console.log('Response ok:', response?.ok);

      // Check if response exists
      if (!response) {
        return "Error: No response received from server";
      }

      // Try to get response data
      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        return `Error: Invalid response format (Status: ${response.status})`;
      }

      // Check if request was successful
      if (!response.ok) {
        console.error('API error:', data);
        return `Error: ${data?.error || `HTTP ${response.status}`}`;
      }

      // Return the suggestion
      return data?.suggestion || "Error: No suggestion received";

    } catch (error: any) {
      console.error('Fetch error:', error);
      return `Network Error: ${error.message || 'Failed to connect to server'}`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setInput("");
    addMessage("user", userInput);
    setIsLoading(true);

    try {
      if (currentStep === "complete") {
        if (userInput.toLowerCase().includes("restart")) {
          setProductInfo({});
          setCurrentStep("dimensions");
          addMessage("bot", prompts.dimensions);
        } else {
          addMessage("bot", prompts.complete);
        }
      } else {
        const isValid = validation[currentStep](userInput);
        
        if (isValid) {
          const newInfo = { ...productInfo, [currentStep]: userInput };
          setProductInfo(newInfo);
          
          const currentIndex = steps.indexOf(currentStep);
          const nextStep = steps[currentIndex + 1];
          setCurrentStep(nextStep);
          
          if (nextStep === "complete") {
            addMessage("bot", `✅ Info collected:\n📦 ${newInfo.dimensions}in\n⚖️ ${newInfo.weight}lbs\n🛡️ ${newInfo.fragility}/5\n📊 ${newInfo.quantity} units\n\n🔄 Generating recommendation...`);
            
            const recommendation = await generateRecommendation(newInfo);
            addMessage("bot", recommendation);
            addMessage("system", prompts.complete);
          } else {
            addMessage("bot", `✅ ${currentStep}: ${userInput}\n\n${prompts[nextStep]}`);
          }
        } else {
          addMessage("bot", `❌ ${errorMessages[currentStep]}`);
        }
      }
    } catch (error: any) {
      console.error('Handle submit error:', error);
      addMessage("bot", "Unexpected error occurred. Please restart.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[url('https://i.ibb.co/HDWc1Nvx/photo-1671181158426-bfa2866ea7bb.jpg')] bg-cover bg-center backdrop-blur-lg">
      <header className="bg-black text-white shadow-sm border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-white hover:text-green-400">
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-green-400" />
              <h1 className="text-xl font-bold text-white">Packaging Bot</h1>
            </div>
          </div>
        </div>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="rounded-lg border border-white border-opacity-20 bg-transparent backdrop-blur-lg text-card-foreground h-[600px] flex flex-col">
          <CardHeader className="bg-transparent backdrop-blur-lg text-white border-b border-white border-opacity-20">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-600" />
              <span>Sustainable Packaging Assistant</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-4 bg-transparent backdrop-blur-lg space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap ${
                  msg.type === "user" ? "bg-green-600 text-white" :
                  msg.type === "system" ? "bg-blue-50 text-blue-800 border border-blue-200" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 p-3 rounded-lg flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>
          
          <Separator />
          
          <div className="p-4 bg-transparent backdrop-blur-lg">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholders[currentStep]}
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}