'use client';
import { motion } from 'framer-motion';

export default function Logo({ size = 56, color = '#0047AB' }) {
  return (
    <motion.div 
      initial={{ rotate: -10, scale: 0.9 }}
      animate={{ rotate: 0, scale: 1 }}
      style={{ 
        width: size, 
        height: size, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Stylized 'P' Logo Icon based on user screenshots */}
        {/* Left slanted block */}
        <path d="M25 25L35 15H55L65 25V45H45L35 35V85H20L15 80V35L25 25Z" fill={color} />
        {/* Right curved block */}
        <path d="M65 25V45H80L85 40V20L75 15H55L65 25Z" fill={color} />
        {/* Internal Detail */}
        <path d="M45 25H65V45H45V25Z" fill="white" opacity="0.8" />
      </svg>
    </motion.div>
  );
}
