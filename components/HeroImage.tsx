import Image from "next/image"

export default function HeroImage() {
  return (
    <div className="w-full aspect-[2] xl:w-auto xl:h-[720px] xl:aspect-auto">
      <Image src="hero-background-l.png" alt="Hero Image" fill className="object-cover xl:object-contain dark:hidden" />
      <Image src="hero-background-d.png" alt="Hero Image" fill className="object-cover xl:object-contain hidden dark:block" />
      <div className="w-full bg-gradient-to-t from-background to-transparent absolute bottom-0 left-0"></div>
      <div className="w-72 h-full bg-gradient-to-r via-background/70 from-background to-transparent absolute bottom-0 left-0"></div>
    </div>
  )
}


