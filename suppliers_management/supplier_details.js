(() => {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {

        // ---------------------------------------------------------
        // DEMO SUPPLIER
        // ---------------------------------------------------------

       const params =
    new URLSearchParams(
        window.location.search
    );

const supplierId =
    params.get("id");

const supplier =
    window.StockMaster.SupplierStore.getById(
        supplierId
    );

if (!supplier) {

    console.error(
        "Supplier not found."
    );

    window.location.href =
        "suppliers_list.html";

    return;
}

        // ---------------------------------------------------------
        // ELEMENTS
        // ---------------------------------------------------------

        const elements = {
            name: document.getElementById("supplierName"),
            code: document.getElementById("supplierCode"),
            status: document.getElementById("supplierStatus"),

            productsCount:
                document.getElementById("productsCount"),

            totalPurchases:
                document.getElementById("totalPurchases"),

            outstandingAmount:
                document.getElementById("outstandingAmount"),

            infoCompany:
                document.getElementById("infoCompany"),

            infoContact:
                document.getElementById("infoContact"),

            infoEmail:
                document.getElementById("infoEmail"),

            infoPhone:
                document.getElementById("infoPhone"),

            infoAddress:
                document.getElementById("infoAddress"),

            infoPaymentTerms:
                document.getElementById("infoPaymentTerms"),

            editButton:
                document.getElementById(
                    "editSupplierButton"
                ),

            archiveButton:
                document.getElementById(
                    "archiveSupplierButton"
                ),

            newPurchaseButton:
                document.getElementById(
                    "newPurchaseButton"
                )
        };


        // ---------------------------------------------------------
        // FORMATTERS
        // ---------------------------------------------------------

        function formatCurrency(value) {
            return new Intl.NumberFormat(
                "en-US",
                {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0
                }
            ).format(value);
        }


        // ---------------------------------------------------------
        // RENDER
        // ---------------------------------------------------------

        function renderSupplier() {

            elements.name.textContent =
                supplier.name;

            elements.code.textContent =
                supplier.code;

            elements.productsCount.textContent =
                supplier.products;

            elements.totalPurchases.textContent =
                formatCurrency(
                    supplier.purchases
                );

            elements.outstandingAmount.textContent =
                formatCurrency(
                    supplier.outstanding
                );

            elements.infoCompany.textContent =
                supplier.name;

            elements.infoContact.textContent =
                supplier.contact;

            elements.infoEmail.textContent =
                supplier.email;

            elements.infoEmail.href =
                `mailto:${supplier.email}`;

            elements.infoPhone.textContent =
                supplier.phone || "Not provided";

            elements.infoAddress.textContent =
                supplier.address || "Not provided";

            elements.infoPaymentTerms.textContent =
                supplier.paymentTerms;

            elements.status.textContent =
                supplier.status;

            if (
                supplier.status === "Active"
            ) {
                elements.status.className = `
                    inline-flex
                    px-3 py-1
                    rounded-full
                    bg-green-100
                    text-green-700
                    dark:bg-green-900/30
                    dark:text-green-400
                    text-sm
                    font-semibold
                `;
            } else {
                elements.status.className = `
                    inline-flex
                    px-3 py-1
                    rounded-full
                    bg-slate-100
                    text-slate-600
                    dark:bg-slate-800
                    dark:text-slate-300
                    text-sm
                    font-semibold
                `;
            }
        }


        // ---------------------------------------------------------
        // EDIT
        // ---------------------------------------------------------

        elements.editButton?.addEventListener(
            "click",
            () => {

                window.location.href =
                    `supplier_form.html?id=${supplier.id}`;
            }
        );


        // ---------------------------------------------------------
        // ARCHIVE
        // ---------------------------------------------------------

        elements.archiveButton?.addEventListener(
            "click",
            () => {

                const confirmed =
                    window.confirm(
                        `Are you sure you want to archive "${supplier.name}"?`
                    );

                if (!confirmed) {
                    return;
                }

                supplier.status =
                    "Archived";

                renderSupplier();

                elements.archiveButton.disabled =
                    true;

                showMessage(
                    "Supplier has been archived.",
                    "success"
                );
            }
        );


        // ---------------------------------------------------------
        // NEW PURCHASE
        // ---------------------------------------------------------

        elements.newPurchaseButton?.addEventListener(
            "click",
            () => {

                /*
                 * This will eventually point to the real
                 * Purchasing module.
                 */

                window.location.href =
                    `../purchasing/add_purchase.html?supplier=${supplier.id}`;
            }
        );


        // ---------------------------------------------------------
        // TOAST
        // ---------------------------------------------------------

        function showMessage(
            message,
            type = "info"
        ) {

            const toast =
                document.createElement("div");

            toast.className = `
                fixed
                top-5
                right-5
                z-[300]
                rounded-lg
                px-4 py-3
                shadow-xl
                bg-white
                dark:bg-slate-900
                border
                border-outline-variant
                dark:border-slate-700
                text-sm
            `;

            toast.textContent =
                message;

            document.body.appendChild(
                toast
            );

            window.setTimeout(() => {
                toast.remove();
            }, 3000);
        }


        // ---------------------------------------------------------
        // INITIALIZE
        // ---------------------------------------------------------

        renderSupplier();

    });

})();