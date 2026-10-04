 
import { useState, useEffect, useMemo, useCallback } from "react";
import { useGenericState } from "@/store/use-generic-state";
import { useConfigStore } from "@/store/use-config-store";
import { apiClient } from "@/engine";

export interface PriceRules {
  tax_rate: number;
  shipping_fee: number;
  free_shipping_threshold: number;
}

const DEFAULT_PRICE_RULES: PriceRules = {
  tax_rate: 0.08,
  shipping_fee: 5.0,
  free_shipping_threshold: 30.0,
};

const EMPTY_ARRAY: any[] = [];
const DEFAULT_USER = { id: null, name: "Guest" };

export function useCartCalculation(options?: {
  priceRules?: Partial<PriceRules>;
}) {
  const [productsList, setProductsList] = useState<any[]>([]);
  const [promoCodesList, setPromoCodesList] = useState<any[]>([]);
  const [dealsList, setDealsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Load configs
  const globalConfig = useConfigStore((state) => state.config);

  // Retrieve states reactively from generic state with stable references
  const cartData = useGenericState((state: any) => state.data?.cart);
  const cartItems = useMemo(
    () => (Array.isArray(cartData) ? cartData : EMPTY_ARRAY),
    [cartData],
  );

  const selectedUser = useGenericState(
    useCallback(
      (state: any) => state.data["selected_user"] || DEFAULT_USER,
      [],
    ),
  );

  const appliedCoupons = useGenericState(
    useCallback(
      (state: any) => state.data["applied_coupons"] || EMPTY_ARRAY,
      [],
    ),
  );

  const gsUpdate = useGenericState((state) => state.update);

  // Fetch API lists on mount
  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      apiClient("product"),
      apiClient("promo-code"),
      apiClient("deal"),
    ])
      .then(([prodRes, promoRes, dealRes]) => {
        if (!active) return;
        if (prodRes && !prodRes.error && prodRes.data) {
          setProductsList(
            Array.isArray(prodRes.data)
              ? prodRes.data
              : prodRes.data.data || [],
          );
        }
        if (promoRes && !promoRes.error && promoRes.data) {
          setPromoCodesList(
            Array.isArray(promoRes.data)
              ? promoRes.data
              : promoRes.data.data || [],
          );
        }
        if (dealRes && !dealRes.error && dealRes.data) {
          setDealsList(
            Array.isArray(dealRes.data)
              ? dealRes.data
              : dealRes.data.data || [],
          );
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(
          "[useCartCalculation] Error loading pricing engine data:",
          err,
        );
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Normalize cart items
  const cart = useMemo(() => {
    return cartItems.map((item: any) => {
      const prodInfo = productsList.find(
        (p: any) => String(p.id) === String(item.id),
      );
      const price = Number(
        item.price ?? item.unit_price ?? prodInfo?.price ?? 0,
      );
      const name = item.name || prodInfo?.name || `Product ${item.id}`;
      const image = item.image || prodInfo?.image || "📦";
      return {
        id: item.id,
        quantity: item.qty || item.quantity || 1,
        name,
        price,
        image,
      };
    });
  }, [cartItems, productsList]);

  // Stock tracking
  const stockMap = useMemo(() => {
    const map: Record<string, number> = {};
    productsList.forEach((p: any) => {
      map[String(p.id)] = p.stock !== undefined ? p.stock : 999;
    });
    return map;
  }, [productsList]);

  const getProductStock = useCallback(
    (id: any) => {
      return stockMap[String(id)] !== undefined ? stockMap[String(id)] : 999;
    },
    [stockMap],
  );

  // Product categories tracking
  const getProductCategories = useCallback(
    (id: any) => {
      const prod = productsList.find((p: any) => String(p.id) === String(id));
      if (!prod) return [];
      const cats = prod.category_id || prod.category || [];
      return Array.isArray(cats) ? cats : [cats];
    },
    [productsList],
  );

  // Derive price rules
  const priceRules = useMemo<PriceRules>(() => {
    const pageRules = globalConfig?.properties?.price_rules || {};
    return {
      ...DEFAULT_PRICE_RULES,
      ...pageRules,
      ...(options?.priceRules || {}),
    };
  }, [globalConfig, options?.priceRules]);

  // subtotal
  const subtotal = useMemo(() => {
    return cart.reduce(
      (acc: number, item: any) => acc + item.price * item.quantity,
      0,
    );
  }, [cart]);

  // deals calculation
  const dealsDiscount = useMemo(() => {
    let total = 0;
    const applied: { title: string; discount: number }[] = [];

    dealsList.forEach((deal: any) => {
      let dealAmount = 0;
      if (deal.type === "user_discount" && selectedUser.id !== null) {
        const userAssignment = deal.assignment?.user_id;
        const matchesUser = Array.isArray(userAssignment)
          ? userAssignment.map(String).includes(String(selectedUser.id))
          : String(userAssignment) === String(selectedUser.id);
        if (matchesUser) {
          dealAmount = subtotal * deal.value;
        }
      } else if (deal.type === "product_discount") {
        const prodAssignment = deal.assignment?.product_id;
        const targetProdIds = Array.isArray(prodAssignment)
          ? prodAssignment.map(String)
          : [String(prodAssignment)];
        cart.forEach((item: any) => {
          if (targetProdIds.includes(String(item.id))) {
            dealAmount += item.quantity * deal.value;
          }
        });
      } else if (deal.type === "category_discount") {
        const catAssignment = deal.assignment?.category_id;
        const targetCatIds = Array.isArray(catAssignment)
          ? catAssignment.map(String)
          : [String(catAssignment)];
        cart.forEach((item: any) => {
          const itemCategories = getProductCategories(item.id).map(String);
          const matchesCategory = targetCatIds.some((catId) =>
            itemCategories.includes(catId),
          );
          if (matchesCategory) {
            dealAmount += item.quantity * deal.value;
          }
        });
      }

      if (dealAmount > 0) {
        total += dealAmount;
        applied.push({
          title: deal.title,
          discount: dealAmount,
        });
      }
    });

    return {
      total,
      applied,
    };
  }, [dealsList, selectedUser, subtotal, cart, getProductCategories]);

  const subtotalAfterDeals = useMemo(() => {
    return Math.max(0, subtotal - dealsDiscount.total);
  }, [subtotal, dealsDiscount.total]);

  // Validate single coupon code against current cart
  const validateCoupon = useCallback(
    (coupon: any) => {
      if (coupon.conditions) {
        const {
          min_purchase,
          require_categories,
          relation = "AND",
        } = coupon.conditions;
        const meetsMinPurchase = min_purchase
          ? subtotalAfterDeals >= min_purchase
          : true;
        let meetsCategories = true;

        if (require_categories && require_categories.length > 0) {
          meetsCategories = cart.some((item: any) => {
            const itemCats = getProductCategories(item.id);
            return require_categories.some((catId: any) =>
              itemCats.includes(catId),
            );
          });
        }

        if (relation === "AND") {
          if (!meetsMinPurchase || !meetsCategories) {
            if (!meetsMinPurchase)
              return `Min order $${min_purchase.toFixed(2)} required`;
            return "Required category missing";
          }
        } else {
          if (!meetsMinPurchase && !meetsCategories) {
            return `Min order $${min_purchase.toFixed(2)} or specific category required`;
          }
        }
      }

      if (coupon.type === "bogo_same") {
        const { product_id, buy_qty, get_qty } = coupon.rules;
        const item = cart.find((i: any) => String(i.id) === String(product_id));
        const requiredQty = buy_qty + get_qty;
        if (!item || item.quantity < requiredQty) {
          const diff = requiredQty - (item ? item.quantity : 0);
          return `Add ${diff} more units for BOGO`;
        }
      }

      if (coupon.type === "bogo_diff") {
        const { buy_product_id, buy_qty, get_product_id } = coupon.rules;
        const buyItem = cart.find(
          (i: any) => String(i.id) === String(buy_product_id),
        );
        const getItem = cart.find(
          (i: any) => String(i.id) === String(get_product_id),
        );
        if (!buyItem || buyItem.quantity < buy_qty) {
          const diff = buy_qty - (buyItem ? buyItem.quantity : 0);
          const buyName =
            productsList.find((p) => String(p.id) === String(buy_product_id))
              ?.name || "Spinach";
          return `Add ${diff} more ${buyName} to qualify`;
        }
        if (!getItem) {
          const getName =
            productsList.find((p) => String(p.id) === String(get_product_id))
              ?.name || "Tomato";
          return `Add ${getName} to activate BOGO`;
        }
      }

      if (coupon.type === "bogo_category") {
        const { category_id, buy_qty, get_qty } = coupon.rules;
        const requiredQty = buy_qty + get_qty;
        const matchingCount = cart
          .filter((item: any) =>
            getProductCategories(item.id).includes(category_id),
          )
          .reduce((sum: number, item: any) => sum + item.quantity, 0);
        if (matchingCount < requiredQty) {
          const diff = requiredQty - matchingCount;
          return `Add ${diff} more matching items`;
        }
      }

      return null;
    },
    [subtotalAfterDeals, cart, getProductCategories, productsList],
  );

  // coupon breakdown calculation
  const discountBreakdown = useMemo(() => {
    let currentSubtotal = subtotalAfterDeals;
    let totalDiscount = 0;
    const breakdown: Record<string, number> = {};
    let freeShippingCouponApplied = false;

    appliedCoupons.forEach((coupon: any) => {
      const validationError = validateCoupon(coupon);
      if (validationError) {
        breakdown[coupon.code] = 0;
        return;
      }

      let discount = 0;
      if (coupon.type === "percent") {
        discount = currentSubtotal * coupon.value;
      } else if (coupon.type === "fixed") {
        discount = Math.min(coupon.value, currentSubtotal);
      } else if (coupon.type === "free_shipping") {
        discount = 0;
        freeShippingCouponApplied = true;
      } else if (coupon.type === "bogo_same") {
        const { product_id, buy_qty, get_qty } = coupon.rules;
        const item = cart.find((i: any) => String(i.id) === String(product_id));
        if (item) {
          const groupSize = buy_qty + get_qty;
          const freeGroups = Math.floor(item.quantity / groupSize);
          discount = freeGroups * get_qty * item.price;
        }
      } else if (coupon.type === "bogo_diff") {
        const { buy_product_id, buy_qty, get_product_id, get_qty } =
          coupon.rules;
        const buyItem = cart.find(
          (i: any) => String(i.id) === String(buy_product_id),
        );
        const getItem = cart.find(
          (i: any) => String(i.id) === String(get_product_id),
        );
        if (buyItem && getItem) {
          const possibleFreeGroups = Math.floor(buyItem.quantity / buy_qty);
          const actualFreeQty = Math.min(
            possibleFreeGroups * get_qty,
            getItem.quantity,
          );
          discount = actualFreeQty * getItem.price;
        }
      } else if (coupon.type === "bogo_category") {
        const { category_id, buy_qty, get_qty } = coupon.rules;
        const catPrices: number[] = [];
        cart.forEach((item: any) => {
          if (getProductCategories(item.id).includes(category_id)) {
            for (let i = 0; i < item.quantity; i++) {
              catPrices.push(item.price);
            }
          }
        });
        catPrices.sort((a, b) => a - b);
        const groupSize = buy_qty + get_qty;
        const freeCount = Math.floor(catPrices.length / groupSize) * get_qty;
        discount = catPrices.slice(0, freeCount).reduce((sum, p) => sum + p, 0);
      }

      breakdown[coupon.code] = discount;
      totalDiscount += discount;
      currentSubtotal = Math.max(0, currentSubtotal - discount);
    });

    return { breakdown, totalDiscount, freeShippingCouponApplied };
  }, [
    appliedCoupons,
    subtotalAfterDeals,
    cart,
    getProductCategories,
    validateCoupon,
  ]);

  const discountAmount = dealsDiscount.total + discountBreakdown.totalDiscount;

  const shipping = useMemo(() => {
    if (
      subtotal === 0 ||
      subtotal >= priceRules.free_shipping_threshold ||
      discountBreakdown.freeShippingCouponApplied
    ) {
      return 0;
    }
    return priceRules.shipping_fee;
  }, [
    subtotal,
    priceRules.free_shipping_threshold,
    priceRules.shipping_fee,
    discountBreakdown.freeShippingCouponApplied,
  ]);

  const tax = useMemo(() => {
    return (
      Math.max(0, subtotalAfterDeals - discountBreakdown.totalDiscount) *
      priceRules.tax_rate
    );
  }, [
    subtotalAfterDeals,
    discountBreakdown.totalDiscount,
    priceRules.tax_rate,
  ]);

  const total = useMemo(() => {
    return Math.max(
      0,
      subtotalAfterDeals - discountBreakdown.totalDiscount + tax + shipping,
    );
  }, [subtotalAfterDeals, discountBreakdown.totalDiscount, tax, shipping]);

  // Actions
  const setSelectedUser = useCallback(
    (user: any) => {
      gsUpdate("selected_user", user);
    },
    [gsUpdate],
  );

  const applyCoupon = useCallback(
    (code: string) => {
      setCouponError(null);
      const codeClean = code.trim().toUpperCase();

      if (appliedCoupons.some((c: any) => c.code.toUpperCase() === codeClean)) {
        const err = "Promo code already applied";
        setCouponError(err);
        return err;
      }

      if (appliedCoupons.length >= 2) {
        const err = "Maximum 2 promo codes can be applied";
        setCouponError(err);
        return err;
      }

      const found = promoCodesList.find(
        (c: any) => c.code.toUpperCase() === codeClean,
      );
      if (found) {
        const err = validateCoupon(found);
        if (err) {
          setCouponError(err);
          return err;
        } else {
          gsUpdate("applied_coupons", [...appliedCoupons, found]);
          return null;
        }
      } else {
        const err = "Invalid promo code";
        setCouponError(err);
        return err;
      }
    },
    [appliedCoupons, promoCodesList, validateCoupon, gsUpdate],
  );

  const removeCoupon = useCallback(
    (code: string) => {
      const updated = appliedCoupons.filter(
        (c: any) => c.code.toUpperCase() !== code.toUpperCase(),
      );
      gsUpdate("applied_coupons", updated);
    },
    [appliedCoupons, gsUpdate],
  );

  return {
    cart,
    selectedUser,
    appliedCoupons,
    subtotal,
    dealsDiscount,
    subtotalAfterDeals,
    discountBreakdown,
    discountAmount,
    shipping,
    tax,
    total,
    loading,
    couponError,
    setCouponError,
    setSelectedUser,
    applyCoupon,
    removeCoupon,
    getProductStock,
    getProductCategories,
    validateCoupon,
  };
}
