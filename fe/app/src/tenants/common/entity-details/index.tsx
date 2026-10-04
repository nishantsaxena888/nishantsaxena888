import { motion, AnimatePresence } from 'framer-motion'
interface Product {
    id: string;
    name: string;
    price: number;
    image: React.ReactNode;
    category: string;
    sku: string;
}
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { ArrowLeft, Plus, Minus, Heart, ShoppingCart, Star, MessageSquare, Info, CheckCircle2 } from 'lucide-react'
import { Separator } from '../../../components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { useProductDetails } from './hooks/use-product-details'



interface ProductDetailsProps {
    schemaProperties?: any;
    product: Product;
    onBack: () => void;
    onAddToCart: (product: Product, quantity: number) => void;
    cartQuantity: number;
    isWishlisted: boolean;
    onToggleWishlist: (e: React.MouseEvent, productId: string) => void;
}

export function ProductDetails({
    schemaProperties,
    product,
    onBack,
    onAddToCart,
    cartQuantity,
    isWishlisted,
    onToggleWishlist,
}: ProductDetailsProps) {
    const labels = schemaProperties?.labels || {};
    const {
        qty,
        incrementQty,
        decrementQty,
        resetQty,
        mousePos,
        showMagnifier,
        setShowMagnifier,
        containerRef,
        handleMouseMove
    } = useProductDetails();

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center gap-4 mb-2 sm:mb-6 shrink-0 pt-2 sm:pt-0 pb-2 sm:pb-0">
                <Button variant="outline" size="icon" className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl border-2 shrink-0" onClick={onBack}>
                    <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </Button>
                <h2 className="text-lg sm:text-2xl font-black truncate">{(labels.productDetails || 'Product Details')}</h2>
            </div>

            <div className="flex-1">
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 sm:gap-16 items-start pb-8">
                    {/* Image Section */}
                    <div
                        ref={containerRef}
                        className="bg-card w-full aspect-square max-h-[300px] sm:max-h-none flex items-center justify-center text-8xl sm:text-9xl relative overflow-hidden group border-2 rounded-[32px] sm:rounded-[48px] shadow-sm cursor-zoom-in shrink-0"
                        onMouseEnter={() => setShowMagnifier(true)}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setShowMagnifier(false)}
                    >
                        <motion.div
                            className="w-full h-full flex items-center justify-center"
                            animate={{ scale: showMagnifier ? 1.05 : 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            {product.image}
                        </motion.div>

                        <AnimatePresence>
                            {showMagnifier && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="absolute pointer-events-none z-50 overflow-hidden border-2 border-primary/20 rounded-full shadow-2xl bg-card/10 backdrop-blur-md"
                                    style={{
                                        width: '200px',
                                        height: '200px',
                                        left: `${mousePos.x}%`,
                                        top: `${mousePos.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                >
                                    <div
                                        className="absolute text-[250px] sm:text-[300px] flex items-center justify-center w-full h-full"
                                        style={{
                                            left: `${-mousePos.x * 2 + 100}%`,
                                            top: `${-mousePos.y * 2 + 100}%`,
                                            transform: 'translate(-50%, -50%)',
                                        }}
                                    >
                                        {product.image}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 flex flex-col gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-background/50 backdrop-blur-md shadow-lg hover:scale-110 transition-all border-2"
                                onClick={(e: React.MouseEvent) => onToggleWishlist(e, product.id)}
                            >
                                <Heart className={`w-5 h-5 sm:w-7 sm:h-7 transition-colors ${isWishlisted ? 'fill-destructive text-destructive' : 'text-foreground'}`} />
                            </Button>
                        </div>

                        {cartQuantity > 0 && (
                            <Badge className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-primary/80 backdrop-blur-md text-primary-foreground font-black shadow-lg h-7 sm:h-10 px-3 sm:px-4 flex items-center justify-center text-[10px] sm:text-base border-none rounded-full pointer-events-none uppercase tracking-tighter">
                                {cartQuantity} {(labels.inCart || 'in Cart')}
                            </Badge>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="flex flex-col justify-start sm:justify-center w-full sm:h-full py-2">
                        <div className="flex flex-col justify-start sm:justify-center gap-4 sm:gap-8">
                            <div className="space-y-2 sm:space-y-4">
                                <Badge variant="secondary" className="font-black text-[10px] sm:text-sm uppercase tracking-widest px-3 sm:px-4 py-1 sm:py-2 leading-none rounded-lg border-2">
                                    {(labels[product.category] || product.category)}
                                </Badge>
                                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black leading-tight tracking-tighter line-clamp-2">
                                    {(labels[product.name] || product.name)}
                                </h1>
                                <p className="text-[10px] sm:text-base text-muted-foreground font-bold tracking-widest uppercase">
                                    {(labels.sku || 'SKU')}: {product.sku}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <p className="text-sm sm:text-lg text-muted-foreground font-medium leading-relaxed">
                                    {(labels.experiencePremium || 'Experience the premium quality of our')} {(labels[product.name] || product.name)}{(labels.productDescSuffix || '')}
                                </p>
                            </div>

                            <div className="text-4xl sm:text-6xl font-black text-primary tracking-tighter">
                                ${product.price}
                            </div>
                        </div>

                        <div className="flex flex-row gap-3 sm:gap-6 mt-6 sm:mt-12 shrink-0 h-14 sm:h-20">
                            <div className="flex items-center justify-between bg-muted/30 backdrop-blur-md rounded-2xl p-1.5 sm:p-3 border-2 w-[110px] sm:w-[180px] shrink-0 shadow-sm transition-all hover:bg-muted/40 group">
                                <Button size="icon" variant="ghost" className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl hover:bg-background/80" onClick={decrementQty}>
                                    <Minus className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                                </Button>
                                <span className="w-6 sm:w-16 text-center text-base sm:text-2xl font-black tabular-nums">{qty}</span>
                                <Button size="icon" variant="ghost" className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl hover:bg-background/80" onClick={incrementQty}>
                                    <Plus className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                                </Button>
                            </div>

                            <Button
                                size="lg"
                                className="h-14 sm:h-20 flex-1 rounded-2xl text-xs sm:text-xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all gap-2 sm:gap-3 group relative overflow-hidden"
                                onClick={() => {
                                    onAddToCart(product, qty)
                                    resetQty()
                                }}
                            >
                                <ShoppingCart className="w-4 h-4 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
                                <span className="relative z-10 flex items-center gap-1.5">
                                    {(labels.addToCart || 'Add to Cart')}
                                    <Separator orientation="vertical" className="h-4 sm:h-6 bg-primary-foreground/20 mx-1" />
                                    <span className="tabular-nums">${(product.price * qty).toFixed(0)}</span>
                                </span>
                                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-12 sm:mt-16 bg-background">
                    <Tabs defaultValue="description" className="w-full">
                        <TabsList className="bg-muted/30 p-1 h-12 sm:h-16 rounded-2xl border-2 w-full sm:w-auto justify-start flex items-center gap-1 mb-8 overflow-x-auto no-scrollbar">
                            <TabsTrigger value="description" className="px-6 py-2 sm:py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg font-black text-xs sm:text-base transition-all gap-2 flex items-center whitespace-nowrap">
                                <MessageSquare className="w-4 h-4" />
                                {(labels.description || 'Description')}
                            </TabsTrigger>
                            <TabsTrigger value="specs" className="px-6 py-2 sm:py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg font-black text-xs sm:text-base transition-all gap-2 flex items-center whitespace-nowrap">
                                <Info className="w-4 h-4" />
                                {(labels.specifications || 'Specifications')}
                            </TabsTrigger>
                            <TabsTrigger value="reviews" className="px-6 py-2 sm:py-3 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg font-black text-xs sm:text-base transition-all gap-2 flex items-center whitespace-nowrap">
                                <Star className="w-4 h-4" />
                                {(labels.reviews || 'Reviews')}
                            </TabsTrigger>
                        </TabsList>

                        <div className="bg-card/50 backdrop-blur-xl border-2 rounded-[32px] p-4 sm:p-10 shadow-sm min-h-[300px]">
                            <TabsContent value="description" className="mt-0 animate-in fade-in-50 duration-500">
                                <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
                                    <h3 className="text-xl font-black mb-4">{(labels.overview || 'Overview')}</h3>
                                    <p className="text-muted-foreground leading-relaxed mb-6">
                                        {(labels.thisPremium || 'This premium')} {(labels[product.name] || product.name)} {(labels.engineeredForExcellence || 'is engineered for excellence. Designed with the modern professional in mind, it combines robust functionality with an elegant aesthetic.')}
                                    </p>
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
                                            <span className="font-bold">{(labels.highGradeMaterials || 'High-grade industrial materials')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
                                            <span className="font-bold">{(labels.precisionEngineering || 'Precision engineering')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
                                            <span className="font-bold">{(labels.longLastingDurability || 'Long-lasting durability')}</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
                                            <span className="font-bold">{(labels.extendedWarranty || 'Extended warranty included')}</span>
                                        </li>
                                    </ul>
                                </div>
                            </TabsContent>

                            <TabsContent value="specs" className="mt-0 animate-in fade-in-50 duration-500">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-2 sm:gap-y-6">
                                    <div className="space-y-2 sm:space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b-2 gap-1 sm:gap-4">
                                            <span className="text-muted-foreground font-black uppercase tracking-widest text-[10px] sm:text-xs shrink-0">{(labels.material || 'Material')}</span>
                                            <span className="font-bold text-sm sm:text-base sm:text-right">{labels.premiumAlloy || 'Premium Alloy / Composite'}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b-2 gap-1 sm:gap-4">
                                            <span className="text-muted-foreground font-black uppercase tracking-widest text-[10px] sm:text-xs shrink-0">{(labels.weight || 'Weight')}</span>
                                            <span className="font-bold text-sm sm:text-base sm:text-right">{labels.variantWeight || '1.2 kg - 25 kg (Variant dependent)'}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b-2 gap-1 sm:gap-4">
                                            <span className="text-muted-foreground font-black uppercase tracking-widest text-[10px] sm:text-xs shrink-0">{(labels.sku || 'SKU')}</span>
                                            <span className="font-bold text-sm sm:text-base sm:text-right">{product.sku}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2 sm:space-y-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b-2 gap-1 sm:gap-4">
                                            <span className="text-muted-foreground font-black uppercase tracking-widest text-[10px] sm:text-xs shrink-0">{(labels.dimensions || 'Dimensions')}</span>
                                            <span className="font-bold text-sm sm:text-base sm:text-right">{labels.standardIndustrialSize || 'Standard Industrial Size'}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b-2 gap-1 sm:gap-4">
                                            <span className="text-muted-foreground font-black uppercase tracking-widest text-[10px] sm:text-xs shrink-0">{(labels.countryOfOrigin || 'Country of Origin')}</span>
                                            <span className="font-bold text-sm sm:text-base sm:text-right">{labels.globalManufacturing || 'Global Manufacturing'}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 border-b-2 gap-1 sm:gap-4">
                                            <span className="text-muted-foreground font-black uppercase tracking-widest text-[10px] sm:text-xs shrink-0">{(labels.category || 'Category')}</span>
                                            <span className="font-bold text-sm sm:text-base sm:text-right text-primary">{(labels[product.category] || product.category)}</span>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="reviews" className="mt-0 animate-in fade-in-50 duration-500">
                                <div className="space-y-8">
                                    <div className="flex items-center gap-6 p-6 rounded-2xl bg-muted/20 border-2 border-dashed">
                                        <div className="text-center">
                                            <div className="text-5xl font-black text-primary mb-1">4.8</div>
                                            <div className="flex items-center justify-center gap-0.5 text-primary">
                                                <Star className="w-3 h-3 fill-current" />
                                                <Star className="w-3 h-3 fill-current" />
                                                <Star className="w-3 h-3 fill-current" />
                                                <Star className="w-3 h-3 fill-current" />
                                                <Star className="w-3 h-3 fill-current" />
                                            </div>
                                            <div className="text-[10px] font-black uppercase text-muted-foreground mt-2 tracking-widest">24 {(labels.reviews || 'Reviews')}</div>
                                        </div>
                                        <Separator orientation="vertical" className="h-20" />
                                        <div className="flex-1 space-y-2">
                                            {[5, 4, 3, 2, 1].map((rating) => (
                                                <div key={rating} className="flex items-center gap-3">
                                                    <span className="text-xs font-black min-w-[12px]">{rating}</span>
                                                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${rating === 5 ? '85' : rating === 4 ? '10' : '5'}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 rounded-2xl bg-muted/10 border-2">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary">JD</div>
                                                    <div>
                                                        <div className="font-black text-sm">{labels.reviewerName || 'John Doe'}</div>
                                                        <div className="flex items-center gap-0.5 text-primary">
                                                            <Star className="w-3 h-3 fill-current" />
                                                            <Star className="w-3 h-3 fill-current" />
                                                            <Star className="w-3 h-3 fill-current" />
                                                            <Star className="w-3 h-3 fill-current" />
                                                            <Star className="w-3 h-3 fill-current" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 tracking-widest">{labels.reviewDate || '2 Days ago'}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                                                "{(labels.stunningQualityReview || 'Absolutely stunning quality. The attention to detail is evident in every part of the product. Well worth the investment!')}"
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
