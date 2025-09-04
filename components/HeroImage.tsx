import Image from "next/image"

export default function HeroImage() {
  return (
    <div className="w-full aspect-[2]">
      <Image src="hero-background-l.png" alt="Hero Image" fill className="object-cover dark:hidden" />
      <Image src="hero-background-d.png" alt="Hero Image" fill className="object-cover hidden dark:block" />
      <div className="w-full bg-gradient-to-t from-background to-transparent absolute bottom-0 left-0"></div>
    </div>
  )
}


