import { CourseDifficulty, difficultyColors } from "@/app/utils/course";
import { anticipate, motion } from "motion/react";

export interface IconProps {
  className?: string;
  size?: 16;
  difficulty: CourseDifficulty;
}

export const DifficultyIcon = ({
  className,
  size = 16,
  difficulty,
}: IconProps) => {
  const color = difficultyColors[difficulty];
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 18 18"
      className={className}
      fill="none"
    >
      <motion.path
        initial={{ opacity: 0.4 }}
        animate={{ opacity: difficulty > 1 ? 1 : 0.4 }}
        transition={{ duration: 0.2, delay: 0.5, ease: anticipate }}
        d="M10.2492 16.885C9.89124 16.885 9.57523 16.628 9.51123 16.264C9.44023 15.856 9.71322 15.467 10.1212 15.396C12.8082 14.928 14.9282 12.808 15.3962 10.122C15.4672 9.71299 15.8612 9.44001 16.2632 9.51201C16.6712 9.58301 16.9452 9.97099 16.8732 10.38C16.2972 13.689 13.6872 16.298 10.3782 16.875C10.3342 16.883 10.2912 16.886 10.2482 16.886L10.2492 16.885Z"
        fill={color}
      />
      <motion.path
        initial={{ opacity: 0.4 }}
        animate={{ opacity: difficulty > 2 ? 1 : 0.4 }}
        transition={{ duration: 0.2, delay: 0.75, ease: anticipate }}
        d="M7.75147 16.8848C7.70847 16.8848 7.66547 16.8818 7.62147 16.8738C4.31247 16.2978 1.70347 13.6868 1.12647 10.3788C1.05547 9.9708 1.32847 9.58176 1.73647 9.51076C2.14447 9.43876 2.53247 9.71275 2.60347 10.1208C3.07147 12.8078 5.19148 14.9278 7.87748 15.3958C8.28548 15.4668 8.55946 15.8548 8.48746 16.2628C8.42446 16.6278 8.10749 16.8848 7.74949 16.8848H7.75147Z"
        fill={color}
      />
      <motion.path
        initial={{ opacity: 0.4 }}
        animate={{ opacity: difficulty > 3 ? 1 : 0.4 }}
        transition={{ duration: 0.2, delay: 1, ease: anticipate }}
        d="M1.86621 8.49998C1.82321 8.49998 1.78021 8.49699 1.73721 8.48899C1.32921 8.41799 1.05521 8.02995 1.12721 7.62095C1.70321 4.31195 4.3122 1.70296 7.6212 1.12596C8.0352 1.05696 8.41721 1.328 8.48921 1.736C8.56021 2.144 8.28719 2.53298 7.87919 2.60398C5.19219 3.07198 3.0722 5.19197 2.6042 7.87797C2.5412 8.24297 2.22421 8.49998 1.86621 8.49998Z"
        fill={color}
      />
      <motion.path
        initial={{ opacity: 0.4 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.25, ease: anticipate }}
        d="M16.134 8.49997C15.776 8.49997 15.46 8.243 15.396 7.879C14.928 5.192 12.808 3.07197 10.122 2.60397C9.71399 2.53297 9.43998 2.14497 9.51198 1.73697C9.58298 1.32897 9.96999 1.05398 10.38 1.12698C13.689 1.70298 16.298 4.31298 16.875 7.62198C16.946 8.02998 16.673 8.41896 16.265 8.48996C16.221 8.49796 16.178 8.50094 16.135 8.50094L16.134 8.49997Z"
        fill={color}
      />
      <motion.path
        initial={{ opacity: 0.4 }}
        animate={{
          opacity: [0.4, 1, 0.4],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        d="M9 6.49976C7.621 6.49976 6.5 7.62076 6.5 8.99976C6.5 10.3788 7.621 11.4998 9 11.4998C10.379 11.4998 11.5 10.3788 11.5 8.99976C11.5 7.62076 10.379 6.49976 9 6.49976Z"
        fill={color}
      />
    </motion.svg>
  );
};
