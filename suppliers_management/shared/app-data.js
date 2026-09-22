(() => {
    "use strict";

    /*
     * =========================================================
     * STOCKMASTER FRONTEND DATA STORE
     * =========================================================
     *
     * Temporary frontend storage for development.
     *
     * IMPORTANT:
     * This is NOT the Django database.
     *
     * Later:
     * SupplierStore and PurchaseStore can be replaced with
     * Django API calls without changing the UI structure.
     * =========================================================
     */


    /* =========================================================
       STORAGE KEYS
    ========================================================= */

    const SUPPLIER_STORAGE_KEY =
        "stockmaster_suppliers";

    const PURCHASE_STORAGE_KEY =
        "stockmaster_purchases";


    /* =========================================================
       COMMON HELPERS
    ========================================================= */

    function now() {

        return new Date().toISOString();

    }


    function generateId(prefix) {

        return (
            prefix +
            "-" +
            Date.now().toString(36).toUpperCase() +
            "-" +
            Math.random()
                .toString(36)
                .substring(2, 7)
                .toUpperCase()
        );

    }


    function safeNumber(value) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : 0;

    }


    function loadArray(storageKey) {

        try {

            const saved =
                localStorage.getItem(
                    storageKey
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
                "StockMaster: Unable to load data.",
                error
            );

            return [];

        }

    }


    function saveArray(
        storageKey,
        data
    ) {

        try {

            localStorage.setItem(
                storageKey,
                JSON.stringify(data)
            );

            return true;

        } catch (error) {

            console.error(
                "StockMaster: Unable to save data.",
                error
            );

            return false;

        }

    }



    /* =========================================================
       SUPPLIER NORMALIZATION
    ========================================================= */

    function normalizeSupplier(
        supplier
    ) {

        if (!supplier) {

            return null;

        }


        return {

            id:
                supplier.id ||
                generateId("SUP"),

            companyName:
                supplier.companyName ||
                supplier.name ||
                "",

            name:
                supplier.companyName ||
                supplier.name ||
                "",

            code:
                supplier.code ||
                "",

            contactPerson:
                supplier.contactPerson ||
                supplier.contact ||
                "",

            contact:
                supplier.contactPerson ||
                supplier.contact ||
                "",

            phone:
                supplier.phone ||
                "",

            email:
                supplier.email ||
                "",

            website:
                supplier.website ||
                "",

            address:
                supplier.address ||
                "",

            city:
                supplier.city ||
                "",

            state:
                supplier.state ||
                "",

            postalCode:
                supplier.postalCode ||
                "",

            country:
                supplier.country ||
                "",

            taxNumber:
                supplier.taxNumber ||
                "",

            paymentTerms:
                supplier.paymentTerms ||
                "Net 30",

            status:
                supplier.status ||
                "Active",

            notes:
                supplier.notes ||
                "",

            products:
                safeNumber(
                    supplier.products
                ),

            purchases:
                safeNumber(
                    supplier.purchases
                ),

            outstanding:
                safeNumber(
                    supplier.outstanding
                ),

            createdAt:
                supplier.createdAt ||
                now(),

            updatedAt:
                supplier.updatedAt ||
                now()
        };

    }



    /* =========================================================
       SUPPLIER STORE
    ========================================================= */

    const SupplierStore = {


        getAll() {

            return loadArray(
                SUPPLIER_STORAGE_KEY
            )
                .map(normalizeSupplier)
                .filter(Boolean);

        },


        getActive() {

            return this.getAll()
                .filter(
                    supplier =>
                        supplier.status ===
                        "Active"
                );

        },


        getArchived() {

            return this.getAll()
                .filter(
                    supplier =>
                        supplier.status ===
                        "Archived"
                );

        },


        getById(id) {

            if (!id) {

                return null;

            }


            return (
                this.getAll().find(
                    supplier =>
                        String(
                            supplier.id
                        ) ===
                        String(id)
                ) ||
                null
            );

        },


        create(data = {}) {

            const suppliers =
                this.getAll();


            const supplier =
                normalizeSupplier({

                    id:
                        generateId("SUP"),

                    companyName:
                        data.companyName ||
                        "",

                    code:
                        data.code ||
                        `SUP-${String(
                            suppliers.length + 1
                        ).padStart(4, "0")}`,

                    contactPerson:
                        data.contactPerson ||
                        "",

                    phone:
                        data.phone ||
                        "",

                    email:
                        data.email ||
                        "",

                    website:
                        data.website ||
                        "",

                    address:
                        data.address ||
                        "",

                    city:
                        data.city ||
                        "",

                    state:
                        data.state ||
                        "",

                    postalCode:
                        data.postalCode ||
                        "",

                    country:
                        data.country ||
                        "",

                    taxNumber:
                        data.taxNumber ||
                        "",

                    paymentTerms:
                        data.paymentTerms ||
                        "Net 30",

                    status:
                        data.status ||
                        "Active",

                    notes:
                        data.notes ||
                        "",

                    products: 0,

                    purchases: 0,

                    outstanding: 0,

                    createdAt:
                        now(),

                    updatedAt:
                        now()

                });


            suppliers.push(
                supplier
            );


            if (
                !saveArray(
                    SUPPLIER_STORAGE_KEY,
                    suppliers
                )
            ) {

                throw new Error(
                    "Supplier could not be saved."
                );

            }


            return supplier;

        },


        update(
            id,
            data = {}
        ) {

            const suppliers =
                this.getAll();


            const index =
                suppliers.findIndex(
                    supplier =>
                        String(
                            supplier.id
                        ) ===
                        String(id)
                );


            if (index === -1) {

                throw new Error(
                    "Supplier not found."
                );

            }


            const oldSupplier =
                suppliers[index];


            suppliers[index] =
                normalizeSupplier({

                    ...oldSupplier,

                    ...data,

                    id:
                        oldSupplier.id,

                    products:
                        data.products ??
                        oldSupplier.products,

                    purchases:
                        data.purchases ??
                        oldSupplier.purchases,

                    outstanding:
                        data.outstanding ??
                        oldSupplier.outstanding,

                    createdAt:
                        oldSupplier.createdAt,

                    updatedAt:
                        now()

                });


            if (
                !saveArray(
                    SUPPLIER_STORAGE_KEY,
                    suppliers
                )
            ) {

                throw new Error(
                    "Supplier could not be updated."
                );

            }


            return suppliers[index];

        },


        archive(id) {

            return this.update(
                id,
                {
                    status: "Archived"
                }
            );

        },


        /*
         * Increase supplier purchase statistics.
         *
         * This is frontend-only for now.
         * Django will eventually calculate this from
         * actual Purchase records.
         */

        addPurchaseAmount(
            supplierId,
            amount
        ) {

            const supplier =
                this.getById(
                    supplierId
                );


            if (!supplier) {

                return null;

            }


            const current =
                safeNumber(
                    supplier.purchases
                );


            return this.update(
                supplier.id,
                {
                    purchases:
                        current +
                        safeNumber(amount)
                }
            );

        }

    };



    /* =========================================================
       PURCHASE NORMALIZATION
    ========================================================= */

    function normalizePurchase(
        purchase
    ) {

        if (!purchase) {

            return null;

        }


        return {

            id:
                purchase.id ||
                generateId("PUR"),

            purchaseNumber:
                purchase.purchaseNumber ||
                purchase.reference ||
                generateId("PO"),

            supplierId:
                purchase.supplierId ||
                purchase.supplier ||
                "",

            supplierName:
                purchase.supplierName ||
                "",

            purchaseDate:
                purchase.purchaseDate ||
                "",

            reference:
                purchase.reference ||
                "",

            paymentStatus:
                purchase.paymentStatus ||
                "pending",

            status:
                purchase.status ||
                "Pending",

            notes:
                purchase.notes ||
                "",

            products:
                Array.isArray(
                    purchase.products
                )
                    ? purchase.products
                    : [],

            subtotal:
                safeNumber(
                    purchase.subtotal
                ),

            discount:
                safeNumber(
                    purchase.discount
                ),

            taxRate:
                safeNumber(
                    purchase.taxRate
                ),

            tax:
                safeNumber(
                    purchase.tax
                ),

            grandTotal:
                safeNumber(
                    purchase.grandTotal
                ),

            createdAt:
                purchase.createdAt ||
                now(),

            updatedAt:
                purchase.updatedAt ||
                now()
        };

    }



    /* =========================================================
       PURCHASE STORE
    ========================================================= */

    const PurchaseStore = {


        getAll() {

            return loadArray(
                PURCHASE_STORAGE_KEY
            )
                .map(normalizePurchase)
                .filter(Boolean)
                .sort(
                    (
                        first,
                        second
                    ) =>
                        new Date(
                            second.createdAt
                        ) -
                        new Date(
                            first.createdAt
                        )
                );

        },


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


        getRecent(limit = 5) {

            return this.getAll()
                .slice(
                    0,
                    Math.max(
                        1,
                        safeNumber(limit)
                    )
                );

        },


        create(data = {}) {

            const purchases =
                this.getAll();


            const supplier =
                SupplierStore.getById(
                    data.supplierId
                );


            if (!supplier) {

                throw new Error(
                    "Selected supplier was not found."
                );

            }


            const purchaseNumber =
                data.purchaseNumber ||
                `PO-${new Date()
                    .getFullYear()}-${String(
                    purchases.length + 1
                ).padStart(4, "0")}`;


            const purchase =
                normalizePurchase({

                    id:
                        generateId("PUR"),

                    purchaseNumber,

                    supplierId:
                        supplier.id,

                    supplierName:
                        supplier.companyName,

                    purchaseDate:
                        data.purchaseDate ||
                        "",

                    reference:
                        data.reference ||
                        purchaseNumber,

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
                        Array.isArray(
                            data.products
                        )
                            ? data.products
                            : [],

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


            purchases.push(
                purchase
            );


            if (
                !saveArray(
                    PURCHASE_STORAGE_KEY,
                    purchases
                )
            ) {

                throw new Error(
                    "Purchase could not be saved."
                );

            }


            /*
             * Update supplier purchase statistics.
             *
             * This is only frontend/demo behavior.
             * It will later be calculated by Django.
             */

            SupplierStore.addPurchaseAmount(
                supplier.id,
                purchase.grandTotal
            );


            return purchase;

        },


        clearAll() {

            localStorage.removeItem(
                PURCHASE_STORAGE_KEY
            );

            return true;

        }

    };



    /* =========================================================
       GLOBAL STOCKMASTER OBJECT
    ========================================================= */

    window.StockMaster =
        window.StockMaster || {};


    window.StockMaster.SupplierStore =
        SupplierStore;


    window.StockMaster.PurchaseStore =
        PurchaseStore;


    console.log(
        "StockMaster frontend data stores loaded."
    );

})();