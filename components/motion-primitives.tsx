"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";

export const pageMotion: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  },
};

export const staggerMotion: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.055, delayChildren: 0.03 },
  },
};

export const itemMotion: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
  },
};

export function MotionPage(props: HTMLMotionProps<"div">) {
  return <motion.div initial="hidden" animate="show" variants={pageMotion} {...props} />;
}

export function MotionStagger(props: HTMLMotionProps<"div">) {
  return <motion.div initial="hidden" animate="show" variants={staggerMotion} {...props} />;
}

export function MotionItem(props: HTMLMotionProps<"div">) {
  return <motion.div variants={itemMotion} {...props} />;
}

export function MotionPress(props: HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={itemMotion}
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    />
  );
}
