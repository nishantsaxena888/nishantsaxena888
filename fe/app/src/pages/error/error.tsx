import { useRouteError, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ArrowLeft, RefreshCw, ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Error = () => {
    const error: any = useRouteError();
    const navigate = useNavigate();
    const [showDetails, setShowDetails] = useState(false);

    const errorMessage = error?.statusText || error?.message || "An unexpected error occurred";
    const status = error?.status || "500";

    return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-2xl w-full relative z-10"
            >
                <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-[32px] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                    {/* Decorative Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12, delay: 0.2 }}
                            className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20"
                        >
                            <AlertCircle className="w-8 h-8 text-primary" />
                        </motion.div>
                        <div>
                            <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-1 block">Error {status}</span>
                            <h1 className="text-3xl font-black text-white leading-none tracking-tight">Something went wrong</h1>
                        </div>
                    </div>

                    <p className="text-white/60 text-lg leading-relaxed mb-10 max-w-lg">
                        We've encountered an unexpected issue while trying to render this page. Our team has been notified and we're working on a fix.
                    </p>

                    <div className="flex flex-wrap gap-4 mb-12">
                        <Button 
                            onClick={() => navigate("/")}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground h-12 px-8 rounded-full font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return Home
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => window.location.reload()}
                            className="h-12 px-8 rounded-full font-bold border-white/10 hover:bg-white/5 transition-all text-white/80 flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Try Again
                        </Button>
                    </div>

                    {/* Developer Details Section */}
                    {error && (
                        <div className="border-t border-white/5 pt-8">
                            <button 
                                onClick={() => setShowDetails(!showDetails)}
                                className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors text-xs font-bold uppercase tracking-widest pl-1"
                            >
                                <Terminal className="w-3 h-3" />
                                Advanced Debug Information
                                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>

                            <AnimatePresence>
                                {showDetails && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-4 p-6 bg-black/40 rounded-2xl border border-white/5 font-mono text-xs text-primary/80 overflow-x-auto leading-relaxed">
                                            <div className="text-white font-bold mb-2">Message: {errorMessage}</div>
                                            {error.stack && (
                                                <div className="text-white/40 whitespace-pre">
                                                    {error.stack}
                                                </div>
                                            )}
                                            {!error.stack && (
                                                <div className="text-white/20 italic">No stack trace available for this error.</div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Footer Quote */}
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-8 text-white/20 text-[10px] uppercase font-bold tracking-[0.4em]"
                >
                    &copy; {new Date().getFullYear()} Nishify Enterprise Engine
                </motion.p>
            </motion.div>
        </div>
    );
};
