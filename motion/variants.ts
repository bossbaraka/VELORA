import { MOTION } from "./tokens";
export const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION.entrance, ease: MOTION.ease },
  },
};
export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: MOTION.page, ease: MOTION.ease },
};
