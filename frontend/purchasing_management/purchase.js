(() => {
    "use strict";


    document.addEventListener(
        "DOMContentLoaded",
        () => {
           /* =================================================
   LOAD SUPPLIERS
================================================= */

function loadSuppliers() {

    if (!supplierInput) {
        console.error("Supplier select element is missing.");
        return;
    }

    supplierInput.innerHTML = `
        <option value="">
            Select supplier
        </option>
    `;

    let suppliers = [];

    try {

        const storedSuppliers =
            localStorage.getItem("stockmaster_suppliers");

        if (storedSuppliers) {

            suppliers =
                JSON.parse(storedSuppliers);

        }

    } catch (error) {

        console.error(
            "Unable to load suppliers from localStorage:",
            error
        );

        suppliers = [];

    }

    if (!Array.isArray(suppliers)) {

        suppliers = [];

    }

    suppliers.forEach(
        supplier => {

            if (
                !supplier ||
                !supplier.id ||
                !supplier.name
            ) {
                return;
            }

            const option =
                document.createElement("option");

            option.value =
                String(supplier.id);

            option.textContent =
                supplier.name;

            supplierInput.appendChild(
                option
            );

        }
    );

    if (!suppliers.length) {

        const option =
            document.createElement("option");

        option.value = "";

        option.textContent =
            "No suppliers available";

        option.disabled = true;

        supplierInput.appendChild(
            option
        );

    }

}

            // =========================================================
            // ELEMENTS
            // =========================================================

            const form =
                document.getElementById(
                    "purchaseForm"
                );


            const supplierInput =
                document.getElementById(
                    "supplier"
                );


            const purchaseDateInput =
                document.getElementById(
                    "purchaseDate"
                );


            const referenceInput =
                document.getElementById(
                    "referenceNumber"
                );


            const paymentStatusInput =
                document.getElementById(
                    "paymentStatus"
                );


            const notesInput =
                document.getElementById(
                    "notes"
                );


            const productsContainer =
                document.getElementById(
                    "purchaseProducts"
                );


            const addProductButton =
                document.getElementById(
                    "addProduct"
                );


            const subtotalElement =
                document.getElementById(
                    "subtotal"
                );


            const discountInput =
                document.getElementById(
                    "discount"
                );


            const taxInput =
                document.getElementById(
                    "tax"
                );


            const taxRateInput =
                document.getElementById(
                    "taxRate"
                );


            const grandTotalElement =
                document.getElementById(
                    "grandTotal"
                );


            const cancelButton =
                document.getElementById(
                    "cancelPurchase"
                );


            const completeButton =
                document.getElementById(
                    "completePurchase"
                );


            const formFeedback =
                document.getElementById(
                    "formFeedback"
                );


            // =========================================================
            // STORES
            // =========================================================

            const supplierStore =
                window.StockMaster?.SupplierStore;


            const purchaseStore =
                window.StockMaster?.PurchaseStore;


            // =========================================================
            // SAFETY CHECK
            // =========================================================

            if (
                !form ||
                !productsContainer
            ) {

                console.error(
                    "Purchase form: required elements are missing."
                );

                return;
            }


            if (!purchaseStore) {

                console.error(
                    "PurchaseStore is not available."
                );

                return;
            }


            // =========================================================
            // HELPERS
            // =========================================================

            function number(value) {

                const parsed =
                    Number.parseFloat(
                        value
                    );


                return Number.isFinite(
                    parsed
                )
                    ? parsed
                    : 0;
            }


            function money(value) {

                return new Intl.NumberFormat(
                    "en-US",
                    {
                        style: "currency",
                        currency: "USD"
                    }
                ).format(
                    number(value)
                );
            }


            function showFeedback(
                message,
                type = "error"
            ) {

                if (!formFeedback) {

                    alert(message);

                    return;
                }


                formFeedback.textContent =
                    message;


                formFeedback.classList.remove(
                    "hidden",
                    "bg-red-50",
                    "bg-green-50",
                    "bg-amber-50",
                    "text-red-700",
                    "text-green-700",
                    "text-amber-700"
                );


                if (
                    type ===
                    "success"
                ) {

                    formFeedback.classList.add(
                        "bg-green-50",
                        "text-green-700",
                        "dark:bg-green-950",
                        "dark:text-green-400"
                    );

                } else if (
                    type ===
                    "warning"
                ) {

                    formFeedback.classList.add(
                        "bg-amber-50",
                        "text-amber-700",
                        "dark:bg-amber-950",
                        "dark:text-amber-400"
                    );

                } else {

                    formFeedback.classList.add(
                        "bg-red-50",
                        "text-red-700",
                        "dark:bg-red-950",
                        "dark:text-red-400"
                    );
                }
            }


            function clearFeedback() {

                if (!formFeedback) {
                    return;
                }


                formFeedback.textContent =
                    "";


                formFeedback.className =
                    "mb-5 hidden rounded-lg px-4 py-3 text-sm font-medium";
            }


            // =========================================================
            // SUPPLIERS
            // =========================================================

            function loadSuppliers() {

                if (!supplierInput) {
                    return;
                }


                if (!supplierStore) {

                    supplierInput.innerHTML = `
                        <option value="">
                            Supplier data unavailable
                        </option>
                    `;

                    return;
                }


                const suppliers =
                    supplierStore
                        .getActive()
                        .sort(
                            (
                                a,
                                b
                            ) =>
                                String(
                                    a.companyName ||
                                    ""
                                ).localeCompare(
                                    String(
                                        b.companyName ||
                                        ""
                                    )
                                )
                        );


                supplierInput.innerHTML = `
                    <option value="">
                        Select supplier
                    </option>
                `;


                suppliers.forEach(
                    supplier => {

                        const option =
                            document.createElement(
                                "option"
                            );


                        option.value =
                            supplier.id;


                        option.textContent =
                            supplier.companyName ||
                            supplier.name ||
                            "Unnamed Supplier";


                        supplierInput.appendChild(
                            option
                        );
                    }
                );


                if (
                    suppliers.length ===
                    0
                ) {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        "";


                    option.disabled =
                        true;


                    option.textContent =
                        "No active suppliers available";


                    supplierInput.appendChild(
                        option
                    );
                }
            }


            // =========================================================
            // PRODUCT ROWS
            // =========================================================

            function getProductRows() {

                return Array.from(
                    productsContainer.querySelectorAll(
                        ".purchase-product-row"
                    )
                );
            }


            function updateRowTotal(
                row
            ) {

                const quantityInput =
                    row.querySelector(
                        ".product-quantity"
                    );


                const priceInput =
                    row.querySelector(
                        ".product-unit-price"
                    );


                const totalElement =
                    row.querySelector(
                        ".product-line-total"
                    );


                const quantity =
                    number(
                        quantityInput?.value
                    );


                const price =
                    number(
                        priceInput?.value
                    );


                const total =
                    quantity * price;


                if (totalElement) {

                    totalElement.textContent =
                        money(total);
                }


                return total;
            }


            function calculateTotals() {

                let subtotal =
                    0;


                getProductRows().forEach(
                    row => {

                        subtotal +=
                            updateRowTotal(
                                row
                            );
                    }
                );


                const discount =
                    Math.max(
                        0,
                        number(
                            discountInput?.value
                        )
                    );


                const taxRate =
                    Math.max(
                        0,
                        number(
                            taxRateInput?.value
                        )
                    );


                const taxableAmount =
                    Math.max(
                        0,
                        subtotal -
                        discount
                    );


                const tax =
                    taxableAmount *
                    (
                        taxRate /
                        100
                    );


                const grandTotal =
                    taxableAmount +
                    tax;


                if (
                    subtotalElement
                ) {

                    subtotalElement.textContent =
                        money(
                            subtotal
                        );
                }


                if (taxInput) {

                    taxInput.value =
                        tax.toFixed(2);
                }


                if (
                    grandTotalElement
                ) {

                    grandTotalElement.textContent =
                        money(
                            grandTotal
                        );
                }


                return {

                    subtotal,

                    discount,

                    taxRate,

                    tax,

                    grandTotal
                };
            }


            // =========================================================
            // PRODUCT INFORMATION
            // =========================================================

            function updateProductInformation(
                row
            ) {

                const select =
                    row.querySelector(
                        ".product-select"
                    );


                if (!select) {
                    return;
                }


                const option =
                    select.options[
                        select.selectedIndex
                    ];


                if (!option) {
                    return;
                }


                const sku =
                    option.dataset.sku ||
                    "";


                const stock =
                    option.dataset.stock ||
                    "";


                const skuElement =
                    row.querySelector(
                        ".product-sku"
                    );


                const stockElement =
                    row.querySelector(
                        ".product-current-stock"
                    );


                if (skuElement) {

                    skuElement.textContent =
                        sku ||
                        "—";
                }


                if (stockElement) {

                    stockElement.textContent =
                        stock !== ""
                            ? `Current Stock: ${stock}`
                            : "Current Stock: —";
                }
            }


            // =========================================================
            // REMOVE PRODUCT
            // =========================================================

            function removeProductRow(
                row
            ) {

                const rows =
                    getProductRows();


                if (
                    rows.length <=
                    1
                ) {

                    showFeedback(
                        "At least one product is required.",
                        "warning"
                    );

                    return;
                }


                row.remove();


                clearFeedback();


                calculateTotals();
            }


            // =========================================================
            // VALIDATION
            // =========================================================

            function validateQuantity(
                input
            ) {

                const value =
                    number(
                        input.value
                    );


                const valid =
                    value > 0 &&
                    Number.isInteger(
                        value
                    );


                input.classList.toggle(
                    "input-error",
                    !valid
                );


                return valid;
            }


            function validatePrice(
                input
            ) {

                const value =
                    number(
                        input.value
                    );


                const valid =
                    value >= 0;


                input.classList.toggle(
                    "input-error",
                    !valid
                );


                return valid;
            }


            function validateProducts() {

                const rows =
                    getProductRows();


                if (
                    rows.length ===
                    0
                ) {

                    return {

                        valid:
                            false,

                        message:
                            "Add at least one product."
                    };
                }


                const selectedProducts =
                    new Set();


                for (
                    const row of rows
                ) {

                    const select =
                        row.querySelector(
                            ".product-select"
                        );


                    const quantity =
                        row.querySelector(
                            ".product-quantity"
                        );


                    const price =
                        row.querySelector(
                            ".product-unit-price"
                        );


                    if (
                        !select?.value
                    ) {

                        return {

                            valid:
                                false,

                            message:
                                "Please select a product for every row."
                        };
                    }


                    if (
                        selectedProducts.has(
                            select.value
                        )
                    ) {

                        return {

                            valid:
                                false,

                            message:
                                "The same product cannot be added twice."
                        };
                    }


                    selectedProducts.add(
                        select.value
                    );


                    if (
                        !quantity ||
                        !validateQuantity(
                            quantity
                        )
                    ) {

                        return {

                            valid:
                                false,

                            message:
                                "Quantity must be a positive whole number."
                        };
                    }


                    if (
                        !price ||
                        !validatePrice(
                            price
                        )
                    ) {

                        return {

                            valid:
                                false,

                            message:
                                "Unit price must be zero or greater."
                        };
                    }
                }


                return {
                    valid:
                        true
                };
            }


            function validatePurchase() {

                clearFeedback();


                if (
                    !supplierInput?.value
                ) {

                    return {

                        valid:
                            false,

                        message:
                            "Please select a supplier."
                    };
                }


                if (
                    !purchaseDateInput?.value
                ) {

                    return {

                        valid:
                            false,

                        message:
                            "Please select a purchase date."
                    };
                }


                if (
                    !referenceInput?.value.trim()
                ) {

                    return {

                        valid:
                            false,

                        message:
                            "Please enter a reference or purchase order number."
                    };
                }


                const products =
                    validateProducts();


                if (
                    !products.valid
                ) {

                    return products;
                }


                const totals =
                    calculateTotals();


                if (
                    totals.subtotal <=
                    0
                ) {

                    return {

                        valid:
                            false,

                        message:
                            "Purchase subtotal must be greater than zero."
                    };
                }


                if (
                    totals.discount >
                    totals.subtotal
                ) {

                    return {

                        valid:
                            false,

                        message:
                            "Discount cannot be greater than subtotal."
                    };
                }


                return {
                    valid:
                        true
                };
            }


            // =========================================================
            // ATTACH PRODUCT EVENTS
            // =========================================================

            function attachRowEvents(
                row
            ) {

                const quantityInput =
                    row.querySelector(
                        ".product-quantity"
                    );


                const priceInput =
                    row.querySelector(
                        ".product-unit-price"
                    );


                const productSelect =
                    row.querySelector(
                        ".product-select"
                    );


                const removeButton =
                    row.querySelector(
                        ".remove-product"
                    );


                quantityInput?.addEventListener(
                    "input",
                    () => {

                        validateQuantity(
                            quantityInput
                        );

                        calculateTotals();
                    }
                );


                priceInput?.addEventListener(
                    "input",
                    () => {

                        validatePrice(
                            priceInput
                        );

                        calculateTotals();
                    }
                );


                productSelect?.addEventListener(
                    "change",
                    () => {

                        updateProductInformation(
                            row
                        );

                        clearFeedback();

                        calculateTotals();
                    }
                );


                removeButton?.addEventListener(
                    "click",
                    () => {

                        removeProductRow(
                            row
                        );
                    }
                );
            }


            // =========================================================
            // ADD PRODUCT
            // =========================================================

            function addProductRow() {

                const rows =
                    getProductRows();


                if (
                    rows.length ===
                    0
                ) {

                    console.error(
                        "No product row available."
                    );

                    return;
                }


                const template =
                    rows[0];


                const newRow =
                    template.cloneNode(
                        true
                    );


                const select =
                    newRow.querySelector(
                        ".product-select"
                    );


                if (select) {

                    select.selectedIndex =
                        0;
                }


                const quantity =
                    newRow.querySelector(
                        ".product-quantity"
                    );


                if (quantity) {

                    quantity.value =
                        "1";
                }


                const price =
                    newRow.querySelector(
                        ".product-unit-price"
                    );


                if (price) {

                    price.value =
                        "0";
                }


                const lineTotal =
                    newRow.querySelector(
                        ".product-line-total"
                    );


                if (lineTotal) {

                    lineTotal.textContent =
                        money(0);
                }


                const sku =
                    newRow.querySelector(
                        ".product-sku"
                    );


                if (sku) {

                    sku.textContent =
                        "—";
                }


                const stock =
                    newRow.querySelector(
                        ".product-current-stock"
                    );


                if (stock) {

                    stock.textContent =
                        "Current Stock: —";
                }


                productsContainer.appendChild(
                    newRow
                );


                attachRowEvents(
                    newRow
                );


                calculateTotals();


                newRow.scrollIntoView(
                    {
                        behavior:
                            "smooth",

                        block:
                            "center"
                    }
                );
            }


            addProductButton?.addEventListener(
                "click",
                addProductRow
            );


            // =========================================================
            // DISCOUNT / TAX
            // =========================================================

            discountInput?.addEventListener(
                "input",
                calculateTotals
            );


            taxRateInput?.addEventListener(
                "input",
                calculateTotals
            );


            // =========================================================
            // CONFIRMATION MODAL
            // =========================================================

            function confirmPurchase(
                onConfirm
            ) {

                document
                    .getElementById(
                        "purchase-confirm-modal"
                    )
                    ?.remove();


                const modal =
                    document.createElement(
                        "div"
                    );


                modal.id =
                    "purchase-confirm-modal";


                modal.className =
                    "fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4";


                modal.innerHTML = `

                    <div
                        class="
                            w-full
                            max-w-md
                            rounded-xl
                            bg-white
                            p-6
                            shadow-2xl
                            dark:bg-slate-900
                        "
                    >

                        <div
                            class="
                                flex
                                items-start
                                gap-4
                            "
                        >

                            <div
                                class="
                                    flex
                                    h-11
                                    w-11
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-primary/10
                                    text-primary
                                "
                            >

                                <span
                                    class="material-symbols-outlined"
                                >
                                    shopping_cart
                                </span>

                            </div>


                            <div>

                                <h2
                                    class="
                                        text-lg
                                        font-semibold
                                        text-slate-900
                                        dark:text-white
                                    "
                                >
                                    Complete Purchase?
                                </h2>


                                <p
                                    class="
                                        mt-2
                                        text-sm
                                        leading-6
                                        text-slate-500
                                        dark:text-slate-400
                                    "
                                >
                                    The purchase will be saved
                                    to the frontend purchase records.
                                    Inventory will not be changed yet.
                                </p>

                            </div>

                        </div>


                        <div
                            class="
                                mt-6
                                flex
                                justify-end
                                gap-3
                            "
                        >

                            <button
                                type="button"
                                data-confirm-cancel
                                class="
                                    rounded-lg
                                    border
                                    border-slate-300
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-semibold
                                    dark:border-slate-700
                                "
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                data-confirm-submit
                                class="
                                    rounded-lg
                                    bg-primary
                                    px-4
                                    py-2.5
                                    text-sm
                                    font-semibold
                                    text-white
                                "
                            >
                                Save Purchase
                            </button>

                        </div>

                    </div>
                `;


                document.body.appendChild(
                    modal
                );


                modal
                    .querySelector(
                        "[data-confirm-cancel]"
                    )
                    ?.addEventListener(
                        "click",
                        () => {

                            modal.remove();
                        }
                    );


                modal
                    .querySelector(
                        "[data-confirm-submit]"
                    )
                    ?.addEventListener(
                        "click",
                        () => {

                            modal.remove();

                            onConfirm();
                        }
                    );


                modal.addEventListener(
                    "click",
                    event => {

                        if (
                            event.target ===
                            modal
                        ) {

                            modal.remove();
                        }
                    }
                );
            }


            // =========================================================
            // CREATE PURCHASE DATA
            // =========================================================

            function preparePurchaseData() {

                const totals =
                    calculateTotals();


                const supplier =
                    supplierStore?.getById(
                        supplierInput.value
                    );


                if (!supplier) {

                    throw new Error(
                        "Selected supplier could not be found."
                    );
                }


                const products =
                    getProductRows().map(
                        row => {

                            const select =
                                row.querySelector(
                                    ".product-select"
                                );


                            const quantityInput =
                                row.querySelector(
                                    ".product-quantity"
                                );


                            const priceInput =
                                row.querySelector(
                                    ".product-unit-price"
                                );


                            const selectedOption =
                                select?.options[
                                    select.selectedIndex
                                ];


                            const quantity =
                                number(
                                    quantityInput?.value
                                );


                            const unitPrice =
                                number(
                                    priceInput?.value
                                );


                            return {

                                productId:
                                    select?.value ||
                                    "",


                                product:
                                    select?.value ||
                                    "",


                                productName:
                                    selectedOption?.textContent
                                        ?.trim() ||
                                    "Unknown Product",


                                sku:
                                    selectedOption
                                        ?.dataset
                                        ?.sku ||
                                    "",


                                quantity,


                                unitPrice,


                                lineTotal:
                                    quantity *
                                    unitPrice
                            };
                        }
                    );


                return {

                    supplierId:
                        supplier.id,


                    supplier:
                        supplier.id,


                    supplierName:
                        supplier.companyName ||
                        supplier.name ||
                        "Unknown Supplier",


                    purchaseDate:
                        purchaseDateInput.value,


                    reference:
                        referenceInput.value.trim(),


                    paymentStatus:
                        paymentStatusInput?.value ||
                        "pending",


                    status:
                        "Pending",


                    notes:
                        notesInput?.value.trim() ||
                        "",


                    products,


                    subtotal:
                        totals.subtotal,


                    discount:
                        totals.discount,


                    taxRate:
                        totals.taxRate,


                    tax:
                        totals.tax,


                    grandTotal:
                        totals.grandTotal
                };
            }


            // =========================================================
            // SUBMIT
            // =========================================================

            form.addEventListener(
                "submit",
                event => {

                    event.preventDefault();


                    const validation =
                        validatePurchase();


                    if (
                        !validation.valid
                    ) {

                        showFeedback(
                            validation.message,
                            "error"
                        );

                        return;
                    }


                    confirmPurchase(
                        () => {

                            try {

                                const purchaseData =
                                    preparePurchaseData();


                                const purchase =
                                    purchaseStore.create(
                                        purchaseData
                                    );


                                console.log(
                                    "Purchase saved:",
                                    purchase
                                );


                                showFeedback(
                                    `Purchase ${purchase.id} saved successfully.`,
                                    "success"
                                );


                                if (
                                    completeButton
                                ) {

                                    completeButton.disabled =
                                        true;

                                    completeButton.classList.add(
                                        "opacity-60",
                                        "cursor-not-allowed"
                                    );
                                }


                                /*
                                 * Give the success message a moment
                                 * to be visible before returning to
                                 * the purchasing page.
                                 */

                                window.setTimeout(
                                    () => {

                                        window.location.href =
                                            "purchasing.html";

                                    },
                                    700
                                );

                            } catch (
                                error
                            ) {

                                console.error(
                                    "Could not save purchase:",
                                    error
                                );


                                showFeedback(
                                    error.message ||
                                    "The purchase could not be saved.",
                                    "error"
                                );
                            }
                        }
                    );
                }
            );


            // =========================================================
            // CANCEL
            // =========================================================

            cancelButton?.addEventListener(
                "click",
                () => {

                    const confirmed =
                        window.confirm(
                            "Are you sure you want to cancel this purchase? Unsaved changes will be lost."
                        );


                    if (!confirmed) {
                        return;
                    }


                    window.location.href =
                        "purchasing.html";
                }
            );


            // LOAD SUPPLIERS

            loadSuppliers();

            // =========================================================
            // INITIALIZE PRODUCT ROWS
            // =========================================================

            getProductRows().forEach(
                row => {

                    attachRowEvents(
                        row
                    );


                    updateProductInformation(
                        row
                    );
                }
            );


           

            // =========================================================
            // DEFAULT DATE
            // =========================================================

            if (
                purchaseDateInput &&
                !purchaseDateInput.value
            ) {

                const today =
                    new Date();


                const year =
                    today.getFullYear();


                const month =
                    String(
                        today.getMonth() + 1
                    )
                        .padStart(
                            2,
                            "0"
                        );


                const day =
                    String(
                        today.getDate()
                    )
                        .padStart(
                            2,
                            "0"
                        );


                purchaseDateInput.value =
                    `${year}-${month}-${day}`;
            }


            // =========================================================
            // INITIAL CALCULATION
            // =========================================================

            calculateTotals();

        }
    );

})();