import React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  className?: string;
}

const Logo: React.FC<LogoProps> = ({
  size = "md",
  variant = "light",
  className = "",
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img
        src={variant === "dark" ? "/logo-dark.png" : "/logo.png"}
        alt="EnviGuide Logo"
        className={`${sizeClasses[size]} object-contain`}
      />
      <span
        className={`font-bold ${textSizes[size]} ${
          variant === "dark" ? "text-white" : "text-gray-900"
        }`}
      >
        EnviGuide
      </span>
    </div>
  );
};

export default Logo;
