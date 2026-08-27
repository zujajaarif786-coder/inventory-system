(() => {
    "use strict";

    // =========================================================
    // STOCKMASTER - PURCHASE DATA STORE
    //
    // Frontend-only storage for development.
    //
    // IMPORTANT:
    // This store does NOT update inventory.
    // Django will eventually become responsible for:
    // - Purchase validation
    // - Database persistence
    // - Inventory updates
    // - Transaction safety
    // =========================================================


    const STORAGE_KEY =
        "stockmaster_purchases";


    // =========================================================
    // HELPERS
    // =========================================================

    function generateId() {

        return (
            "PO-" +
            new Date()
                .getFullYear()
                .toString() +
            "-" +
            Date.now()
                .toString(36)
                .toUpperCase()
        );
    }


    function now() {

        return new Date().toISOString();
    }


    function loadPurchases() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!saved) {
                return [];
            }


            const data =
                JSON.parse(saved);


            return Array.isArray(data)
                ? data
                : [];

        } catch (error) {

            console.error(
                "StockMaster: Could not load purchases.",
                error
            );

            return [];
        }
    }


    function savePurchases(
        purchases
    ) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(purchases)
            );

            return true;

        } catch (error) {

            console.error(
                "StockMaster: Could not save purchases.",
                error
            );

            return false;
        }
    }


    function normalizePurchase(
        purchase
    ) {

        if (!purchase) {
            return null;
        }


        const products =
            Array.isArray(
                purchase.products
            )
                ? purchase.products
                : [];


        const subtotal =
            Number(purchase.subtotal) || 0;


        const discount =
            Number(purchase.discount) || 0;


        const taxRate =
            Number(purchase.taxRate) || 0;


        const tax =
            Number(purchase.tax) || 0;


        const grandTotal =
            Number(purchase.grandTotal) || 0;


        return {

            id:
                purchase.id || "",


            supplierId:
                purchase.supplierId ||
                purchase.supplier ||
                "",


            supplierName:
                purchase.supplierName ||
                "Unknown Supplier",


            purchaseDate:
                purchase.purchaseDate ||
                "",


            reference:
                purchase.reference ||
                "",


            paymentStatus:
                purchase.paymentStatus ||
                "pending",


            /*
             * Purchase status is deliberately kept
             * separate from payment status.
             *
             * Frontend-created purchases start as Pending.
             * Django will eventually control the real
             * receiving/stock status.
             */
            status:
                purchase.status ||
                "Pending",


            notes:
                purchase.notes ||
                "",


            products:


                products.map(
                    product => ({

                        productId:
                            product.productId ||
                            product.product ||
                            "",


                        productName:
                            product.productName ||
                            "Unknown Product",


                        sku:
                            product.sku ||
                            "",


                        quantity:
                            Number(
                                product.quantity
                            ) || 0,


                        unitPrice:
                            Number(
                                product.unitPrice
                            ) || 0,


                        lineTotal:
                            Number(
                                product.lineTotal
                            ) ||
                            (
                                (
                                    Number(
                                        product.quantity
                                    ) || 0
                                ) *
                                (
                                    Number(
                                        product.unitPrice
                                    ) || 0
                                )
                            )
                    })
                ),


            subtotal,
            discount,
            taxRate,
            tax,
            grandTotal,


            createdAt:
                purchase.createdAt ||
                now(),


            updatedAt:
                purchase.updatedAt ||
                now()
        };
    }


    // =========================================================
    // PURCHASE STORE
    // =========================================================

    const PurchaseStore = {


        // =====================================================
        // GET ALL
        // =====================================================

        getAll() {

            return loadPurchases()
                .map(
                    normalizePurchase
                )
                .filter(Boolean)
                .sort(
                    (
                        a,
                        b
                    ) => {

                        return (
                            new Date(
                                b.createdAt
                            ) -
                            new Date(
                                a.createdAt
                            )
                        );
                    }
                );
        },


        // =====================================================
        // GET BY ID
        // =====================================================

        getById(id) {

            if (!id) {
                return null;
            }


            return (
                this.getAll().find(
                    purchase =>
                        String(
                            purchase.id
                        ) ===
                        String(id)
                ) ||
                null
            );
        },


        // =====================================================
        // CREATE
        // =====================================================

        create(data = {}) {

            const purchases =
                this.getAll();


            if (!data.supplierId) {

                throw new Error(
                    "Supplier is required."
                );
            }


            if (
                !data.purchaseDate
            ) {

                throw new Error(
                    "Purchase date is required."
                );
            }


            if (
                !data.reference ||
                !String(
                    data.reference
                ).trim()
            ) {

                throw new Error(
                    "Reference number is required."
                );
            }


            if (
                !Array.isArray(
                    data.products
                ) ||
                data.products.length === 0
            ) {

                throw new Error(
                    "At least one product is required."
                );
            }


            const duplicateReference =
                purchases.some(
                    purchase =>
                        purchase.reference
                            .trim()
                            .toLowerCase() ===
                        String(
                            data.reference
                        )
                            .trim()
                            .toLowerCase()
                );


            if (
                duplicateReference
            ) {

                throw new Error(
                    "A purchase with this reference number already exists."
                );
            }


            const purchase =
                normalizePurchase({

                    id:
                        generateId(),


                    supplierId:
                        data.supplierId,


                    supplierName:
                        data.supplierName ||
                        "Unknown Supplier",


                    purchaseDate:
                        data.purchaseDate,


                    reference:
                        String(
                            data.reference
                        ).trim(),


                    paymentStatus:
                        data.paymentStatus ||
                        "pending",


                    status:
                        data.status ||
                        "Pending",


                    notes:
                        data.notes ||
                        "",


                    products:
                        data.products,


                    subtotal:
                        data.subtotal,


                    discount:
                        data.discount,


                    taxRate:
                        data.taxRate,


                    tax:
                        data.tax,


                    grandTotal:
                        data.grandTotal,


                    createdAt:
                        now(),


                    updatedAt:
                        now()
                });


            purchases.unshift(
                purchase
            );


            const saved =
                savePurchases(
                    purchases
                );


            if (!saved) {

                throw new Error(
                    "Purchase could not be saved."
                );
            }


            return purchase;
        },


        // =====================================================
        // UPDATE
        // =====================================================

        update(
            id,
            data = {}
        ) {

            if (!id) {

                throw new Error(
                    "Purchase ID is required."
                );
            }


            const purchases =
                this.getAll();


            const index =
                purchases.findIndex(
                    purchase =>
                        String(
                            purchase.id
                        ) ===
                        String(id)
                );


            if (index === -1) {

                throw new Error(
                    "Purchase not found."
                );
            }


            const existing =
                purchases[index];


            const updated =
                normalizePurchase({

                    ...existing,

                    ...data,


                    id:
                        existing.id,


                    createdAt:
                        existing.createdAt,


                    updatedAt:
                        now()
                });


            purchases[index] =
                updated;


            const saved =
                savePurchases(
                    purchases
                );


            if (!saved) {

                throw new Error(
                    "Purchase could not be updated."
                );
            }


            return updated;
        },


        // =====================================================
        // DELETE
        // =====================================================

        remove(id) {

            if (!id) {

                throw new Error(
                    "Purchase ID is required."
                );
            }


            const purchases =
                this.getAll();


            const filtered =
                purchases.filter(
                    purchase =>
                        String(
                            purchase.id
                        ) !==
                        String(id)
                );


            if (
                filtered.length ===
                purchases.length
            ) {

                return false;
            }


            const saved =
                savePurchases(
                    filtered
                );


            if (!saved) {

                throw new Error(
                    "Purchase could not be deleted."
                );
            }


            return true;
        },


        // =====================================================
        // SEARCH
        // =====================================================

        search(
            query = ""
        ) {

            const term =
                String(query)
                    .trim()
                    .toLowerCase();


            if (!term) {
                return this.getAll();
            }


            return this.getAll()
                .filter(
                    purchase => {

                        const searchable =
                            [

                                purchase.id,

                                purchase.reference,

                                purchase.supplierName,

                                purchase.status,

                                purchase.paymentStatus,

                                purchase.purchaseDate

                            ]
                                .join(" ")
                                .toLowerCase();


                        return searchable.includes(
                            term
                        );
                    }
                );
        },


        // =====================================================
        // CLEAR ALL
        // =====================================================

        /*
         * Development/testing only.
         *
         * Do not expose this from the normal UI.
         */

        clearAll() {

            localStorage.removeItem(
                STORAGE_KEY
            );

            return true;
        }
    };


    // =========================================================
    // GLOBAL STOCKMASTER OBJECT
    // =========================================================

    window.StockMaster =
        window.StockMaster || {};


    window.StockMaster.PurchaseStore =
        PurchaseStore;


    console.log(
        "StockMaster PurchaseStore loaded successfully."
    );

})();