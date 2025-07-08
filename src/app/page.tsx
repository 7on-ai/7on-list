import { Counter } from "@/components/counter";
import { Button } from "@/components/ui/button";
import SplitText from "@/components/ui/split-text";
import { WaitlistForm } from "@/components/waitlist-form";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black">
      <div className="flex flex-col h-screen justify-center items-center text-center px-4 sm:px-6 lg:px-8">
        {/* Logo ด้านบน */}
        <div className="mb-4">
          <Image 
            src="/logo.png" 
            alt="Jarvis Logo" 
            width={80} 
            height={80}
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 hover:scale-120 transition-transform duration-300"
          />
        </div>
        
        <div className="mb-4 max-w-2xl mx-auto">
          <SplitText className="text-3xl sm:text-4xl lg:text-5xl tracking-tighter font-medium">
            Get early access
          </SplitText>
          <SplitText className="tracking-tight text-lg sm:text-xl mt-2">
            Be among the first to experience 7onAI, <br/>
            the Jarvis in real life.
          </SplitText>
        </div>
        
        <div className="w-full max-w-md mx-auto">
          <WaitlistForm />
        </div>
        
        <div className="mt-4">
          <Counter />
        </div>
        
        <footer className="sticky top-[100vh]">
          <Button size="icon" variant="ghost">
            <Link href="https://mytri.ai" target="_blank">
              <Image 
                src="/logo.png" 
                alt="My Logo" 
                width={24} 
                height={24}
                className="w-6 h-6"
              />
            </Link>
          </Button>
        </footer>
      </div>
    </div>
  );
}
