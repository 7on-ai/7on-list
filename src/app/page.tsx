import { Counter } from "@/components/counter";
import { Button } from "@/components/ui/button";
import SplitText from "@/components/ui/split-text";
import { WaitlistForm } from "@/components/waitlist-form";
import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col h-screen justify-center items-center text-center">
      {/* Logo ด้านบน */}
      <div className="mb-8">
        <Image 
          src="/logo.png" 
          alt="Jarvis Logo" 
          width={80} 
          height={80}
          className="w-20 h-20 mx-auto mb-6 hover:scale-110 transition-transform duration-300"
        />
      </div>
      
      <div className="mb-8">
        <SplitText className="text-5xl tracking-tighter font-medium">
          Get early access
        </SplitText>
        <SplitText className="tracking-tight text-xl">
          Be among the first to experience Jarvis in real life.
        </SplitText>
      </div>
      <WaitlistForm />
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
  );
}
