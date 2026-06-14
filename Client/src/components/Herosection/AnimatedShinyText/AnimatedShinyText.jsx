import React, { forwardRef, useState } from "react";
import { motion } from "framer-motion";

const AnimatedText = forwardRef((
  {
    text,
    gradientColors = "linear-gradient(90deg, #111827, #ffffff, #111827)",
    gradientAnimationDuration = 2.5,
    hoverEffect = true,
    className = "",
    textClassName = "",
    ...props
  },
  ref
) => {
  const [isHovered, setIsHovered] = useState(false);

  const textVariants = {
    initial: {
      backgroundPosition: "0% 0",
    },
    animate: {
      backgroundPosition: "200% 0",
      transition: {
        duration: gradientAnimationDuration,
        repeat: Infinity,
        repeatType: "loop",
        ease: "linear"
      },
    },
  };

  return (
    <div
      ref={ref}
      className={`flex justify-center items-center ${className}`}
      {...props}
    >
      <motion.h1
        className={`leading-normal ${textClassName}`}
        style={{
          background: gradientColors,
          backgroundSize: "200% auto",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          textShadow: isHovered ? "0 0 15px rgba(59,130,246,0.4)" : "none",
          transition: "text-shadow 0.3s ease"
        }}
        variants={textVariants}
        initial="initial"
        animate="animate"
        onHoverStart={() => hoverEffect && setIsHovered(true)}
        onHoverEnd={() => hoverEffect && setIsHovered(false)}
      >
        {text}
      </motion.h1>
    </div>
  );
});

AnimatedText.displayName = "AnimatedText";

export default AnimatedText;