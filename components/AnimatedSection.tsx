"use client"

import { motion } from "framer-motion"
import type React from "react"

interface AnimatedSectionProps {
  children: React.ReactNode
  delay?: number
}

export const AnimatedSection: React.FC<AnimatedSectionProps> = ({ children, delay = 0 }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay }}
    >
      {children}
    </motion.section>
  )
}

