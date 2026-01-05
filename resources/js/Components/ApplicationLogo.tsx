import { ImgHTMLAttributes } from "react";

export default function ApplicationLogo({
    className = "",
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    const mergedClassName = ["w-[250px] h-auto object-contain", className]
        .filter(Boolean)
        .join(" ");

    return (
        <img
            {...props}
            className={mergedClassName}
            src="/img/logo-gestioncampos.png"
            alt="Greenex Logo"
        />
    );
}
