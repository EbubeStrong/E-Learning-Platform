import Image from "next/image";
import type { ImgProps } from "@/types/ui";

const imageMap = {
    logo: "/image/logo.png",
    "hero-one": "/image/hero-one.png",
    "hero-two": "/image/hero-two.png",
    "hero-three": "/image/hero-three.png",
    "hero-four": "/image/hero-four.png",
    "hero-five": "/image/hero-five.PNG",
} as const;

export function Img({ name, alt, className, fill = false, ...props }: ImgProps) {
    return (
        <Image
            src={imageMap[name]}
            alt={alt}
            className={className}
            width={fill ? undefined : 200}
            height={fill ? undefined : 200}
            fill={fill}
            {...props}
        />
    );
}

export function Logo({ className, alt = "Logo", ...props }: Omit<ImgProps, "name">) {
    return <Img name="logo" alt={alt} className={className} {...props} />;
}

export function HeroOne({ className, alt = "Hero 1", ...props }: Omit<ImgProps, "name">) {
    return <Img name="hero-one" alt={alt} className={className} {...props} />;
}

export function HeroTwo({ className, alt = "Hero 2", ...props }: Omit<ImgProps, "name">) {
    return <Img name="hero-two" alt={alt} className={className} {...props} />;
}

export function HeroThree({ className, alt = "Hero 3", ...props }: Omit<ImgProps, "name">) {
    return <Img name="hero-three" alt={alt} className={className} {...props} />;
}

export function HeroFour({ className, alt = "Hero 4", ...props }: Omit<ImgProps, "name">) {
    return <Img name="hero-four" alt={alt} className={className} {...props} />;
}

export function HeroFive({ className, alt = "Hero 5", ...props }: Omit<ImgProps, "name">) {
    return <Img name="hero-five" alt={alt} className={className} {...props} />;
}
