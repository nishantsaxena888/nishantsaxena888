import { motion } from 'framer-motion';
import { LayoutTemplate } from 'lucide-react';

export const NoConfigFound = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center justify-center min-h-[400px] w-full p-8"
    >
      <div className="relative group mb-6">
        <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-50 blur-xl transition duration-500 group-hover:opacity-80"></div>
        <div className="relative flex items-center justify-center w-20 h-20 bg-background/50 backdrop-blur-sm border border-border/50 rounded-3xl shadow-sm">
          <LayoutTemplate className="w-10 h-10 text-muted-foreground stroke-[1.5]" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold tracking-tight text-foreground mb-2">
        No Configuration Found
      </h3>
      
      <p className="text-sm text-muted-foreground text-center max-w-[420px] leading-relaxed">
        It looks like there is no configuration available for this module. The dashboard structure might be missing or not yet set up for this entity.
      </p>
    </motion.div>
  );
};
